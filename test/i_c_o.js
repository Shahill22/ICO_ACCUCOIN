const ICO = artifacts.require("ICO");
const ACCUCoin = artifacts.require("ACCUCoin");
const { BN, constants, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */
contract("ICO", function ( accounts ) {
    const [owner,beneficiary,address1,address2] = accounts;
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
        const transferAmount = new BN('10000');
        const transfer = await token.transfer(address1, transferAmount, { from: owner });

        expectEvent(transfer,'Transfer', {
                from: owner,
                to: address1,
                value: transferAmount,
            });

        assert.equal((await token.balanceOf(address1)).toString(), transferAmount.toString());
      });
    });
});
