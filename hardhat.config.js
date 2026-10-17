import { defineConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const MONAD_TESTNET_RPC = process.env.MONAD_TESTNET_RPC || "https://testnet-rpc.monad.xyz";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001";

const config = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    monadTestnet: {
      url: MONAD_TESTNET_RPC,
      chainId: 10143,
      accounts: [PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: {
      monadTestnet: "any",
    },
    customChains: [
      {
        network: "monadTestnet",
        chainId: 10143,
        urls: {
          apiURL: "https://testnet.monadscan.com/api",
          browserURL: "https://testnet.monadscan.com",
        },
      },
    ],
  },
};

export default config;
