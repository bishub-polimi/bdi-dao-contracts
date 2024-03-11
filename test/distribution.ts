import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
const { MerkleTree } = require('merkletreejs');

let owner: SignerWithAddress;
let addr1: SignerWithAddress;
let addr2: SignerWithAddress;
let addr3: SignerWithAddress;

let EuroCoin: any;
let Dispenser: any;
let root: any;
let tree: any;


describe("Revenue Distribution Tests", function () {

    before(async function () {

        [owner, addr1, addr2, addr3] = await ethers.getSigners();

        // Deploy EuroCoin contract
        EuroCoin = await ethers.deployContract("EuroCoin");
        await EuroCoin.waitForDeployment();
        console.log(' EURO token deployed to:',  EuroCoin.target);

        ethers.solidityPacked

        // Generate Merkle tree using user address + user revenue as leaves

        const leaves = [
            ethers.keccak256(ethers.solidityPacked(["address","uint"], [addr1.address, 10000000])),
            ethers.keccak256(ethers.solidityPacked(["address","uint"], [addr2.address, 15000000])),
            ethers.keccak256(ethers.solidityPacked(["address","uint"], [addr3.address, 5000000]))
        ];

        tree = new MerkleTree(leaves,ethers.keccak256,{ sort: true })
        root = tree.getHexRoot();

        // Deploy Dispenser contract
        Dispenser = await ethers.deployContract("Dispenser",[EuroCoin.target,root]);
        await Dispenser.waitForDeployment();
        console.log(' Dispenser deployed to:',  Dispenser.target);

        // Send funds to the dispenser
        const mintTx = await EuroCoin.mint(Dispenser.target,100000000);
        await mintTx.wait();
        console.log(` Dispenser has received 100000000 EuroCoin`);

    })

    it("valid proof should be verified", async function () {
        const leaf1 = ethers.keccak256(ethers.solidityPacked(["address","uint"], [addr1.address, 10000000]));     
        const proof = tree.getHexProof(leaf1);
        let res = await Dispenser.connect(addr1).verify(10000000,proof);
        expect(res).to.eql(true);
    });

    it("user should be able to claim his revenue", async function () {
        const balanceBefore = await EuroCoin.balanceOf(addr1.address);
        const leaf1 = ethers.keccak256(ethers.solidityPacked(["address","uint"], [addr1.address, 10000000]));     
        const proof = tree.getHexProof(leaf1);
        let redeemTx = await Dispenser.connect(addr1).redeem(10000000,proof);
        await redeemTx.wait();
        const balanceAfter = await EuroCoin.balanceOf(addr1.address);
        expect(balanceAfter).to.eql(balanceBefore + BigInt(10000000));
    });

    it("user shouldn't be able to claim his revenue twice", async function () {
        const leaf1 = ethers.keccak256(ethers.solidityPacked(["address","uint"], [addr1.address, 10000000]));     
        const proof = tree.getHexProof(leaf1);
        let redeemTx = Dispenser.connect(addr1).redeem(10000000,proof);
        expect(redeemTx).to.be.reverted;
    });

})