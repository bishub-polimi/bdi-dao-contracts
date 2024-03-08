// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./DispenserTreasury.sol";

contract Dispenser {

    DispenserTreasury _treasury;
    mapping (address => bool) _reedemed;

    constructor(address treasury){
        _treasury = DispenserTreasury(treasury);
    }

    function redeem(
            bytes32[] memory proof,
            uint256 amount,
            uint256 index
        ) public {
        require(_reedemed[msg.sender] != true, "Already redeemed");
        require(verify(proof,amount,index) == true, "You are not eligible for redeem");
        _treasury._token().transferFrom(address(_treasury),msg.sender,amount);
        _reedemed[msg.sender] = true;
    }

    function verify(
        bytes32[] memory proof,
        uint256 amount,
        uint256 index
    ) public view returns (bool) {
        bytes32 leaf =  keccak256(abi.encodePacked(msg.sender,amount));
        bytes32 hash = leaf;

        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 proofElement = proof[i];
            if (index % 2 == 0) {
                hash = keccak256(abi.encodePacked(hash, proofElement));
            } else {
                hash = keccak256(abi.encodePacked(proofElement, hash));
            }
            index = index / 2;
        }

        return hash == _treasury._root();
    }

}