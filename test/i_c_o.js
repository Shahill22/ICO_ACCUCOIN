const ICO = artifacts.require("ICO");
const ACCUCoin = artifacts.require("ACCUCoin");
const { BN, constants, expectEvent, expectRevert,ether,send,balance, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */
contract("ICO", function ( accounts ) {
    const [owner,beneficiary,treasury] = accounts;
    const supply = new BN('100000000000000000000000000');
    beforeEach(async () => {
      instance = await ICO.deployed();
      token = await ACCUCoin.new(supply);
    });
    describe("ACCU COIN", function () {
      it("Should assign the total supply of tokens to the owner", async function () {
          const ownerBalance = await token.balanceOf(owner).toString();
          expect(await token.totalSupply().toString()).to.be.equal(ownerBalance);
      });
    
    
    
    // send tokens to address and check balance
      it("Should transfer tokens", async function () {
        const transferToken = new BN('10000');
        const transfer = await token.transfer(beneficiary, transferToken, { from: owner });

        expectEvent(transfer,'Transfer', {
                from: owner,
                to: beneficiary,
                value: transferToken,
            });

        assert.equal((await token.balanceOf(beneficiary)).toString(), transferToken.toString());
      });
    });
     //Accept payments and sent to treasurer  
    describe('Accepts payments ', function () {
      
      it('Sent Ether to Treasurer', async function () {
        const amount=ether('1');
        await send.ether(beneficiary, treasury, amount);
  
        expect(await balance.current(treasury)).to.be.bignumber.equal("101000000000000000000");
      });
 
    });
    describe('when the recipient is the zero address', function () {
      const transferToken = new BN('10000');
      const to = ZERO_ADDRESS;

      it('reverts', async function () {
        await expectRevert(this.token.transferFrom(
          owner, to, transferToken, { from: owner }), `${errorPrefix}: transfer to the zero address`,
        );
      });
    });
});
