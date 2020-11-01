var StubRandomBeacon = artifacts.require("StubRandomBeacon");

module.exports = function (deployer, network) {
  if (network == "development") {
    deployer.deploy(StubRandomBeacon);
  }
};
