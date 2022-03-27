// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import './governance_standard/GovernorContract.sol';
import './governance_standard/TimeLock.sol';
import './Box.sol';

contract DAOFactory{ 
    
    GovernorContract[] public DaoList;
    Box[] public BoxList;
    TimeLock[] public TimelockList;

    address[] public tlProposer;
    address[] public tlExecuter;

    uint256 quorumPercentage;
    uint256 votingPeriod;
    uint256 votingDelay;
    uint256 minDelay;
    FollowNFT token;

    constructor(
        FollowNFT _token,
        uint256 _quorumPercentage,
        uint256 _votingPeriod,
        uint256 _votingDelay,
        uint256 _minDelay
    ){
        quorumPercentage = _quorumPercentage;
        votingPeriod = _votingPeriod;
        votingDelay = _votingDelay;
        minDelay = _minDelay;
        token = _token;


    }
    
    function createDAO() public{
        
        TimeLock timelockAddress = new TimeLock(minDelay,tlProposer,tlExecuter);
        GovernorContract governorAddress = new GovernorContract(token,timelockAddress,quorumPercentage,votingPeriod,votingDelay);
        Box boxAddress = new Box();  

        address myAddress = 0x0000000000000000000000000000000000000000;

        bytes32 proposerRole = timelockAddress.PROPOSER_ROLE();
        bytes32 executorRole = timelockAddress.EXECUTOR_ROLE();
        bytes32 adminRole = timelockAddress.TIMELOCK_ADMIN_ROLE();

        timelockAddress.grantRole(proposerRole, address(governorAddress));
    
        timelockAddress.grantRole(executorRole, myAddress);
    
        timelockAddress.revokeRole(adminRole, msg.sender);

        boxAddress.transferOwnership(address(timelockAddress));
    
        DaoList.push(governorAddress);  
        BoxList.push(boxAddress);  
        TimelockList.push(timelockAddress);

    }

    
    function getDaoAddress(uint x) public view returns(address){

        return address(DaoList[x]);

    }

    //Getter for local testing
    function getBoxAddress(uint x) public view returns(address){

        return address(BoxList[x]);

    }

    function getTimelockAddress(uint x) public view returns(address){

        return address(TimelockList[x]);

    }


}