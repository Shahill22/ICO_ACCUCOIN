// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./ACCUCoin.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
contract ICO is Ownable {
    ACCUCoin public token;
    AggregatorV3Interface internal priceFeed;
    uint256 public preSaleQuantity=3000000000*1e18;     //30 Million
    uint256 public preSaleValue = 10000000000000000;    //0.01 dollar
    uint256 public seedSaleQuantity=5000000000*1e18;    //50 Million
    uint256 public seedSaleValue = 20000000000000000;   //0.02 dollar
    uint256 public finalSaleQuantity=2000000000*1e18;    //20 Million
    uint256 public finalSaleValue;
    enum ICOStage{
        PreSale,
        SeedSale,
        FinalSale
    }
    ICOStage public currentStage= ICOStage.PreSale;
    uint256 public raisedAmount;
    uint256 public totalSale;
    address payable public treasury;
    event TokenPurchased(address purchaser,address beneficiary,uint256 quantity, uint256 weiAmount);
    event Failed(string reason);
    constructor(address payable _treasury) {
        token=new ACCUCoin(100000000*1e18);                //100 Million
        treasury=_treasury;
        priceFeed = AggregatorV3Interface(0x8A753747A1Fa494EC906cE90E9f37563A8AF630e );
    }
    function switchStage() public onlyOwner {
        if(totalSale>preSaleQuantity){
            currentStage = ICOStage.SeedSale;
        }
        else if (totalSale>8000000000*1e18){
            currentStage=ICOStage.FinalSale;
        }
    }
    function setValue(uint256 _finalSaleValue) private onlyOwner returns(uint256){
        return finalSaleValue=_finalSaleValue;
    }
    //etherum price in dollars 
    function getLatestPrice() public view returns (int) {
        (
            /*uint80 roundID*/,
            int price,
            /*uint startedAt*/,
            /*uint timeStamp*/,
            /*uint80 answeredInRound*/
        ) = priceFeed.latestRoundData();
        return price;
    }
    function weiAmount(uint256 _amount) public view returns(uint256){
        int256 currentPrice=getLatestPrice();
        return _amount * uint256(currentPrice);
    }
    function purchaseToken(address _purchaser) payable public {
        require(msg.value > 0 && _purchaser != address(0)); 
        uint256 Amount = weiAmount(msg.value);
        uint256 tokenbalance = token.balanceOf(address(this)) ;
        uint256 tokento;
        if (currentStage==ICOStage.PreSale){
            tokento = Amount/preSaleValue;
            require(tokento<=preSaleQuantity && tokento <= tokenbalance);
        }
        else if(currentStage==ICOStage.SeedSale){
            tokento = Amount/seedSaleValue;
            require(tokento<=seedSaleQuantity && tokento <= tokenbalance);
        }
        else{
            tokento = Amount/finalSaleValue;
            require(tokento<=finalSaleQuantity && tokento <= tokenbalance);
        }
        raisedAmount += Amount ; // Increment raised amount
        token.transfer(msg.sender,tokento); // Send tokens to buyer
        totalSale += tokento;
        treasury.transfer(Amount);// Send money to treasury
        emit TokenPurchased(msg.sender,msg.sender,tokento,msg.value);
    }

}