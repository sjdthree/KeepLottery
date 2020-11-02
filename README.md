# KeepLottery

## Configuration

The following environment variables should be set before deploying to Ropsten:

- `CONTRACT_OWNER_ETH_ACCOUNT_PRIVATE_KEY` -> Private key of the contract owner
- `INFURA_ENDPOINT` -> Ropsten Infura Endpoint

## Deploy to Ropsten

```
truffle migrate --network ropsten
```

## Setup

### 1. Deposit ETH in Lottery contract

ETH must be deposited in the Lottery contract so it can pay for the Keep Random Beacon. The owner can withdraw this at anytime using `withdraw()`

```
let lotteryInstance = await Lottery.deployed()
web3.eth.sendTransaction({value: web3.utils.toWei('10'), to: lotteryInstance.address, from: accounts[0]})
```

### 2. Deposit and set reward token allowance in Owner wallet

The owner must have some of the reward token in their wallet before issuing rewards. The owner must also give an allowance to the Lottery contract to grant permission to transfer tokens.

```
let lotteryInstance = await Lottery.deployed()
let erc20Mock = await ERC20Mock.deployed() // Replace with ERC20 reward token

await erc20Mock.mockMint(accounts[0], 10000);
await erc20Mock.approve(lotteryInstance.address, 10000)
```

## Usage

### View Outstanding Ticket Balance

```
let lotteryInstance = await Lottery.deployed()
let ticketInstance = await MintableTicket.deployed()

let ticketType = await lotteryInstance.getNextDrawTicketType()

let numTickets = await ticketInstance.maxIndex(ticketType)
numTickets.toString()
```
