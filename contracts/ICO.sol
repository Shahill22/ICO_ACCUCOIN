// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ACCUCoin.sol";

contract ICO is Ownable {
    ACCUCoin public token;
    AggregatorV3Interface internal priceFeed;

    uint256 public constant preSaleQuantity = 30000000 * 1e18; //30 Million
    uint256 public constant preSaleValue = 0.01 * 1e18; //0.01 USD per ACCUCoin
    uint256 public constant seedSaleQuantity = 50000000 * 1e18; //50 Million
    uint256 public constant seedSaleValue = 0.02 * 1e18; //0.02 USD per ACCUCoin
    uint256 public constant finalSaleQuantity = 20000000 * 1e18; //20 Million
    uint256 public finalSaleValue;

    enum ICOStage {
        PreSale,
        SeedSale,
        FinalSale
    }
    ICOStage public currentStage = ICOStage.PreSale;

    uint256 public raisedAmount;
    uint256 public totalSale;
    address payable public treasury;

    event TokenPurchased(
        address indexed purchaser,
        address indexed beneficiary,
        uint256 quantity,
        uint256 weiAmount
    );

    constructor(address payable _treasury) {
        token = new ACCUCoin(100000000 * 1e18); //100 Million total supply
        treasury = _treasury;
        priceFeed = AggregatorV3Interface(
            0x8A753747A1Fa494EC906cE90E9f37563A8AF630e // ETH/USD Chainlink feed address rinkeby
        );
    }

    function switchStage() external onlyOwner returns (ICOStage) {
        if (currentStage == ICOStage.PreSale && totalSale >= preSaleQuantity) {
            currentStage = ICOStage.SeedSale;
        } else if (
            currentStage == ICOStage.SeedSale &&
            totalSale >= preSaleQuantity + seedSaleQuantity
        ) {
            currentStage = ICOStage.FinalSale;
        }
        return currentStage;
    }

    function setFinalSaleValue(uint256 _finalSaleValue)
        external
        onlyOwner
        returns (uint256)
    {
        require(finalSaleValue > 0, "ICO:  Should be valid Price");
        return finalSaleValue = _finalSaleValue;
    }

    //etherum price in dollars
    function getEthPrice() public view returns (uint256) {
        (
            ,
            /*uint80 roundID*/
            int256 price, /*uint startedAt*/ /*uint timeStamp*/ /*uint80 answeredInRound*/
            ,
            ,

        ) = priceFeed.latestRoundData();
        return uint256(price * 1e10); //1e10 as usd has 8 decimals
    }

    function ethToUSD(uint256 _ethAmount) public view returns (uint256) {
        uint256 currentPrice = getEthPrice();
        return (_ethAmount * currentPrice) / 1e18; //divide by 1e18 as ethamount and currentprice multipiled has 36 decimals
    }

    function purchaseToken(address _beneficiary) external payable {
        require(
            msg.value > 0 && _beneficiary != address(0),
            "ICO: Invalid amount or address"
        );
        uint256 ethInUSD = ethToUSD(msg.value);
        uint256 tokenbalance = token.balanceOf(address(this));
        uint256 tokensForUser;
        if (currentStage == ICOStage.PreSale) {
            tokensForUser = (ethInUSD * 1e18) / preSaleValue;
            require(
                tokensForUser + totalSale <= preSaleQuantity,
                "ICO: Exceeded PreSale token allocation "
            );
        } else if (currentStage == ICOStage.SeedSale) {
            tokensForUser = (ethInUSD * 1e18) / seedSaleValue;
            require(
                tokensForUser + totalSale <= seedSaleQuantity,
                "ICO: Exceeded SeedSale token allocation"
            );
        } else {
            require(finalSaleValue > 0, "ICO: Final sale value not set");
            tokensForUser = (ethInUSD * 1e18) / finalSaleValue;
            require(
                tokensForUser + totalSale <= finalSaleQuantity,
                "ICO: Exceeded token allocation"
            );
        }
        require(tokensForUser <= tokenbalance, "ICO: Tokens not available");

        raisedAmount += msg.value; // Increment raised amount
        totalSale += tokensForUser;
        token.transfer(_beneficiary, tokensForUser); // Send tokens to buyer

        (bool success, ) = treasury.call{value: msg.value}(""); // Send eth to treasury
        require(success, "ICO: ETH transfer failed");
        emit TokenPurchased(msg.sender, _beneficiary, tokensForUser, msg.value);
    }
}
