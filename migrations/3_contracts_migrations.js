const ICO = artifacts.require("ICO");
module.exports = function (deployer,network,accounts) {
    const addr=accounts[3];
    deployer.deploy(ICO,addr);
};
