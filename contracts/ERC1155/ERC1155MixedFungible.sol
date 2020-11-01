pragma solidity ^0.6.8;

import "./ERC1155MintBurn.sol";

contract ERC1155MixedFungible is ERC1155MintBurn {
    // From https://github.com/enjin/erc-1155
    // Use a split bit implementation.
    // Store the type in the upper 128 bits..
    uint256 constant TYPE_MASK = uint256(uint128(~0)) << 128;

    // ..and the non-fungible index in the lower 128
    uint256 constant NF_INDEX_MASK = uint128(~0);

    // The top bit is a flag to tell if this is a NFI.
    uint256 constant TYPE_NF_BIT = 1 << 255;

    mapping (uint256 => address) nfOwners;

    // Only to make code clearer. Should not be functions
    function isNonFungible(uint256 _id) public pure returns(bool) {
        return _id & TYPE_NF_BIT == TYPE_NF_BIT;
    }
    function isFungible(uint256 _id) public pure returns(bool) {
        return _id & TYPE_NF_BIT == 0;
    }
    function getNonFungibleIndex(uint256 _id) public pure returns(uint256) {
        return _id & NF_INDEX_MASK;
    }
    function getNonFungibleBaseType(uint256 _id) public pure returns(uint256) {
        return _id & TYPE_MASK;
    }
    function isNonFungibleBaseType(uint256 _id) public pure returns(bool) {
        // A base type has the NF bit but does not have an index.
        return (_id & TYPE_NF_BIT == TYPE_NF_BIT) && (_id & NF_INDEX_MASK == 0);
    }
    function isNonFungibleItem(uint256 _id) public pure returns(bool) {
        // A base type has the NF bit but does has an index.
        return (_id & TYPE_NF_BIT == TYPE_NF_BIT) && (_id & NF_INDEX_MASK != 0);
    }
    function ownerOf(uint256 _id) public view returns (address) {
        return nfOwners[_id];
    }

    /**
    * @notice Get the balance of an account's Tokens
    * @param _owner  The address of the token holder
    * @param _id     ID of the Token
    * @return The _owner's balance of the Token type requested
    */
    function balanceOf(address _owner, uint256 _id)
        public override view returns (uint256)
    {
        if (isNonFungibleItem(_id))
            return nfOwners[_id] == _owner ? 1 : 0;
        return balances[_owner][_id];
    }

    /**
    * @notice Get the balance of multiple account/token pairs
    * @param _owners The addresses of the token holders
    * @param _ids    ID of the Tokens
    * @return        The _owner's balance of the Token types requested (i.e. balance for each (owner, id) pair)
    */
    function balanceOfBatch(address[] memory _owners, uint256[] memory _ids)
        public override view returns (uint256[] memory)
    {
        require(_owners.length == _ids.length, "ERC1155MixedFungible#balanceOfBatch: INVALID_ARRAY_LENGTH");

        // Variables
        uint256[] memory batchBalances = new uint256[](_owners.length);

        // Iterate over each owner and token ID
        for (uint256 i = 0; i < _owners.length; i++) {
            if (isNonFungibleItem(_ids[i])) {
                batchBalances[i] = nfOwners[_ids[i]] == _owners[i] ? 1 : 0;
            } else {
                batchBalances[i] = balances[_owners[i]][_ids[i]];
            }
        }

        return batchBalances;
    }

    /**
    * @notice Transfers amount amount of an _id from the _from address to the _to address specified
    * @param _from    Source address
    * @param _to      Target address
    * @param _id      ID of the token type
    * @param _amount  Transfered amount
    * @param _data    Additional data with no specified format, sent in call to `_to`
    */
    function safeTransferFrom(address _from, address _to, uint256 _id, uint256 _amount, bytes memory _data)
        public override
    {
        require((msg.sender == _from) || isApprovedForAll(_from, msg.sender), "ERC1155MixedFungible#safeTransferFrom: INVALID_OPERATOR");
        require(_to != address(0),"ERC1155MixedFungible#safeTransferFrom: INVALID_RECIPIENT");
        // require(_amount <= balances[_from][_id]) is not necessary since checked with safemath operations
        require(isNonFungibleItem(_id) == false, "ERC1155MixedFungible#safeTransferFrom: NFT_TRANSFER_NOT_ALLOWED");

        _safeTransferFrom(_from, _to, _id, _amount);
        _callonERC1155Received(_from, _to, _id, _amount, gasleft(), _data);
    }

    /**
    * @notice Send multiple types of Tokens from the _from address to the _to address (with safety call)
    * @param _from     Source addresses
    * @param _to       Target addresses
    * @param _ids      IDs of each token type
    * @param _amounts  Transfer amounts per token type
    */
    function _safeBatchTransferFrom(address _from, address _to, uint256[] memory _ids, uint256[] memory _amounts)
        internal override
    {
        require(_ids.length == _amounts.length, "ERC1155#_safeBatchTransferFrom: INVALID_ARRAYS_LENGTH");

        // Number of transfer to execute
        uint256 nTransfer = _ids.length;

        // Executing all transfers
        for (uint256 i = 0; i < nTransfer; i++) {
            require(isNonFungibleItem(_ids[i]) == false, "ERC1155MixedFungible#safeTransferFrom: NFT_TRANSFER_NOT_ALLOWED");

            // Update storage balance of previous bin
            balances[_from][_ids[i]] = balances[_from][_ids[i]].sub(_amounts[i]);
            balances[_to][_ids[i]] = balances[_to][_ids[i]].add(_amounts[i]);
        }

        // Emit event
        emit TransferBatch(msg.sender, _from, _to, _ids, _amounts);
    }
}