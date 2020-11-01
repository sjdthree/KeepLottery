pragma solidity ^0.6.8;

import "./IRandomBeacon.sol";

contract StubRandomBeacon is IRandomBeacon {
    uint256 internal _seq;
    uint256 internal _previousEntry;

    event RelayEntryRequested(uint256 requestId);

    function entryFeeEstimate(uint256)
        external
        override
        view
        returns (uint256)
    {
        return 100;
    }

    function requestRelayEntry() external override payable returns (uint256) {
        return this.requestRelayEntry(address(0), 0);
    }

    function requestRelayEntry(address, uint256)
        external
        override
        payable
        returns (uint256)
    {
        uint256 requestId = _seq++;
        emit RelayEntryRequested(requestId);

        // Return mocked data instead of interacting with relay.
        uint256 groupSignature = uint256(
            keccak256(abi.encodePacked(_previousEntry, block.timestamp))
        );
        emit RelayEntryGenerated(requestId, groupSignature);

        _previousEntry = groupSignature;

        return requestId;
    }
}
