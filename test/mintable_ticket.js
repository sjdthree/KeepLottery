var MintableTicket = artifacts.require("MintableTicket");
var Lottery = artifacts.require("Lottery");
var StubRandomBeacon = artifacts.require("StubRandomBeacon");
var ERC20Mock = artifacts.require("ERC20Mock");

const BN = require("bn.js");

function tests(art) {
  return (accounts) => {
    it("should fail to mint a bad ticket type", async () => {
      let instance = await art.deployed();
      var error = null;

      try {
        await instance.mintTicket(accounts[1], 0);
      } catch (err) {
        error = err;
      }

      assert.isNotNull(error, "Expected error but none was found");
    });

    it("should only allow send to mint ticket to themself", async () => {
      let instance = await art.deployed();
      var error = null;

      try {
        let ticketType = new BN(1).shln(128).or(new BN(1).shln(255));

        await instance.mintTicket(accounts[1], ticketType, {
          from: accounts[2],
        });
      } catch (err) {
        error = err;
      }

      assert.isNotNull(error, "Expected error but none was found");
    });

    it("should mint a single ticket", async () => {
      let instance = await art.deployed();

      let stubBeaconInstance = await StubRandomBeacon.new();
      let erc20Mock = await ERC20Mock.new();
      let lotteryInstance = await Lottery.new(
        instance.address,
        erc20Mock.address,
        stubBeaconInstance.address
      );
      await instance.setLotteryContract(lotteryInstance.address);
      await lotteryInstance.startIssuingTickets();

      let ticketType = new BN(1).shln(128).or(new BN(1).shln(255));

      await instance.mintTicket(accounts[1], ticketType);

      let typeBalance = await instance.balanceOf(accounts[1], ticketType);
      assert(typeBalance == 1, "Type balance does not match mint");

      let balance = await instance.balanceOf(
        accounts[1],
        ticketType.or(new BN(1))
      );
      assert(balance == 1, "Balance does not match mint");
    });

    it("should fail to transfer tickets", async () => {
      let instance = await art.deployed();

      let stubBeaconInstance = await StubRandomBeacon.new();
      let erc20Mock = await ERC20Mock.new();
      let lotteryInstance = await Lottery.new(
        instance.address,
        erc20Mock.address,
        stubBeaconInstance.address
      );
      await instance.setLotteryContract(lotteryInstance.address);
      await lotteryInstance.startIssuingTickets();

      var error = null;

      let ticketType = new BN(1).shln(128).or(new BN(1).shln(255));
      await instance.mintTicket(accounts[0], ticketType);

      try {
        await instance.safeTransferFrom(
          accounts[0],
          accounts[1],
          ticketType.or(new BN(1)),
          1,
          []
        );
      } catch (err) {
        error = err;
      }

      assert.include(
        error.toString(),
        "NFT_TRANSFER_NOT_ALLOWED",
        "Expected error but none was found"
      );
    });

    it("should fail to batch transfer tickets", async () => {
      let instance = await art.deployed();

      let stubBeaconInstance = await StubRandomBeacon.new();
      let erc20Mock = await ERC20Mock.new();
      let lotteryInstance = await Lottery.new(
        instance.address,
        erc20Mock.address,
        stubBeaconInstance.address
      );
      await instance.setLotteryContract(lotteryInstance.address);
      await lotteryInstance.startIssuingTickets();

      var error = null;

      let ticketType = new BN(1).shln(128).or(new BN(1).shln(255));
      await instance.mintTicket(accounts[0], ticketType);

      try {
        await instance.safeBatchTransferFrom(
          accounts[0],
          accounts[1],
          [ticketType.or(new BN(1))],
          [1],
          []
        );
      } catch (err) {
        error = err;
      }

      assert.include(
        error.toString(),
        "NFT_TRANSFER_NOT_ALLOWED",
        "Expected error but none was found"
      );
    });

    it("should only allow owner to set lottery", async () => {
      let instance = await art.deployed();

      let initialTicketType = new BN(1).shln(128).or(new BN(1).shln(255));

      let ticketInstance = await MintableTicket.deployed();
      let stubBeaconInstance = await StubRandomBeacon.new();
      let erc20Mock = await ERC20Mock.new();

      let lotteryInstance = await Lottery.new(
        ticketInstance.address,
        erc20Mock.address,
        stubBeaconInstance.address
      );

      var error = null;

      try {
        await instance.setLotteryContract(lotteryInstance, {
          from: accounts[1],
        });
      } catch (err) {
        error = err;
      }

      assert.isNotNull(error, "Expected error but none was found");
    });
  };
}

contract("MintableTicket", tests(MintableTicket));
