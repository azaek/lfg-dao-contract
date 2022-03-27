// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/governance/Governor.sol';
import '../core/FollowNFT.sol';

abstract contract GovernorVotesMock is Governor {
    FollowNFT public immutable fToken;

    constructor(FollowNFT tokenAddress) {
        fToken = tokenAddress;
    }

    function getVotes(address account, uint256 blockNumber) public view virtual override returns (uint256) {
        uint256 votes = fToken.getPowerByBlockNumber(account, blockNumber);
        return votes;
    }
}