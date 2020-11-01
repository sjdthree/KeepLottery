pragma solidity ^0.6.8;

interface ILottery {
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

    function isIssuingTickets() external view returns (bool);

    /**
     * @notice Returns the ticket type that will be drawn next
     * @return _id Ticket type to be drawn next
     */
    function getNextDrawTicketType() external view returns (uint256 _id);

    /**
     * @notice Returns the winning ticket from a given ticket type and random number
     * @param _drawTicketType Ticket type to draw
     * @param _randomNumber Random number
     * @return _winningTicket Winning ticket
     */
    function calculateWinningTicket(
        uint256 _drawTicketType,
        uint256 _randomNumber
    ) external view returns (uint256 _winningTicket);

    /**
     * @notice Triggers a lottery ticket drawing
     * @param _reward Reward to be given out on ticket draw
     */
    function triggerDrawTicket(uint256 _reward) external payable;

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
    ) external;

    /**
     * @notice Start issuing next ticket type
     */
    function startIssuingTickets() external;

    /**
     * @notice Stop issuing tickets
     */
    function stopIssuingTickets() external;
}
