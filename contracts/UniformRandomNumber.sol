pragma solidity ^0.6.8;

import "multi-token-standard/contracts/utils/SafeMath.sol";

// https://medium.com/hownetworks/dont-waste-cycles-with-modulo-bias-35b6fdafcf94
// https://cmvandrevala.wordpress.com/2016/09/24/modulo-bias-when-generating-random-numbers/
// https://github.com/pooltogether/pooltogether-pool-contracts/blob/master/contracts/UniformRandomNumber.sol
library UniformRandomNumber {
    using SafeMath for uint256;

    /// @notice Select a random index without modulo bias
    /// @param _randomSeed The seed for randomness
    /// @param _upperBound The upper bound of the random number
    /// @return A random number less than the _upperBound
    function uniform(uint256 _randomSeed, uint256 _upperBound)
        internal
        pure
        returns (uint256)
    {
        require(_upperBound > 0, "_upperBound should be > 0");
        uint256 min = (-_upperBound).mod(_upperBound);
        uint256 random = _randomSeed;
        while (true) {
            if (random >= min) {
                break;
            }
            random = uint256(keccak256(abi.encodePacked(random)));
        }
        return random.mod(_upperBound);
    }
}
