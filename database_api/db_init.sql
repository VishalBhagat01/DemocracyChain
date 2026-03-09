-- ============================================================
-- ethereum_voting — Fresh Database Schema
-- Run AFTER db_reset.sql
-- ============================================================

-- ── Voters / Users table (authentication only) ──────────────
-- This is what the Ethereum voting project needs from the DB:
-- just who is allowed to log in and what role they have.
-- All actual voting data lives on the Ethereum blockchain.

CREATE TABLE IF NOT EXISTS voters (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voter_id          VARCHAR(100) UNIQUE NOT NULL,     -- login username (e.g. "voter001")
    hashed_password   TEXT NOT NULL,                    -- bcrypt hash
    role              VARCHAR(20) NOT NULL DEFAULT 'voter'
                        CHECK (role IN ('admin', 'voter', 'auditor')),
    full_name         VARCHAR(255),
    email             VARCHAR(255) UNIQUE,
    booth_id          VARCHAR(50),                      -- which booth they belong to
    is_active         BOOLEAN DEFAULT TRUE,
    status            VARCHAR(50) DEFAULT 'approved',   -- 'pending' or 'approved'
    face_embedding    JSONB,                            -- Stores 128-d face-api.js embedding array
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── Audit log (login events, vote attempt timestamps) ────────
CREATE TABLE IF NOT EXISTS audit_log (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voter_id    VARCHAR(100),                           -- references voters.voter_id
    action      VARCHAR(100) NOT NULL,                  -- 'login', 'vote_attempt', 'logout'
    ip_address  TEXT,
    details     TEXT,
    metadata    JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_voters_voter_id   ON voters(voter_id);
CREATE INDEX IF NOT EXISTS idx_voters_email      ON voters(email);
CREATE INDEX IF NOT EXISTS idx_voters_role       ON voters(role);
CREATE INDEX IF NOT EXISTS idx_audit_voter_id    ON audit_log(voter_id);
CREATE INDEX IF NOT EXISTS idx_audit_created     ON audit_log(created_at);

-- ── Trigger: auto-update updated_at on voters ────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_voters_updated_at ON voters;
CREATE TRIGGER set_voters_updated_at
    BEFORE UPDATE ON voters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

SELECT 'Schema created successfully.' AS status;
