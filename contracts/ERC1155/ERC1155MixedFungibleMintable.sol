pragma solidity ^0.6.8;

import "./ERC1155MixedFungible.sol";

contract ERC1155MixedFungibleMintable is ERC1155MixedFungible {
    mapping (uint256 => uint256) public maxIndex;

    /**
    * @dev Mint non fungibles of a given type
    * @param _to The address to mint the ticket to.
    * @param _type The type of NFT to be minted
    * @param _amount The amount of NFTs to be minted
    */
    function _mintNonFungibles(address _to, uint256 _type, uint256 _amount)
        internal
    {
        require(isNonFungible(_type), "Type is not a ticket");

        // Index are 1-based.
        uint256 index = maxIndex[_type] + 1;
        maxIndex[_type] = _amount.add(maxIndex[_type]);

        uint256[] memory ids = new uint256[](_amount);
        uint256[] memory amounts = new uint256[](_amount);

        for (uint256 i = 0; i < _amount; ++i) {
            uint256 id = _type | index + i;

            nfOwners[id] = _to;

            balances[_to][_type]++;

            ids[i] = id;
            amounts[i] = 1;
        }

        // Emit batch mint event
        emit TransferBatch(msg.sender, address(0x0), _to, ids, amounts);

        // Calling onReceive method if recipient is contract
        _callonERC1155BatchReceived(address(0x0), _to, ids, amounts, gasleft(), new bytes(0));
    }
}