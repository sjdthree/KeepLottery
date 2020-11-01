var Lottery = artifacts.require("Lottery");
var MintableTicket = artifacts.require("MintableTicket");
var StubRandomBeacon = artifacts.require("StubRandomBeacon");
var ERC20Mock = artifacts.require("ERC20Mock");

const BN = require("bn.js");

contract("Lottery", (accounts) => {
  it("should return current ticket during lottery period", async () => {
    let initialTicketType = new BN(1).shln(128).or(new BN(1).shln(255));
    let ticketInstance = await MintableTicket.deployed();
    let stubBeaconInstance = await StubRandomBeacon.new();
    let erc20Mock = await ERC20Mock.new();

    let lotteryInstance = await Lottery.new(
      ticketInstance.address,
      erc20Mock.address,
      stubBeaconInstance.address
    );
    await lotteryInstance.startIssuingTickets();

    let ticketType = await lotteryInstance.getNextDrawTicketType();
    assert(ticketType.eq(initialTicketType), "Ticket type is not correct");
  });

  it("should calculate random winning ticket in bounds", async () => {
    let ticketType = new BN(1).shln(128).or(new BN(1).shln(255));
    let ticketInstance = await MintableTicket.new();
    let stubBeaconInstance = await StubRandomBeacon.new();
    let erc20Mock = await ERC20Mock.new();

    let lotteryInstance = await Lottery.new(
      ticketInstance.address,
      erc20Mock.address,
      stubBeaconInstance.address
    );
    await ticketInstance.setLotteryContract(lotteryInstance.address);
    await lotteryInstance.startIssuingTickets();

    await ticketInstance.mintTicket(accounts[1], ticketType);
    await ticketInstance.mintTicket(accounts[2], ticketType);
    await ticketInstance.mintTicket(accounts[3], ticketType);
    await ticketInstance.mintTicket(accounts[4], ticketType);

    let winningTicket = await lotteryInstance.calculateWinningTicket(
      ticketType,
      2
    );

    assert(
      winningTicket.eq(ticketType.or(new BN(3))),
      "Winning ticket is incorrect"
    );
  });

  it("should calculate random winning ticket out of bounds", async () => {
    let ticketType = new BN(1).shln(128).or(new BN(1).shln(255));
    let ticketInstance = await MintableTicket.new();
    let stubBeaconInstance = await StubRandomBeacon.new();
    let erc20Mock = await ERC20Mock.new();

    let lotteryInstance = await Lottery.new(
      ticketInstance.address,
      erc20Mock.address,
      stubBeaconInstance.address
    );
    await ticketInstance.setLotteryContract(lotteryInstance.address);
    await lotteryInstance.startIssuingTickets();

    await ticketInstance.mintTicket(accounts[1], ticketType);
    await ticketInstance.mintTicket(accounts[2], ticketType);
    await ticketInstance.mintTicket(accounts[3], ticketType);
    await ticketInstance.mintTicket(accounts[4], ticketType);

    let winningTicket = await lotteryInstance.calculateWinningTicket(
      ticketType,
      5
    );

    assert(
      winningTicket.eq(ticketType.or(new BN(2))),
      "Winning ticket is incorrect"
    );
  });

  it("should calculate random winning ticket on first border", async () => {
    let ticketType = new BN(1).shln(128).or(new BN(1).shln(255));
    let ticketInstance = await MintableTicket.new();
    let stubBeaconInstance = await StubRandomBeacon.new();
    let erc20Mock = await ERC20Mock.new();

    let lotteryInstance = await Lottery.new(
      ticketInstance.address,
      erc20Mock.address,
      stubBeaconInstance.address
    );
    await ticketInstance.setLotteryContract(lotteryInstance.address);

    await lotteryInstance.startIssuingTickets();

    await ticketInstance.mintTicket(accounts[1], ticketType);
    await ticketInstance.mintTicket(accounts[2], ticketType);
    await ticketInstance.mintTicket(accounts[3], ticketType);
    await ticketInstance.mintTicket(accounts[4], ticketType);

    let winningTicket = await lotteryInstance.calculateWinningTicket(
      ticketType,
      0
    );

    assert(
      winningTicket.eq(ticketType.or(new BN(1))),
      "Winning ticket is incorrect"
    );
  });

  it("should calculate random winning ticket on last border", async () => {
    let ticketType = new BN(1).shln(128).or(new BN(1).shln(255));
    let ticketInstance = await MintableTicket.new();
    let stubBeaconInstance = await StubRandomBeacon.new();
    let erc20Mock = await ERC20Mock.new();

    let lotteryInstance = await Lottery.new(
      ticketInstance.address,
      erc20Mock.address,
      stubBeaconInstance.address
    );
    await ticketInstance.setLotteryContract(lotteryInstance.address);

    await lotteryInstance.startIssuingTickets();

    await ticketInstance.mintTicket(accounts[1], ticketType);
    await ticketInstance.mintTicket(accounts[2], ticketType);
    await ticketInstance.mintTicket(accounts[3], ticketType);
    await ticketInstance.mintTicket(accounts[4], ticketType);

    let winningTicket = await lotteryInstance.calculateWinningTicket(
      ticketType,
      3
    );

    assert(
      winningTicket.eq(ticketType.or(new BN(4))),
      "Winning ticket is incorrect"
    );
  });

  it("should mint tokens when issuing reward", async () => {
    let ticketType = new BN(1).shln(128).or(new BN(1).shln(255));
    let ticketInstance = await MintableTicket.new();
    let stubBeaconInstance = await StubRandomBeacon.new();
    let erc20Mock = await ERC20Mock.new();

    let lotteryInstance = await Lottery.new(
      ticketInstance.address,
      erc20Mock.address,
      stubBeaconInstance.address
    );
    await ticketInstance.setLotteryContract(lotteryInstance.address);

    await lotteryInstance.startIssuingTickets();

    let owner = await lotteryInstance.owner();
    await erc20Mock.mockMint(owner, 10000);
    await erc20Mock.approve(lotteryInstance.address, 10000);

    await ticketInstance.mintTicket(accounts[1], ticketType);

    let winningTicket = await lotteryInstance.calculateWinningTicket(
      ticketType,
      0
    );
    let winner = await ticketInstance.ownerOf(winningTicket);

    let result = await lotteryInstance.issueReward(
      0,
      winner,
      winningTicket,
      1000
    );

    assert(
      result.logs[0].event == "LotteryRewardIssued",
      "Did not emit LotteryRewardIssued event"
    );

    assert(
      (await erc20Mock.balanceOf(winner)).toString(10) == "1000",
      "Reward token was not issued"
    );
  });

  it("should only allow owner to issue rewards", async () => {
    let ticketType = new BN(1).shln(128).or(new BN(1).shln(255));
    let ticketInstance = await MintableTicket.new();
    let stubBeaconInstance = await StubRandomBeacon.new();
    let erc20Mock = await ERC20Mock.new();

    let lotteryInstance = await Lottery.new(
      ticketInstance.address,
      erc20Mock.address,
      stubBeaconInstance.address
    );
    await ticketInstance.setLotteryContract(lotteryInstance.address);
    await lotteryInstance.startIssuingTickets();

    await ticketInstance.mintTicket(accounts[1], ticketType);

    let winningTicket = await lotteryInstance.calculateWinningTicket(
      ticketType,
      0
    );
    let winner = await ticketInstance.ownerOf(winningTicket);

    var error = null;

    try {
      await lotteryInstance.issueReward(0, winner, winningTicket, 1000, {
        from: accounts[1],
      });
    } catch (err) {
      error = err;
    }

    assert.isNotNull(error, "Expected error but none was found");
  });

  it("should trigger a lottery draw", async () => {
    let ticketType = new BN(1).shln(128).or(new BN(1).shln(255));
    let ticketInstance = await MintableTicket.new();
    let stubBeaconInstance = await StubRandomBeacon.new();
    let erc20Mock = await ERC20Mock.new();

    let lotteryInstance = await Lottery.new(
      ticketInstance.address,
      erc20Mock.address,
      stubBeaconInstance.address
    );
    await ticketInstance.setLotteryContract(lotteryInstance.address);

    await lotteryInstance.startIssuingTickets();

    await ticketInstance.mintTicket(accounts[1], ticketType);
    await ticketInstance.mintTicket(accounts[2], ticketType);
    await ticketInstance.mintTicket(accounts[3], ticketType);
    await ticketInstance.mintTicket(accounts[4], ticketType);

    await lotteryInstance.stopIssuingTickets();

    let fee = await stubBeaconInstance.entryFeeEstimate(0);

    let result = await lotteryInstance.triggerDrawTicket(1000, { value: fee });
    assert(
      result.logs[0].event == "LotteryDrawTriggered",
      "Lottery draw not triggered"
    );

    let events = await stubBeaconInstance.getPastEvents();
    let rN = events[events.length - 1].args.entry;

    let winningTicket = await lotteryInstance.calculateWinningTicket(
      ticketType,
      rN
    );
    assert.isNotNull(winningTicket, "Failed to find winning ticket");
  });

  it("should only allow owner to trigger lottery draw", async () => {
    let ticketType = new BN(1).shln(128).or(new BN(1).shln(255));
    let ticketInstance = await MintableTicket.new();
    let stubBeaconInstance = await StubRandomBeacon.new();
    let erc20Mock = await ERC20Mock.new();

    let lotteryInstance = await Lottery.new(
      ticketInstance.address,
      erc20Mock.address,
      stubBeaconInstance.address
    );
    await ticketInstance.setLotteryContract(lotteryInstance.address);

    await lotteryInstance.startIssuingTickets();

    await ticketInstance.mintTicket(accounts[1], ticketType);
    await ticketInstance.mintTicket(accounts[2], ticketType);
    await ticketInstance.mintTicket(accounts[3], ticketType);
    await ticketInstance.mintTicket(accounts[4], ticketType);

    await lotteryInstance.stopIssuingTickets();

    let fee = await stubBeaconInstance.entryFeeEstimate(0);

    var error = null;

    try {
      await lotteryInstance.triggerDrawTicket(1000, {
        from: accounts[1],
        value: fee,
      });
    } catch (err) {
      error = err;
    }

    assert.isNotNull(error, "Expected error but none was found");
  });

  it("should only allow owner to withdraw", async () => {
    let ticketType = new BN(1).shln(128).or(new BN(1).shln(255));
    let ticketInstance = await MintableTicket.new();
    let stubBeaconInstance = await StubRandomBeacon.new();
    let erc20Mock = await ERC20Mock.new();

    let lotteryInstance = await Lottery.new(
      ticketInstance.address,
      erc20Mock.address,
      stubBeaconInstance.address
    );
    await ticketInstance.setLotteryContract(lotteryInstance.address);

    await lotteryInstance.startIssuingTickets();
    await lotteryInstance.stopIssuingTickets();

    let fee = await stubBeaconInstance.entryFeeEstimate(0);
    await lotteryInstance.triggerDrawTicket(1000, {
      value: fee * 2,
    });
    var error = null;

    try {
      await lotteryInstance.withdraw(fee, { from: accounts[1] });
    } catch (err) {
      error = err;
    }

    assert.isNotNull(error, "Expected error but none was found");

    let result = await lotteryInstance.withdraw(fee);
    assert.isNotNull(result, "Expected successful result");
  });

  it("should stop issuing tickets", async () => {
    let ticketType = new BN(1).shln(128).or(new BN(1).shln(255));
    let ticketInstance = await MintableTicket.new();
    let stubBeaconInstance = await StubRandomBeacon.new();
    let erc20Mock = await ERC20Mock.new();

    let lotteryInstance = await Lottery.new(
      ticketInstance.address,
      erc20Mock.address,
      stubBeaconInstance.address
    );
    await ticketInstance.setLotteryContract(lotteryInstance.address);

    await lotteryInstance.startIssuingTickets();
    await lotteryInstance.stopIssuingTickets();

    let drawTicketType = await lotteryInstance.getNextDrawTicketType();
    let isIssuing = await lotteryInstance.isIssuingTickets();

    assert(drawTicketType.eq(ticketType), "Ticket type should not advance");

    assert(isIssuing == false, "Tickets should not be issuing");
  });

  it("should only allow owner to stop issuing tickets", async () => {
    let ticketType = new BN(1).shln(128).or(new BN(1).shln(255));
    let ticketInstance = await MintableTicket.new();
    let stubBeaconInstance = await StubRandomBeacon.new();
    let erc20Mock = await ERC20Mock.new();

    let lotteryInstance = await Lottery.new(
      ticketInstance.address,
      erc20Mock.address,
      stubBeaconInstance.address
    );
    await ticketInstance.setLotteryContract(lotteryInstance.address);

    await lotteryInstance.startIssuingTickets();

    var error = null;

    try {
      await lotteryInstance.stopIssuingTickets({
        from: accounts[1],
      });
    } catch (err) {
      error = err;
    }

    assert.isNotNull(error, "Expected error but none was found");
  });

  it("should start issuing tickets", async () => {
    let ticketType = new BN(1).shln(128).or(new BN(1).shln(255));
    let nextTicketType = new BN(2).shln(128).or(new BN(1).shln(255));
    let ticketInstance = await MintableTicket.new();
    let stubBeaconInstance = await StubRandomBeacon.new();
    let erc20Mock = await ERC20Mock.new();

    let lotteryInstance = await Lottery.new(
      ticketInstance.address,
      erc20Mock.address,
      stubBeaconInstance.address
    );
    await ticketInstance.setLotteryContract(lotteryInstance.address);

    await lotteryInstance.startIssuingTickets();
    await lotteryInstance.stopIssuingTickets();
    await lotteryInstance.startIssuingTickets();

    let drawTicketType = await lotteryInstance.getNextDrawTicketType();
    let isIssuing = await lotteryInstance.isIssuingTickets();

    assert(drawTicketType.eq(nextTicketType), "Ticket type should advance");

    assert(isIssuing == true, "Tickets should be issuing");
  });

  it("should only allow owner to start issuing tickets", async () => {
    let ticketType = new BN(1).shln(128).or(new BN(1).shln(255));
    let ticketInstance = await MintableTicket.new();
    let stubBeaconInstance = await StubRandomBeacon.new();
    let erc20Mock = await ERC20Mock.new();

    let lotteryInstance = await Lottery.new(
      ticketInstance.address,
      erc20Mock.address,
      stubBeaconInstance.address
    );
    await ticketInstance.setLotteryContract(lotteryInstance.address);

    var error = null;

    try {
      await lotteryInstance.startIssuingTickets({
        from: accounts[1],
      });
    } catch (err) {
      error = err;
    }

    assert.isNotNull(error, "Expected error but none was found");
  });
});
