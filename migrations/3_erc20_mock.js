var ERC20Mock = artifacts.require("ERC20Mock");

module.exports = function (deployer, network) {
  if (network == "development") {
    deployer.deploy(ERC20Mock);
  }
};
