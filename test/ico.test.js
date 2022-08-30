const {
  BN,
  constants,
  expectEvent,
  expectRevert,
} = require("@openzeppelin/test-helpers");
const { web3 } = require("@openzeppelin/test-helpers/src/setup");
const { expect } = require("chai");
const { ZERO_ADDRESS } = constants;

const ICO = artifacts.require("ICO");
const ACCUCoin = artifacts.require("ACCUCoin");

contract("ICO", function (accounts) {
  const [owner, purchaser, beneficiary, treasury] = accounts;
  let ico, tokenAddress, token;

  beforeEach(async () => {
    ico = await ICO.new(treasury);
    tokenAddress = await ico.token();
    token = await ACCUCoin.at(tokenAddress);
  });

  describe("create Accu Coin", function () {
    const name = "ACCU COIN";
    const symbol = "ACCU";
    const initialSupply = new BN("100000000000000000000000000");

    it("has a name", async function () {
      expect(await token.name()).to.equal(name);
    });

    it("has a symbol", async function () {
      expect(await token.symbol()).to.equal(symbol);
    });

    it("has 18 decimals", async function () {
      expect(await token.decimals()).to.be.bignumber.equal("18");
    });

    it("has initial supply set properly", async function () {
      expect(await token.totalSupply()).to.be.bignumber.equal(initialSupply);
    });

    it("has minted initial supply to ICO", async function () {
      expect(await token.balanceOf(ico.address)).to.be.bignumber.equal(
        initialSupply
      );
    });
  });

  describe("create ICO", function () {
    it("initial states set properly", async function () {
      const preSaleQuantity = web3.utils.toWei("30000000");
      const preSaleValue = web3.utils.toWei("0.01");
      const seedSaleQuantity = web3.utils.toWei("50000000");
      const seedSaleValue = web3.utils.toWei("0.02");
      const finalSaleQuantity = web3.utils.toWei("20000000");
      expect(await ico.owner()).to.be.equal(owner);
      expect(await ico.treasury()).to.be.equal(treasury);
      expect(await ico.preSaleQuantity()).to.be.bignumber.equal(
        preSaleQuantity
      );
      expect(await ico.preSaleValue()).to.be.bignumber.equal(preSaleValue);
      expect(await ico.seedSaleQuantity()).to.be.bignumber.equal(
        seedSaleQuantity
      );
      expect(await ico.seedSaleValue()).to.be.bignumber.equal(seedSaleValue);
      expect(await ico.finalSaleQuantity()).to.be.bignumber.equal(
        finalSaleQuantity
      );
    });

    describe("switch stages", function () {
      it("test initial stage is presale", async function () {
        expect((await ico.currentStage()).toString()).to.equal(
          ICO.ICOStage.PreSale.toString()
        );
      });
      it("change stage to seedsale", async function () {
        await ico.switchStage();
        expect((await ico.currentStage()).toString()).to.equal(
          ICO.ICOStage.SeedSale.toString()
        );
      });
      it("change stage to finalsale", async function () {
        const PreSalStage = await ico.switchStage();
        const currentstage = await ico.switchStage();
        expect((await ico.currentStage()).toString()).to.equal(
          ICO.ICOStage.FinalSale.toString()
        );
      });
    });

    describe("set final sale value", function () {
      describe("should revert", function () {
        it("if called with other participants", async function () {
          await expectRevert.unspecified(
            ico.setFinalSaleValue(100, { from: beneficiary })
          );
        });

        it("if final sale value is 0", async function () {
          await expectRevert(
            ico.setFinalSaleValue(0),
            "ICO:  Should be valid Price"
          );
        });
      });
      describe("should set final sale value", function () {
        it("set final sale value ", async function () {
          let newSaleValue = web3.utils.toWei("0.03");
          await ico.setFinalSaleValue(newSaleValue);
          expect(await ico.finalSaleValue()).to.be.bignumber.equal(
            newSaleValue
          );
        });
      });
    });

    describe("purchase tokens", function () {
      describe("should revert", function () {
        it("if called with 0 ethers", async function () {
          await expectRevert(
            ico.purchaseToken(beneficiary),
            "ICO: Invalid amount or address"
          );
        });

        it("if called with beneficiary as zero address", async function () {
          await expectRevert(
            ico.purchaseToken(ZERO_ADDRESS, { value: "100" }),
            "ICO: Invalid amount or address"
          );
        });

        it("if exceeds presale quantity", async function () {
          await expectRevert(
            ico.purchaseToken(beneficiary, {
              from: purchaser,
              value: "31000000000000000000000000",
            }),
            "ICO: Exceeded PreSale token allocation"
          );
        });

        it("if exceeds seedsale quantity", async function () {
          await ico.switchStage();
          await expectRevert(
            ico.purchaseToken(beneficiary, {
              from: purchaser,
              value: "51000000000000000000000000",
            }),
            "ICO: Exceeded SeedSale token allocation"
          );
        });

        it("if exceeds totalsale quantity", async function () {
          let newSaleValue = web3.utils.toWei("0.03");
          await ico.switchStage();
          await ico.switchStage();
          await ico.setFinalSaleValue(newSaleValue);
          await expectRevert(
            ico.purchaseToken(beneficiary, {
              from: purchaser,
              value: "101000000000000000000000000",
            }),
            "ICO: Exceeded token allocation"
          );
        });
      });

      describe("should receive tokens", function () {
        it("if purchaser received tokens", async function () {
          const purchaseEthValue = web3.utils.toBN(100);
          const ethInUSD = await ico.ethToUSD(purchaseEthValue);
          const tokenValue = await ico.preSaleValue();
          const tokensExpected = ethInUSD.mul(
            web3.utils.toBN(1e18).div(tokenValue)
          );

          const beneficiaryTokenBalanceBeforePurchase = await token.balanceOf(
            beneficiary
          );

          const purchaseReceipt = await ico.purchaseToken(beneficiary, {
            from: purchaser,
            value: purchaseEthValue,
          });

          const beneficiaryTokenBalanceAfterPurchase = await token.balanceOf(
            beneficiary
          );

          expect(
            beneficiaryTokenBalanceAfterPurchase.sub(
              beneficiaryTokenBalanceBeforePurchase
            )
          ).to.bignumber.equal(tokensExpected);
          expect(beneficiaryTokenBalanceAfterPurchase).to.be.not.equal(
            beneficiaryTokenBalanceBeforePurchase
          );
        });
        it("if beneficiary received tokens(presale)", async function () {
          const purchaseEthValue = web3.utils.toBN(100);
          const ethInUSD = await ico.ethToUSD(purchaseEthValue);
          const tokenValue = await ico.preSaleValue();
          const tokensExpected = ethInUSD.mul(
            web3.utils.toBN(1e18).div(tokenValue)
          );

          const beneficiaryTokenBalanceBeforePurchase = await token.balanceOf(
            beneficiary
          );
          const treasuryEthBalanceBeforePurchase = web3.utils.toBN(
            await web3.eth.getBalance(treasury)
          );
          const totalSaleBeforePurchase = await ico.totalSale();
          const raisedAmountBeforePurchase = await ico.raisedAmount();

          const purchaseReceipt = await ico.purchaseToken(beneficiary, {
            from: purchaser,
            value: purchaseEthValue,
          });

          expectEvent(purchaseReceipt, "TokenPurchased", {
            purchaser: purchaser,
            beneficiary: beneficiary,
            quantity: tokensExpected,
            weiAmount: purchaseEthValue,
          });

          const beneficiaryTokenBalanceAfterPurchase = await token.balanceOf(
            beneficiary
          );
          const treasuryEthBalanceAfterPurchase = web3.utils.toBN(
            await web3.eth.getBalance(treasury)
          );
          const totalSaleAfterPurchase = await ico.totalSale();
          const raisedAmountAfterPurchase = await ico.raisedAmount();

          expect(
            beneficiaryTokenBalanceAfterPurchase.sub(
              beneficiaryTokenBalanceBeforePurchase
            )
          ).to.bignumber.equal(tokensExpected);
          expect(
            treasuryEthBalanceAfterPurchase.sub(
              treasuryEthBalanceBeforePurchase
            )
          ).to.bignumber.equal(purchaseEthValue);
          expect(
            totalSaleAfterPurchase.sub(totalSaleBeforePurchase)
          ).to.bignumber.equal(tokensExpected);
          expect(
            raisedAmountAfterPurchase.sub(raisedAmountBeforePurchase)
          ).to.bignumber.equal(purchaseEthValue);
        });

        it("if purchaser received tokens(seedsale)", async function () {
          const purchaseEthValue = web3.utils.toBN(100);
          const ethInUSD = await ico.ethToUSD(purchaseEthValue);
          const tokenValue = await ico.seedSaleValue();
          const tokensExpected = ethInUSD.mul(
            web3.utils.toBN(1e18).div(tokenValue)
          );

          const beneficiaryTokenBalanceBeforePurchase = await token.balanceOf(
            beneficiary
          );
          const treasuryEthBalanceBeforePurchase = web3.utils.toBN(
            await web3.eth.getBalance(treasury)
          );
          const totalSaleBeforePurchase = await ico.totalSale();
          const raisedAmountBeforePurchase = await ico.raisedAmount();
          await ico.switchStage();
          const purchaseReceipt = await ico.purchaseToken(beneficiary, {
            from: purchaser,
            value: purchaseEthValue,
          });

          expectEvent(purchaseReceipt, "TokenPurchased", {
            purchaser: purchaser,
            beneficiary: beneficiary,
            quantity: tokensExpected,
            weiAmount: purchaseEthValue,
          });

          const beneficiaryTokenBalanceAfterPurchase = await token.balanceOf(
            beneficiary
          );
          const treasuryEthBalanceAfterPurchase = web3.utils.toBN(
            await web3.eth.getBalance(treasury)
          );
          const totalSaleAfterPurchase = await ico.totalSale();
          const raisedAmountAfterPurchase = await ico.raisedAmount();

          expect(
            beneficiaryTokenBalanceAfterPurchase.sub(
              beneficiaryTokenBalanceBeforePurchase
            )
          ).to.bignumber.equal(tokensExpected);
          expect(
            treasuryEthBalanceAfterPurchase.sub(
              treasuryEthBalanceBeforePurchase
            )
          ).to.bignumber.equal(purchaseEthValue);
          expect(
            totalSaleAfterPurchase.sub(totalSaleBeforePurchase)
          ).to.bignumber.equal(tokensExpected);
          expect(
            raisedAmountAfterPurchase.sub(raisedAmountBeforePurchase)
          ).to.bignumber.equal(purchaseEthValue);
        });

        it("if purchaser received tokens(finalsale)", async function () {
          const purchaseEthValue = web3.utils.toBN(100);
          const ethInUSD = await ico.ethToUSD(purchaseEthValue);
          let newSaleValue = web3.utils.toWei("0.03");
          await ico.switchStage();
          await ico.switchStage();
          await ico.setFinalSaleValue(newSaleValue);
          const tokenValue = await ico.finalSaleValue();
          const tokensExpected = ethInUSD.mul(
            web3.utils.toBN(1e18).div(tokenValue)
          );

          const beneficiaryTokenBalanceBeforePurchase = await token.balanceOf(
            beneficiary
          );
          const treasuryEthBalanceBeforePurchase = web3.utils.toBN(
            await web3.eth.getBalance(treasury)
          );
          const totalSaleBeforePurchase = await ico.totalSale();
          const raisedAmountBeforePurchase = await ico.raisedAmount();
          const purchaseReceipt = await ico.purchaseToken(beneficiary, {
            from: purchaser,
            value: purchaseEthValue,
          });

          expectEvent(purchaseReceipt, "TokenPurchased", {
            purchaser: purchaser,
            beneficiary: beneficiary,
            quantity: tokensExpected,
            weiAmount: purchaseEthValue,
          });

          const beneficiaryTokenBalanceAfterPurchase = await token.balanceOf(
            beneficiary
          );
          const treasuryEthBalanceAfterPurchase = web3.utils.toBN(
            await web3.eth.getBalance(treasury)
          );
          const totalSaleAfterPurchase = await ico.totalSale();
          const raisedAmountAfterPurchase = await ico.raisedAmount();

          expect(
            beneficiaryTokenBalanceAfterPurchase.sub(
              beneficiaryTokenBalanceBeforePurchase
            )
          ).to.bignumber.equal(tokensExpected);
          expect(
            treasuryEthBalanceAfterPurchase.sub(
              treasuryEthBalanceBeforePurchase
            )
          ).to.bignumber.equal(purchaseEthValue);
          expect(
            totalSaleAfterPurchase.sub(totalSaleBeforePurchase)
          ).to.bignumber.equal(tokensExpected);
          expect(
            raisedAmountAfterPurchase.sub(raisedAmountBeforePurchase)
          ).to.bignumber.equal(purchaseEthValue);
        });
        it("if treasurer received ether", async function () {
          const purchaseEthValue = web3.utils.toBN(100);
          const ethInUSD = await ico.ethToUSD(purchaseEthValue);
          const tokenValue = await ico.preSaleValue();
          const tokensExpected = ethInUSD.mul(
            web3.utils.toBN(1e18).div(tokenValue)
          );
          const treasuryEthBalanceBeforePurchase = web3.utils.toBN(
            await web3.eth.getBalance(treasury)
          );
          const purchaseReceipt = await ico.purchaseToken(beneficiary, {
            from: purchaser,
            value: purchaseEthValue,
          });

          const treasuryEthBalanceAfterPurchase = web3.utils.toBN(
            await web3.eth.getBalance(treasury)
          );

          expect(
            treasuryEthBalanceAfterPurchase.sub(
              treasuryEthBalanceBeforePurchase
            )
          ).to.bignumber.equal(purchaseEthValue);
        });
        it("emitting event after token purchase", async function () {
          const purchaseReceipt = await ico.purchaseToken(beneficiary, {
            from: purchaser,
            value: "100",
          });
          const purchaseEthValue = web3.utils.toBN(100);
          const ethInUSD = await ico.ethToUSD(purchaseEthValue);
          const tokenValue = await ico.preSaleValue();
          const tokensExpected = ethInUSD.mul(
            web3.utils.toBN(1e18).div(tokenValue)
          );

          expectEvent(purchaseReceipt, "TokenPurchased", {
            purchaser: purchaser,
            beneficiary: beneficiary,
            quantity: tokensExpected,
            weiAmount: purchaseEthValue,
          });
        });

        it("ether to contract directly", async function () {
          const purchaseEthValue = web3.utils.toBN(100);
          const ethInUSD = await ico.ethToUSD(purchaseEthValue);
          const tokenValue = await ico.preSaleValue();
          const tokensExpected = ethInUSD.mul(
            web3.utils.toBN(1e18).div(tokenValue)
          );

          const beneficiaryTokenBalanceBeforePurchase = await token.balanceOf(
            purchaser
          );
          const treasuryEthBalanceBeforePurchase = web3.utils.toBN(
            await web3.eth.getBalance(treasury)
          );
          const totalSaleBeforePurchase = await ico.totalSale();
          const raisedAmountBeforePurchase = await ico.raisedAmount();

          const { transactionHash } = await web3.eth.sendTransaction({
            from: purchaser,
            to: ico.address,
            value: purchaseEthValue,
            gasLimit: 200000,
          });

          expectEvent.inTransaction(transactionHash, ico, "TokenPurchased", {
            purchaser: purchaser,
            beneficiary: purchaser,
            quantity: tokensExpected,
            weiAmount: purchaseEthValue,
          });

          const beneficiaryTokenBalanceAfterPurchase = await token.balanceOf(
            purchaser
          );
          const treasuryEthBalanceAfterPurchase = web3.utils.toBN(
            await web3.eth.getBalance(treasury)
          );
          const totalSaleAfterPurchase = await ico.totalSale();
          const raisedAmountAfterPurchase = await ico.raisedAmount();

          expect(
            beneficiaryTokenBalanceAfterPurchase.sub(
              beneficiaryTokenBalanceBeforePurchase
            )
          ).to.bignumber.equal(tokensExpected);
          expect(
            treasuryEthBalanceAfterPurchase.sub(
              treasuryEthBalanceBeforePurchase
            )
          ).to.bignumber.equal(purchaseEthValue);
          expect(
            totalSaleAfterPurchase.sub(totalSaleBeforePurchase)
          ).to.bignumber.equal(tokensExpected);
          expect(
            raisedAmountAfterPurchase.sub(raisedAmountBeforePurchase)
          ).to.bignumber.equal(purchaseEthValue);
        });
      });
    });
  });
});
