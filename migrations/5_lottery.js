var MintableTicket = artifacts.require("MintableTicket");
var Lottery = artifacts.require("Lottery");
var StubRandomBeacon = artifacts.require("./RandomBeacon/StubRandomBeacon");
var ERC20Mock = artifacts.require("ERC20Mock");

const BN = require("bn.js");
let KEEP_ROPSTEN_BEACON_ADDRESS = "0x6c04499B595efdc28CdbEd3f9ed2E83d7dCCC717";
let KEEP_ROPSTEN_TOKEN_ADDRESS = "0x343d3dda00415289cdd4e8030f63a4a5a2548ff9";

module.exports = async function (deployer, network) {
  let ticketInstance = await MintableTicket.deployed();
  if (network == "ropsten" || network == "ropsten-fork") {
    beaconAddress = KEEP_ROPSTEN_BEACON_ADDRESS;
    rewardTokenAddress = KEEP_ROPSTEN_TOKEN_ADDRESS; // KEEP Token on Ropsten
  } else {
    beaconAddress = (await StubRandomBeacon.deployed()).address;
    rewardTokenAddress = (await ERC20Mock.deployed()).address;
  }
  return deployer
    .deploy(Lottery, ticketInstance.address, rewardTokenAddress, beaconAddress)
    .then(function (lotteryInstance) {
      return ticketInstance.setLotteryContract(lotteryInstance.address);
    });
};
