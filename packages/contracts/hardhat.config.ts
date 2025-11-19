import { defineConfig } from "hardhat/config";
import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import hardhatEthers from "@nomicfoundation/hardhat-ethers";
import * as dotenv from "dotenv";

console.log("hardhatEthers plugin:", hardhatEthers);

dotenv.config();

const RAYLS_RPC_URL = process.env.RAYLS_RPC_URL || "";
const RAYLS_CHAIN_ID = process.env.RAYLS_CHAIN_ID
  ? parseInt(process.env.RAYLS_CHAIN_ID, 10)
  : 0;
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

export default defineConfig({
  plugins: [hardhatToolboxMochaEthers, hardhatEthers],
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      type: "edr-simulated",
      chainType: "l1"
    },
    ...(RAYLS_RPC_URL && PRIVATE_KEY
      ? {
          rayls: {
            type: "http",
            chainType: "generic",
            url: RAYLS_RPC_URL,
            chainId: RAYLS_CHAIN_ID || 0,
            accounts: [PRIVATE_KEY]
          }
        }
      : {})
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
});
