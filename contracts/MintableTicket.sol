pragma solidity ^0.6.8;

import "./ERC1155/ERC1155MixedFungibleMintable.sol";
import "./ILottery.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

contract MintableTicket is
    ERC1155MixedFungibleMintable,
    Ownable,
    AccessControl
{
    ILottery public lotteryContract;

    bytes32 public constant TICKET_MINTER_ROLE = keccak256(
        "TICKET_MINTER_ROLE"
    );

    constructor() public {
        // Set owner
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(TICKET_MINTER_ROLE, msg.sender);
    }

    /**
     * @dev Set the lottery contract
     * @param _lotteryContract The address of the Lottery contract
     */

    function setLotteryContract(address payable _lotteryContract)
        public
        virtual
        onlyOwner
    {
        lotteryContract = ILottery(_lotteryContract);
    }

    /**
     * @dev Mint a ticket of a given id
     * @param _to The address to mint the ticket to.
     * @param _type The type of ticket to be minted
     */
    function mintTicket(address _to, uint256 _type) public {
        require(
            _to == msg.sender || hasRole(TICKET_MINTER_ROLE, msg.sender),
            "Sender must be a minter or can only mint ticket to themself"
        );
        require(
            lotteryContract.isIssuingTickets() == true,
            "Can only mint tickets while they are being issued"
        );
        require(
            _type == lotteryContract.getNextDrawTicketType(),
            "Can only mint ticket type being issued"
        );

        _mintNonFungibles(_to, _type, 1);
    }
}
