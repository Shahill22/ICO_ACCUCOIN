const ICO = artifacts.require("ICO");
module.exports = function (deployer, network, accounts) {
    const treasury = accounts[2];
    deployer.deploy(ICO, treasury);
};
