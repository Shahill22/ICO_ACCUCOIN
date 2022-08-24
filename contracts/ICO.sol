// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./ACCUCoin.sol";
contract ICO {
    ACCUCoin token;
    uint256 public constant rate=3000; //Number of tokens per ether
    uint256 public raisedAmount = 0;
    address payable public  owner;
    uint256 public constant initialTokens = 100000000;
    bool public initialized;
    //token constructor
    constructor(address _tokenAddr){
        token = ACCUCoin(_tokenAddr);
    }
    modifier onlyOwner() {
        require(msg.sender == owner); 
        _;
    }
    function buyTokens() public payable {
        uint256 weiAmount = msg.value; // Calculate tokens to sell
        uint256 tokens = weiAmount * rate;
        raisedAmount = msg.value; // Increment raised amount
        token.transfer(msg.sender, tokens); // Send tokens to buyer
        owner.transfer(msg.value);// Send money to owner
    }

}