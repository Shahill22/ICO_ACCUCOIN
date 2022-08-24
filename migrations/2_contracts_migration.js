const ERC20Token = artifacts.require("ACCUCoin");

module.exports = function (deployer) {
  deployer.deploy(ERC20Token,100000000);
};
