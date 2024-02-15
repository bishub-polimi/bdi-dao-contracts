import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

const TIMELOCK_DELAY = 300;

let BdIToken: any;
let EuroCoin: any;
let TimeLock: any;
let BdIDao: any;
let tokenAddress: any;
let timelockAddress: any;
let propID: BigInt;
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
    console.log(' EURO token deployed to:',  EuroCoin.target);

    // Deploy BdIToken contract
    BdIToken = await ethers.deployContract("BdIToken", [EuroCoin.target]);
    await BdIToken.waitForDeployment();
    tokenAddress = BdIToken.target;
    console.log(' BdI token deployed to:', tokenAddress);

    // Deploy TimeLock contract
    TimeLock = await ethers.deployContract("TimeLock", [TIMELOCK_DELAY,[ethers.ZeroAddress],[ethers.ZeroAddress],owner.address]);
    await TimeLock.waitForDeployment();
    timelockAddress = await TimeLock.getAddress();
    console.log(' TimeLock deployed to:', timelockAddress);
    
    // Deploy BdIDao contract
    BdIDao = await ethers.deployContract("BdIDao", [tokenAddress, timelockAddress, EuroCoin.target]);
    await BdIDao.waitForDeployment();
    console.log(' BdI Dao deployed to:', BdIDao.target);

    // Grant PROPOSER_ROLE in TimeLock to DAO and remove owner from Timelock administrators
    const grantRoleTx = await TimeLock.grantRole(ethers.keccak256(ethers.toUtf8Bytes("PROPOSER_ROLE")),BdIDao.target);
    await grantRoleTx.wait();
    console.log(` PROPOSER_ROLE on Timelock granted to DAO with tx ${grantRoleTx.hash}`);

    const changeAdminTx = await TimeLock.grantRole(ethers.keccak256(ethers.toUtf8Bytes("TIMELOCK_ADMIN_ROLE")),timelockAddress);
    await changeAdminTx.wait();
    console.log(` TIMELOCK_ADMIN_ROLE on Timelock granted to Timelock itself with tx ${grantRoleTx.hash}`);

    // Transfer governance token ownership to DAO
    const changeOwnerTx = await BdIToken.transferOwnership(BdIDao.target);
    await changeOwnerTx.wait();
    console.log(` Governance token ownership transferred to DAO with tx ${changeOwnerTx.hash}`);

    // Pre-mint some euros to the users
    let users = [addr1, addr2, addr3];
    for(const u of users){
      const mintTx = await EuroCoin.mint(u.address,100000000);
      await mintTx.wait();
      console.log(` User ${u.address} has received 100000000 EuroCoin`);
    }
    
  });

    it("should mint BdITokens in exchange of Euro Coins", async function () {

    const tokenPrice = 10000000;
    const amountToBuy = 1;

    // Log the balance of addr1 after minting
    var balance = []; 
    balance[0] = await EuroCoin.balanceOf(addr1.address);
    balance[1] = await BdIToken.balanceOf(addr1.address);
    console.log(`\n Balance of addr1 BEFORE minting Dao token: ${balance[0]} EuroCoin and ${balance[1]} BdIToken`);
    
    // Mint BdI Tokens and check Euro balances
    const user = BdIDao.connect(addr1); //BdIToken.connect(addr1);
    const approveTx = await (EuroCoin as any).connect(addr1).approve(BdIDao.target, amountToBuy*tokenPrice);
    await approveTx.wait();
    const mintTx = await (user as any).mint(amountToBuy);
    await expect(mintTx).to.not.be.reverted;
    await mintTx.wait();

    balance = []; 
    balance[0] = await EuroCoin.balanceOf(addr1.address);
    balance[1] = await BdIToken.balanceOf(addr1.address);
    console.log(`\n Balance of addr1 AFTER minting Dao token: ${balance[0]} EuroCoin and ${balance[1]} BdIToken`);
    balance = await EuroCoin.balanceOf(BdIDao.target);
    console.log(`\n Balance DAO: ${balance} EuroCoin`);

  });


  it("should create a proposal", async function () {
    const nftMarketAddress = addr3.address;
    const offerAmount = 150;
    const transferCalldata = EuroCoin.interface.encodeFunctionData('transfer', [nftMarketAddress, offerAmount]);
    // Test the creation of a proposal 
    let tx = await BdIDao.propose([EuroCoin.target], [0], [transferCalldata], "Proposal #1: Offer 150 Euro to buy NFT");
    await expect(tx.wait()).to.not.be.reverted;
    await tx.wait();
    var events = await BdIDao.queryFilter("ProposalCreated");
    events.forEach((event: { args: any; }) => {
      if ('args' in event) {
        propID = event.args.proposalId;
        const decodedData = EuroCoin.interface.decodeFunctionData('transfer', event.args.calldatas[0]);
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

  it("should delegate votes", async function () {

    var votingPower = await BdIToken.getVotes(addr1.address);
    console.log(`\n Voting power of addr1 before delegate: ${votingPower}`);
    let user = await BdIToken.connect(addr1)
    let tx = await (user as any).delegate(addr1.address);
    await expect(tx.wait()).to.not.be.reverted;
    await tx.wait();
     // Check that the self-delegation was successful
    const delegatedBalance = await BdIToken.delegates(addr1.address);
    expect(delegatedBalance).to.equal(addr1.address);
    // log emitted event
    var events = await BdIToken.queryFilter("DelegateVotesChanged");
    events.forEach((event: { args: any; }) => {
      if ('args' in event) {
        console.log(`\n DelegateVotesChanged event:
          account: ${event.args.delegate},
          previousVotes: ${event.args.previousVotes},
          newVotes: ${event.args.newVotes}`);
      }
     });

    var newVotingPower = await BdIToken.getVotes(addr1.address);
    console.log(`\n Voting power of addr1 after delegate: ${newVotingPower}`);

   });

   it("should cast votes", async function () {
    const proposalId = propID;
    const support = 1; //1 for voting in favor
    // Cast the vote
    let tx = await BdIDao.connect(addr1).castVote(proposalId, support);
    await expect(tx.wait()).to.not.be.reverted;

    // Log the event details
    var events = await BdIDao.queryFilter("VoteCast");
    events.forEach((event: { args: any; }) => {
      if ('args' in event) {
        console.log(`\n VoteCast event:
          Voter: ${event.args.voter},
          ProposalId: ${event.args.proposalId.toString()},
          Support: ${event.args.support},
          Weight: ${event.args.weight},
          Reason: ${event.args.reason}`);
      }
     });
  });


});
