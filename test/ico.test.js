const { BN, constants, expectEvent, expectRevert, ether, send, balance, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { ZERO_ADDRESS } = constants;

const ICO = artifacts.require("ICO");
const ACCUCoin = artifacts.require("ACCUCoin");

contract("ICO", function (accounts) {
  const [owner, purchaser, beneficiary, treasury] = accounts;
  let ico, tokenAddress, token;

  beforeEach(async () => {
    ico = await ICO.new(treasury);
    tokenAddress = await ico.token();
    token = await ACCUCoin.at(tokenAddress)
  });

  describe('create Accu Coin', function () {
    const name = 'ACCU COIN';
    const symbol = 'ACCU';
    const initialSupply = new BN("100000000000000000000000000");

    it('has a name', async function () {
      expect(await token.name()).to.equal(name);
    });

    it('has a symbol', async function () {
      expect(await token.symbol()).to.equal(symbol);
    });

    it('has 18 decimals', async function () {
      expect(await token.decimals()).to.be.bignumber.equal('18');
    });

    it('has initial supply set properly', async function () {
      expect(await token.totalSupply()).to.be.bignumber.equal(initialSupply);
    });

    it('has minted initial supply to ICO', async function () {
      expect(await token.balanceOf(ico.address)).to.be.bignumber.equal(initialSupply);
    });

  });

  describe('create ICO', function () {
    const preSaleQuantity = web3.utils.toWei('30000000');
    const preSaleValue = web3.utils.toWei('0.01');
    const seedSaleQuantity = web3.utils.toWei('50000000');
    const seedSaleValue = web3.utils.toWei('0.02');
    const finalSaleQuantity = web3.utils.toWei('20000000');

    it('initial states set properly', async function () {
      expect(await ico.owner()).to.be.equal(owner);
      expect(await ico.treasury()).to.be.equal(treasury);
      expect(await ico.preSaleQuantity()).to.be.bignumber.equal(preSaleQuantity);
      expect(await ico.preSaleValue()).to.be.bignumber.equal(preSaleValue);
      expect(await ico.seedSaleQuantity()).to.be.bignumber.equal(seedSaleQuantity);
      expect(await ico.seedSaleValue()).to.be.bignumber.equal(seedSaleValue);
      expect(await ico.finalSaleQuantity()).to.be.bignumber.equal(finalSaleQuantity);
    });

    describe('purchase tokens', function () {

      describe('should revert', function () {

        it('if called with 0 ethers', async function () {
          await expectRevert(ico.purchaseToken(beneficiary), 'ICO: Invalid amount or address');
        });

        it('if called with beneficiary as zero address', async function () {
          await expectRevert(ico.purchaseToken(ZERO_ADDRESS, { value: "100" }), 'ICO: Invalid amount or address');
        });

      })
    })

  });

});
