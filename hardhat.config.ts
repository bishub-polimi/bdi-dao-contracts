import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ethers";
require("dotenv").config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.22",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    },
  },
  networks : {
    mumbai : {
      url: process.env.RPC_URL,
      accounts: [`${process.env.PRIVATE_KEY}`]
    }
  },
  defaultNetwork: 'hardhat',
  etherscan: {
    apiKey: {
      polygonMumbai: process.env.ETHERSCAN_API_KEY ? process.env.ETHERSCAN_API_KEY : ''
    }
  }
};

export default config;
