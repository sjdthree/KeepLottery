pragma solidity ^0.6.8;

import "./MintableTicket.sol";
import "./UniformRandomNumber.sol";
import "multi-token-standard/contracts/utils/SafeMath.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "./RandomBeacon/IRandomBeacon.sol";
import "./ILottery.sol";
import "multi-token-standard/contracts/interfaces/IERC20.sol";

contract Lottery is ILottery, Ownable {
    using SafeMath for uint256;

    event LotteryDrawTriggered(
        address _owner,
        uint256 indexed _keepRequestID,
        uint256 indexed _ticketType,
        uint256 _reward
    );

    event LotteryRewardIssued(
        address _owner,
        uint256 indexed _keepRequestID,
        address indexed _winner,
        uint256 indexed _winningTicket,
        uint256 _reward
    );

    uint256 internal _currentTicketType;
    bool internal _isIssuingTickets;

    MintableTicket ticketContract;
    IERC20 rewardTokenContract;

    IRandomBeacon public randomBeacon;

    constructor(
        address _ticketContract,
        address _rewardTokenContract,
        address _randomBeacon
    ) public {
        ticketContract = MintableTicket(_ticketContract);
        rewardTokenContract = IERC20(_rewardTokenContract);
        randomBeacon = IRandomBeacon(_randomBeacon);

        _currentTicketType = (1 << 255);
        _isIssuingTickets = false;
    }

    function isIssuingTickets() public override view returns (bool) {
        return _isIssuingTickets;
    }

    /**
     * @notice Returns the ticket type that will be drawn next
     * @return _id Ticket type to be drawn next
     */
    function getNextDrawTicketType()
        public
        override
        view
        returns (uint256 _id)
    {
        return _currentTicketType;
    }

    /**
     * @notice Receives payment
     */
    receive() external payable {}

    /**
     * @notice Allows owner to withdraw eth from contract
     *
     */
    function withdraw(uint256 amount) public onlyOwner {
        require(
            amount <= address(this).balance,
            "Insufficient funds to withdraw from owner"
        );
        msg.sender.transfer(amount);
    }

    /**
     * @notice Returns the winning ticket from a given ticket type and random number
     * @param _drawTicketType Ticket type to draw
     * @param _randomNumber Random number
     * @return _winningTicket Winning ticket
     */
    function calculateWinningTicket(
        uint256 _drawTicketType,
        uint256 _randomNumber
    ) public override view returns (uint256 _winningTicket) {
        uint256 numberOfOutstandingTickets = ticketContract.maxIndex(
            _drawTicketType
        );
        require(
            numberOfOutstandingTickets > 0,
            "At least one lottery ticket must be issued before drawing"
        );

        // Tickets are indexed by 1
        uint256 winningIndex = UniformRandomNumber
            .uniform(_randomNumber, numberOfOutstandingTickets)
            .add(1);
        uint256 winningId = _drawTicketType | winningIndex;

        return winningId;
    }

    /**
     * @notice Triggers a lottery ticket drawing
     * @param _reward Reward to be given out on ticket draw
     */
    function triggerDrawTicket(uint256 _reward)
        public
        override
        payable
        onlyOwner
    {
        require(
            _isIssuingTickets == false,
            "Ticket can only be drawn when they have stopped being issued"
        );
        uint256 drawTicketType = getNextDrawTicketType();
        uint256 fee = randomBeacon.entryFeeEstimate(0);

        (bool success, bytes memory result) = address(randomBeacon).call{
            value: fee
        }(abi.encodeWithSignature("requestRelayEntry()"));
        require(success, "Failure when calling random beacon");

        uint256 keepRequestID = abi.decode(result, (uint256));

        emit LotteryDrawTriggered(
            msg.sender,
            keepRequestID,
            drawTicketType,
            _reward
        );
    }

    /**
     * @notice Issues reward to winner
     * @param _keepRequestID Original Keep Request ID
     * @param _winner Winning address
     * @param _winningTicket Winning ticket
     * @param _reward Reward
     */
    function issueReward(
        uint256 _keepRequestID,
        address _winner,
        uint256 _winningTicket,
        uint256 _reward
    ) public override onlyOwner {
        require(_winner != address(0x0), "_winner should not be 0x0");
        require(_reward > 0, "_reward should be > 0");
        require(
            ticketContract.isNonFungibleItem(_winningTicket),
            "_winningTicket should not be ticket type"
        );

        // Issue ERC20 reward. Owner must have already approved transfer
        rewardTokenContract.transferFrom(owner(), _winner, _reward);

        emit LotteryRewardIssued(
            msg.sender,
            _keepRequestID,
            _winner,
            _winningTicket,
            _reward
        );
    }

    /**
     * @notice Start issuing next ticket type
     */
    function startIssuingTickets() public override onlyOwner {
        _currentTicketType = _currentTicketType.add(1 << 128);
        _isIssuingTickets = true;
    }

    /**
     * @notice Stop issuing tickets
     */
    function stopIssuingTickets() public override onlyOwner {
        _isIssuingTickets = false;
    }
}
