require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Local Hardhat network (default when running `npx hardhat node`)
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    // Ganache (if preferred)
    ganache: {
      url: process.env.GANACHE_URL || "http://127.0.0.1:7545",
      chainId: 1337,
    },
    // Live Network (Sepolia, etc.)
    live: {
      url: process.env.ETH_RPC_URL || "",
      accounts: process.env.MASTER_WALLET_PRIVATE_KEY ? [process.env.MASTER_WALLET_PRIVATE_KEY] : [],
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
