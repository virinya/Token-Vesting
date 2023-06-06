// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract JunJunToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("JunJunToken", "JUN") {
        _mint(msg.sender, initialSupply);
    }

    function faucet(uint256 amount) public {
        _mint(msg.sender, amount);
    }
}