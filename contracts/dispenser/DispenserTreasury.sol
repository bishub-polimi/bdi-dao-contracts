// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DispenserTreasury is Ownable {

    bool public _depositLocked;
    uint256 public _totalFunds;
    ERC20 public _token;
    bytes32 public _root;
    address public _governor;

    constructor(address token, address governor) Ownable(msg.sender) {
        _depositLocked = false;
        _token = ERC20(token);
        _governor = governor;
    }

    function deposit(uint256 amount) public onlyOwner {
        require(_depositLocked != true, "Deposit is locked");
        require(_token.allowance(_governor, address(this)) >= amount, "Not enough allowance");
        _token.transferFrom(_governor, address(this), amount);
        _totalFunds = amount;
        _depositLocked = true;
    }

    function grantAllowance(address dispenser) public onlyOwner {
        require(_depositLocked != false, "Deposit not locked yet");
        _token.approve(dispenser, _totalFunds);
    }

    function setRoot(bytes32 root) public onlyOwner {
        _root = root;
    }

}