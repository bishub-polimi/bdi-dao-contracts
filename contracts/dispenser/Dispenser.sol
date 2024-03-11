// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Dispenser {

    mapping (address => bool) public _reedemed;
    IERC20 public _euro;
    bytes32 public _root;

    constructor(address euro, bytes32 root) {
        _euro = IERC20(euro);
        _root = root;
    }

    function redeem(
        uint256 amount,
        bytes32[] memory proof
        ) public {
        require(verify(amount, proof) == true, "Invalid proof");
        require(_reedemed[msg.sender] != true, "Funds alredy claimed!");
        _euro.transfer(msg.sender, amount);
        _reedemed[msg.sender] = true;
    }

    function verify(
        uint256 amount,
        bytes32[] memory proof
         ) public view returns (bool) {
        bytes32 leaf =  keccak256(abi.encodePacked(msg.sender,amount));
        bytes32 computedHash = leaf;

        for (uint256 i = 0; i < proof.length; i++) {
        bytes32 proofElement = proof[i];

        if (computedHash <= proofElement) {
            // Hash(current computed hash + current element of the proof)
            computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
        } else {
            // Hash(current element of the proof + current computed hash)
            computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
        }
        }

        // Check if the computed hash (root) is equal to the provided root
        return computedHash == _root;
  }

}