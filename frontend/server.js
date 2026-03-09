// frontend/server.js — Express server for the Ethereum Voting frontend
// Uses PostgreSQL for voter authentication — no hardcoded credentials
const express = require("express");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Redirect logs to file for debugging
const logFile = fs.createWriteStream(path.join(__dirname, 'server.log'), { flags: 'a' });
const logStdout = process.stdout;
console.log = function () {
    logFile.write(new Date().toISOString() + ' ' + Array.from(arguments).join(' ') + '\n');
    logStdout.write(Array.from(arguments).join(' ') + '\n');
};
console.error = console.log;
console.warn = console.log;

// ── PostgreSQL connection pool ─────────────────────────────────────────────
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },  // required for Supabase
    max: 10,
    idleTimeoutMillis: 30000,
});

pool.on("error", (err) => console.error("PostgreSQL pool error:", err));

// Test DB connection at startup
pool.query("SELECT 1").then(() => {
    console.log("✅  PostgreSQL connected");
}).catch(err => {
    console.error("❌  PostgreSQL connection failed:", err.message);
    console.error("    Make sure DATABASE_URL is set in .env and the DB is reachable.");
});

// ── Static assets ──────────────────────────────────────────────────────────
app.use("/src", express.static(path.join(__dirname, "src")));
app.use("/models", express.static(path.join(__dirname, "public/models")));
app.use("/public", express.static(path.join(__dirname, "public")));

// ── JWT auth middleware ────────────────────────────────────────────────────
const JWT_SECRET = process.env.SECRET_KEY;
if (!JWT_SECRET) {
    console.error("❌  SECRET_KEY not set in .env — JWT will fail!");
}

const authorizeUser = (req, res, next) => {
    let token = req.query.Authorization?.split("Bearer ")[1];
    if (!token && req.headers.authorization) {
        token = req.headers.authorization.split("Bearer ")[1];
    }

    if (!token) {
        console.warn(`[AUTH] No token found for ${req.path}`);
        return res.redirect("/");
    }

    try {
        req.user = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
        next();
    } catch (err) {
        console.error(`[AUTH] Invalid token for ${req.path}:`, err.message);
        return res.redirect("/");
    }
};

// ── HTML Routes ────────────────────────────────────────────────────────────
app.get("/", (_req, res) => res.sendFile(path.join(__dirname, "src/login.html")));
app.get("/register", (_req, res) => res.sendFile(path.join(__dirname, "src/register.html")));
app.get("/vote", authorizeUser, (_req, res) => res.sendFile(path.join(__dirname, "src/vote.html")));
app.get("/admin", authorizeUser, (req, res) => {
    if (req.user.role !== "admin") return res.status(403).sendFile(path.join(__dirname, "src/login.html"));
    res.sendFile(path.join(__dirname, "src/admin.html"));
});
app.get("/results", (_req, res) => res.sendFile(path.join(__dirname, "src/results.html")));
app.get("/favicon.ico", (_req, res) => res.status(204).end());

// ── Contract JSON ──────────────────────────────────────────────────────────
app.get("/contract.json", (_req, res) => {
    const contractPath = path.join(__dirname, "src/contract.json");
    if (fs.existsSync(contractPath)) {
        res.sendFile(contractPath);
    } else {
        res.status(404).json({ error: "Contract not deployed yet. Run: npm run deploy:local" });
    }
});

// ── POST /login — authenticate against PostgreSQL ─────────────────────────
app.get("/login", async (req, res) => {
    const { voter_id, password } = req.query;

    if (!voter_id || !password) {
        return res.status(400).json({ message: "voter_id and password are required" });
    }

    try {
        // Fetch voter from DB
        const { rows } = await pool.query(
            "SELECT voter_id, hashed_password, role, full_name, is_active FROM voters WHERE voter_id = $1",
            [voter_id.trim()]
        );

        if (rows.length === 0) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Compare password with bcrypt hash
        const voter = rows[0];
        const valid = await bcrypt.compare(password, voter.hashed_password);
        if (!valid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Return basic token (legacy fallback for older scripts)
        const token = jwt.sign(
            { id: voter.voter_id, role: voter.role, name: voter.full_name },
            JWT_SECRET,
            { expiresIn: '2h' }
        );
        res.json({ token, role: voter.role, full_name: voter.full_name });
    } catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
});

// ────────────────────────────────────────────────────────────────────────
// AUTHENTICATION
// ────────────────────────────────────────────────────────────────────────

app.post('/api/login', async (req, res) => {
    const { voter_id, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM voters WHERE voter_id = $1', [voter_id]);

        // Log attempt
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        if (result.rows.length === 0) {
            await pool.query('INSERT INTO audit_log (voter_id, action, ip_address) VALUES ($1, $2, $3)', [voter_id, 'login_failed', ip]);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        if (user.status === 'pending') {
            await pool.query('INSERT INTO audit_log (voter_id, action, ip_address) VALUES ($1, $2, $3)', [voter_id, 'login_failed_pending', ip]);
            return res.status(403).json({ error: 'Account pending admin approval', pending: true });
        }

        const match = await bcrypt.compare(password, user.hashed_password);
        if (!match) {
            await pool.query('INSERT INTO audit_log (voter_id, action, ip_address) VALUES ($1, $2, $3)', [voter_id, 'login_failed', ip]);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        await pool.query('INSERT INTO audit_log (voter_id, action, ip_address) VALUES ($1, $2, $3)', [voter_id, 'login_success', ip]);

        const token = jwt.sign(
            { id: user.voter_id, role: user.role, name: user.full_name, booth: user.booth_id },
            JWT_SECRET,
            { expiresIn: '2h' }
        );
        res.json({ token, role: user.role, name: user.full_name });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Database error' });
    }
});

app.post('/api/register', async (req, res) => {
    const { voter_id, password, full_name, email, booth_id, face_embedding } = req.body;
    try {
        // Validate inputs
        if (!voter_id || !password || !full_name || !face_embedding) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert as pending
        await pool.query(`
            INSERT INTO voters (voter_id, hashed_password, role, full_name, email, booth_id, status, face_embedding)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
            voter_id,
            hashedPassword,
            'voter',
            full_name,
            email || null,
            booth_id || 'DEFAULT',
            'pending',
            JSON.stringify(face_embedding)
        ]);

        res.status(201).json({ message: 'Registration successful. Pending admin approval.' });
    } catch (e) {
        console.error(e);
        if (e.code === '23505') { // unique violation
            return res.status(409).json({ error: 'Voter ID or Email already exists' });
        }
        res.status(500).json({ error: 'Registration failed' });
    }
});

// ── Utility: Euclidean Distance for Face Embeddings ──────────────────────
function calculateEuclideanDistance(desc1, desc2) {
    if (desc1.length !== desc2.length) return 1.0;
    let sum = 0;
    for (let i = 0; i < desc1.length; i++) {
        sum += Math.pow(desc1[i] - desc2[i], 2);
    }
    return Math.sqrt(sum);
}

// ── Server-Side Blockchain Transaction Setup ─────────────────────────────
const { ethers } = require("ethers");
let contract = null;
let masterWallet = null;

async function setupBlockchain() {
    try {
        const contractPath = path.join(__dirname, "src/contract.json");
        if (!fs.existsSync(contractPath)) return console.log("⏳ Contract not deployed yet. Skipping blockchain setup.");

        const contractData = JSON.parse(fs.readFileSync(contractPath, "utf8"));

        // Use the live RPC URL from .env if available, otherwise fallback to local Hardhat
        const rpcUrl = process.env.ETH_RPC_URL || "http://127.0.0.1:8545";
        const provider = new ethers.JsonRpcProvider(rpcUrl);

        // Strictly require MASTER_WALLET_PRIVATE_KEY from .env
        const privateKey = process.env.MASTER_WALLET_PRIVATE_KEY;
        if (!privateKey) {
            console.error("❌  CRITICAL: MASTER_WALLET_PRIVATE_KEY is missing from .env");
            console.error("    The server cannot sign voting transactions without this key. Please add it to your .env file.");
            return;
        }

        masterWallet = new ethers.Wallet(privateKey, provider);

        contract = new ethers.Contract(contractData.address, contractData.abi, masterWallet);
        console.log("✅  Server-side Web3 Wallet Ready:", masterWallet.address);
    } catch (e) {
        console.error("❌  Failed to setup server-side blockchain:", e);
    }
}
setupBlockchain();

// ── POST /api/cast-vote — Biometric Vote Casting ─────────────────────────
app.post("/api/cast-vote", authorizeUser, async (req, res) => {
    const { electionId, candidateId, face_embedding } = req.body;
    const voterId = req.user.id || req.user.voter_id;

    if (!contract || !masterWallet) return res.status(500).json({ error: "Server blockchain connection not ready" });
    if (!electionId || !candidateId || !face_embedding) return res.status(400).json({ error: "Missing required voting parameters." });

    try {
        // 1. Fetch voter from DB to get their stored biometric profile
        const { rows } = await pool.query(
            "SELECT face_embedding, status FROM voters WHERE voter_id = $1",
            [voterId]
        );

        if (rows.length === 0) return res.status(404).json({ error: "Voter not found in database." });

        const voter = rows[0];

        if (voter.status !== 'approved') return res.status(403).json({ error: "Voter account is not approved by administrator." });
        if (!voter.face_embedding) return res.status(400).json({ error: "No biometric profile found on file. Please re-register." });

        // 2. Perform Biometric Verification (Face match)
        let storedEmbedding;
        try {
            storedEmbedding = Array.isArray(voter.face_embedding) ? voter.face_embedding : JSON.parse(voter.face_embedding);
        } catch (e) { return res.status(500).json({ error: "Stored biometric data is corrupted." }); }

        const distance = calculateEuclideanDistance(face_embedding, storedEmbedding);

        // Standard threshold is 0.6 (Face-api.js default for ssdMobilenetv1)
        if (distance > 0.6) {
            console.warn(`[BIOMETRIC REJECT] ID: ${voterId}, Distance: ${distance.toFixed(3)}`);
            await pool.query('INSERT INTO audit_log (voter_id, action, ip_address, details) VALUES ($1, $2, $3, $4)',
                [voterId, 'biometric_failure', req.ip || req.socket.remoteAddress, `Distance: ${distance}`]);
            return res.status(401).json({ error: "Biometric face verification failed. Identity did not match." });
        }

        // 3. Generate a voter hash for the blockchain to track double voting securely
        const voterHash = ethers.id(voterId + electionId + process.env.SECRET_KEY);

        console.log(`[VOTING] Attempting castVote: Election=${electionId}, VoterId=${voterId}, Candidate=${candidateId}, Hash=${voterHash}`);

        // 4. Send transaction to blockchain via Master Wallet
        const tx = await contract.castVote(electionId, voterHash, candidateId);

        console.log(`[VOTE SUBMITTED] Hash: ${tx.hash}`);
        const receipt = await tx.wait(); // Wait for confirmation

        try {
            await pool.query('INSERT INTO audit_log (voter_id, action, ip_address, details) VALUES ($1, $2, $3, $4)',
                [voterId, 'vote_cast', req.ip || req.socket.remoteAddress, `Election: ${electionId}, Tx: ${tx.hash}`]);
        } catch (logErr) {
            console.error("[LOG ERROR] Failed to write audit log:", logErr.message);
        }

        res.json({ success: true, transactionHash: tx.hash });
    } catch (e) {
        console.error("Blockchain Vote Error Details:", e);

        // Ethers v6 error handling
        const errorMessage = e.message || "";
        const revertReason = e.reason || (e.info && e.info.error && e.info.error.message) || "";

        if (errorMessage.includes("Already voted") || revertReason.includes("Already voted")) {
            console.warn(`[VOTE REJECT] Voter ${voterId} already voted.`);
            return res.status(403).json({ error: "You have already cast a vote in this election." });
        }

        if (errorMessage.includes("Invalid candidate") || revertReason.includes("Invalid candidate")) {
            return res.status(400).json({ error: "Invalid candidate selected." });
        }

        res.status(500).json({
            error: "Failed to cast vote on blockchain.",
            details: revertReason || errorMessage
        });
    }
});

// ── GET /api/me — return info about the current logged-in voter ───────────
app.get("/api/me", authorizeUser, async (req, res) => {
    try {
        const { rows } = await pool.query(
            "SELECT voter_id, full_name, email, role, booth_id, created_at FROM voters WHERE voter_id = $1",
            [req.user.id || req.user.voter_id] // Handle both payload versions
        );
        if (rows.length === 0) return res.status(404).json({ message: "Voter not found" });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ message: "Database error" });
    }
});

// ── GET /api/voters — admin only: list all voters ─────────────────────────
app.get("/api/voters", authorizeUser, async (req, res) => {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
    try {
        const { rows } = await pool.query(
            "SELECT voter_id, full_name, email, role, booth_id, is_active, status, created_at FROM voters ORDER BY created_at DESC"
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: "Database error" });
    }
});

// ── POST /api/voters — admin only: create a new voter ────────────────────
app.post("/api/voters", authorizeUser, async (req, res) => {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
    const { voter_id, password, full_name, email, booth_id, role = "voter" } = req.body;
    if (!voter_id || !password) return res.status(400).json({ message: "voter_id and password are required" });
    try {
        const hashed = await bcrypt.hash(password, 12);
        const { rows } = await pool.query(
            `INSERT INTO voters (voter_id, hashed_password, role, full_name, email, booth_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'approved') RETURNING voter_id, role, full_name, email, booth_id`,
            [voter_id, hashed, role, full_name || null, email || null, booth_id || null]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        if (err.code === "23505") return res.status(409).json({ message: "voter_id or email already exists" });
        res.status(500).json({ message: "Database error" });
    }
});

// ── DELETE /api/voters/:id — admin only ─────────────────────────────
app.delete("/api/voters/:id", authorizeUser, async (req, res) => {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
    try {
        if (req.params.id === "admin") return res.status(400).json({ message: "Cannot delete the main admin" });
        await pool.query("DELETE FROM voters WHERE voter_id = $1", [req.params.id]);
        res.json({ success: true, message: "Voter deleted" });
    } catch (e) { res.status(500).json({ error: 'Database error' }); }
});

// Approve pending voter
app.put('/api/voters/:id/approve', authorizeUser, async (req, res) => {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
    try {
        const result = await pool.query('UPDATE voters SET status = $1 WHERE voter_id = $2 RETURNING *', ['approved', req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Voter not found' });
        res.json({ success: true, voter_id: req.params.id, status: 'approved' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to approve voter' });
    }
});

// ── GET /api/audit-log — admin only ──────────────────────────────────────
app.get("/api/audit-log", authorizeUser, async (req, res) => {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
    const { rows } = await pool.query(
        "SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 100"
    );
    res.json(rows);
});

// ── Health check ──────────────────────────────────────────────────────────
app.get("/health", async (_req, res) => {
    try {
        await pool.query("SELECT 1");
        res.json({ status: "ok", database: "connected" });
    } catch {
        res.status(503).json({ status: "error", database: "disconnected" });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`🚀  Voting server running → http://localhost:${PORT}`);
    console.log(`    Admin portal → http://localhost:${PORT}/admin`);
    console.log(`    Results      → http://localhost:${PORT}/results`);
});
