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
    sepolia : {
      url: process.env.RPC_URL,
      accounts: [`${process.env.PRIVATE_KEY}`]
    }
  },
  defaultNetwork: 'hardhat',
};

export default config;
