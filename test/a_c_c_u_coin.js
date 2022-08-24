const ACCUCoin = artifacts.require("ACCUCoin");

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */
contract("ACCUCoin", function (accounts) {
    beforeEach(async () => {
      instance = await ACCUCoin.deployed();
    });
    it("should match names", async function () {
      let name = await instance.name();
      assert.equal(name, "ACCU COIN");
    });
    it("should match symbol", async function () {
      let symbol = await instance.symbol();
      assert.equal(symbol, "ACCU");
    });
    it("should match decimal", async function () {
      let decimal = await instance.decimals();
      assert.equal(decimal, 18);
    });
    it("should match totalsupply", async function () {
      let totalSupply = await instance.totalSupply();
      assert.equal(totalSupply, 100000000);
    });
    it("should match owner balance", async function () {
      let bal0 = await instance.balanceOf(accounts[0]);
      bal0=web3.utils.fromWei(bal0,'ether');
      assert.equal(bal0,0.0000000001);
    });
    it("should transfer", async function () {
      let amnt=web3.utils.toWei('0.00000000002','ether')
      console.log(amnt);
      await instance.transfer(accounts[1],amnt,{from:accounts[0]})
      let bal1 = await instance.balanceOf(accounts[1]);
      bal1=web3.utils.fromWei(bal1,'ether');
      assert.equal(bal1,'0.00000000002');
    });
    it("should approve transaction", async function () {
      let amnt=web3.utils.toWei('0.00000000002','ether')
      await instance.approve(accounts[1],amnt)
      return assert.isTrue(true);
    });
  
});