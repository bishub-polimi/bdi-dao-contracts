import { ethers } from "hardhat";
import * as hre from 'hardhat';

async function main() {

  const [owner] = await ethers.getSigners();

  // Deploy EuroCoin contract
  const EuroCoin = await ethers.deployContract("EuroCoin");
  await EuroCoin.waitForDeployment();
  const euroCoinAddr = await EuroCoin.getAddress();
  console.log(' EURO token deployed to:', euroCoinAddr);

  // Deploy FiveSeasonsHotel contract
  const FiveSeasons = await ethers.deployContract("FiveSeasonsHotel",[euroCoinAddr]);
  await FiveSeasons.waitForDeployment();
  const fiveSeasonsAddr = await FiveSeasons.getAddress();
  console.log(' FiveSeasonsHotel token deployed to:', fiveSeasonsAddr);

  // Deploy BdIToken contract
  const BdIToken = await ethers.deployContract("BdIToken", [euroCoinAddr]);
  await BdIToken.waitForDeployment();
  const govTokenAddr = await BdIToken.getAddress();
  console.log(' BdI token deployed to:', govTokenAddr);

  // Deploy TimeLock contract
  const TimeLock = await ethers.deployContract("TimeLock", [300,[ethers.ZeroAddress],[ethers.ZeroAddress],owner.address]);
  await TimeLock.waitForDeployment();
  const timelockAddr = await TimeLock.getAddress();
  console.log(' TimeLock deployed to:', timelockAddr);

  // Deploy BdIDao contract
  const BdIDao = await ethers.deployContract("BdIDao", [govTokenAddr, timelockAddr, euroCoinAddr]);
  await BdIDao.waitForDeployment();
  const daoAddr = await BdIDao.getAddress();
  console.log(' BdI Dao deployed to:', daoAddr);

  // Grant PROPOSER_ROLE in TimeLock to DAO and remove owner from Timelock administrators
  const grantRoleTx = await TimeLock.grantRole(ethers.keccak256(ethers.toUtf8Bytes("PROPOSER_ROLE")),daoAddr);
  await grantRoleTx.wait();
  console.log(` PROPOSER_ROLE on Timelock granted to DAO with tx ${grantRoleTx.hash}`);

  const changeAdminTx = await TimeLock.grantRole(ethers.keccak256(ethers.toUtf8Bytes("TIMELOCK_ADMIN_ROLE")),timelockAddr);
  await changeAdminTx.wait();
  console.log(` TIMELOCK_ADMIN_ROLE on Timelock granted to Timelock itself with tx ${grantRoleTx.hash}`);

  // Transfer governance token ownership to DAO
  const changeOwnerTx = await BdIToken.transferOwnership(BdIDao.target);
  await changeOwnerTx.wait();
  console.log(` Governance token ownership transferred to DAO with tx ${changeOwnerTx.hash}`);

  if(process.env.ETHERSCAN_API_KEY != undefined && process.env.ETHERSCAN_API_KEY != ''){
    // Try to verify contracts

    // EuroCoin
    try{
      await hre.run("verify:verify", {
        address: euroCoinAddr,
        contract: "contracts/EuroCoin.sol:EuroCoin",
        constructorArguments: []
      });
    } catch (e) {
      console.log(e)
    }

    // FiveSeasonsHotel
    try{
      await hre.run("verify:verify", {
        address: fiveSeasonsAddr,
        contract: "contracts/FiveSeasonsHotel.sol:FiveSeasonsHotel",
        constructorArguments: [euroCoinAddr]
      });
    } catch (e) {
      console.log(e)
    }

    // BdIToken
    try{
      await hre.run("verify:verify", {
        address: govTokenAddr,
        contract: "contracts/BdIToken.sol:BdIToken",
        constructorArguments: [euroCoinAddr]
      });
    } catch (e) {
      console.log(e)
    }

    // TimeLock
    try{
      await hre.run("verify:verify", {
        address: timelockAddr,
        contract: "contracts/TimeLock.sol:TimeLock",
        constructorArguments: [300,[ethers.ZeroAddress],[ethers.ZeroAddress],owner.address]
      });
    } catch (e) {
      console.log(e)
    }

    // BdIDao
    try{
      await hre.run("verify:verify", {
        address: daoAddr,
        contract: "contracts/BdIDao.sol:BdIDao",
        constructorArguments: [govTokenAddr, timelockAddr, euroCoinAddr]
      });
    } catch (e) {
      console.log(e)
    }

  }

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
