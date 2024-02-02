import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";



let BdIToken: any;
let EuroCoin: any;
let BdIDao: any;
let zeroAddress = "0x0000000000000000000000000000000000000000";
let tokenAddress: any;
let owner: SignerWithAddress;
let addr1: SignerWithAddress;
let addr2: SignerWithAddress;
let addr3: SignerWithAddress;


describe("Voting Contract Tests", function () {

  before(async function () {

    [owner, addr1, addr2, addr3] = await ethers.getSigners();

    // Deploy EuroCoin contract
    EuroCoin = await ethers.deployContract("EuroCoin");
    await EuroCoin.waitForDeployment();
    console.log('EURO token deployed to:',  EuroCoin.target);

    // Deploy BdIToken contract
    BdIToken = await ethers.deployContract("BdIToken", [EuroCoin.target]);
    await BdIToken.waitForDeployment();
    tokenAddress = BdIToken.target;
    console.log('BdI token deployed to:', tokenAddress);
    
    // Deploy BdIDao contract
    BdIDao = await ethers.deployContract("BdIDao", [tokenAddress, zeroAddress, EuroCoin.target]);
    await BdIToken.waitForDeployment();
    console.log('BdI Dao deployed to:', BdIDao.target);


    // Pre-allocate some Euro funds to the DAO treasury
    await EuroCoin.mint(BdIDao.target, 999);
    var events = await EuroCoin.queryFilter("Transfer");
     events.forEach((event: { args: any; }) => {
      if ('args' in event) {
         console.log(`\n Pre-allocate some Euro funds to the DAO treasury \n Transfer Event: ${event.args}`);
      }
     });

    
  });

  it("should mint BdITokens in exchange of Euro Coins", async function () {
  // Mint some EuroCoins to the user (addr1)
  await EuroCoin.mint(addr1.address, 25);
  // Log the balance of addr1 after minting
  var balance = await EuroCoin.balanceOf(addr1.address);
  console.log(`\n Balance of addr1 BEFORE minting Dao token: ${balance} EuroCoin`);
  
  // Set the DAO contract address
  await BdIToken.setDaoContractAddress(BdIDao.target);
  // Mint BdI Tokens and check Euro balances
  let user = BdIToken.connect(addr1);
  await (EuroCoin as any).connect(addr1).approve(BdIToken.target, 25);
  let tx = await (user as any).mint(addr1.address, 25);
  await expect(tx.wait()).to.not.be.reverted;
  await tx.wait();
  balance = await EuroCoin.balanceOf(addr1.address);
  console.log(`\n Balance of addr1 AFTER minting Dao token: ${balance} EuroCoin`);
  balance = await EuroCoin.balanceOf(BdIDao.target);
  console.log(`\n Balance DAO: ${balance} EuroCoin`);

  });


  it("should create a proposal", async function () {

    const nftMarketAddress = addr3.address;
    const offerAmount = 150;
    const transferCalldata = BdIDao.interface.encodeFunctionData('transferEuroCoin', [nftMarketAddress, offerAmount]);
    // Test the creation of a proposal 
    let tx = await BdIDao.propose([BdIDao.target], [0], [transferCalldata], "Proposal #1: Offer 150 Euro to buy NFT");
    await expect(tx.wait()).to.not.be.reverted;
    await tx.wait();
    var events = await BdIDao.queryFilter("ProposalCreated");
    events.forEach((event: { args: any; }) => {
      if ('args' in event) {
        const decodedData = BdIDao.interface.decodeFunctionData('transferEuroCoin', event.args.calldatas[0]);
         console.log(`\n ProposalCreated Event:
           proposalId: ${event.args.proposalId},
           proposer: ${event.args.proposer},
           targets: ${JSON.stringify(event.args.targets)},
           values: ${JSON.stringify(event.args.values)},
           signatures: ${JSON.stringify(event.args.signatures)},
           decoded calldatas: ${decodedData},
           voteStart: ${event.args.voteStart},
           voteEnd: ${event.args.voteEnd},
           description: ${event.args.description}`);
      }
     });

    
  });
});
