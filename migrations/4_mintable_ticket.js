var MintableTicket = artifacts.require("MintableTicket");

module.exports = function (deployer) {
  deployer.deploy(MintableTicket);
};
