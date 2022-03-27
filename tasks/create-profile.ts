/* eslint-disable prettier/prettier */
/* eslint-disable no-empty-pattern */
import { task } from "hardhat/config";
import { LensHub__factory, FollowNFT__factory, TimeLock__factory, GovernorContract__factory, Box__factory } from "../typechain-types";
import { CreateProfileDataStruct } from "../typechain-types/LensHub";
import { waitForTx, initEnv, getAddrs, ZERO_ADDRESS, deployContract } from "./helpers/utils";

task("create-profile", "creates a profile").setAction(async ({ }, hre) => {
    const [governance, , user] = await initEnv(hre);
    const ethers = hre.ethers;
    const network = hre.network;
    const accounts = await ethers.getSigners();
    const deployer = accounts[0];
    const follower = accounts[1];
    const addrs = getAddrs();
    const lensHub = LensHub__factory.connect(addrs["lensHub proxy"], governance);

    await waitForTx(lensHub.whitelistProfileCreator(user.address, true));

    const username = "demo022"

    const inputStruct: CreateProfileDataStruct = {
        to: user.address,
        handle: username,
        imageURI: 'https://ipfs.fleek.co/ipfs/ghostplantghostplantghostplantghostplantghostplantghostplan',
        followModule: ZERO_ADDRESS,
        followModuleData: [],
        followNFTURI: 'https://ipfs.fleek.co/ipfs/ghostplantghostplantghostplantghostplantghostplantghostplan',
    }

    await waitForTx(lensHub.connect(user).createProfile(inputStruct));

    console.log(`Total supply (should be 1): ${await lensHub.totalSupply()}`);
    console.log(
        `Profile owner: ${await lensHub.ownerOf(1)}, user address (shouls be the same): ${user.address}`
    );
    console.log(
        `Profile ID by handle: ${await lensHub.getProfileIdByHandle(
            username
        )}, user address (should be the same): ${user.address}`
    );

    const profileId = await lensHub.getProfileIdByHandle(username);

    const followData = await lensHub.follow([profileId], [[]] );

    const followR =  await followData.wait(1)

    console.log(`Followed profile with ${profileId} \n ${followR.events}`);

    const _followNFT = await lensHub.getFollowNFT(profileId);

    const followNFTContract = FollowNFT__factory.connect(_followNFT, user) ;

    console.log(`\n\t -- Follow NFT ${_followNFT}`); 
    let block = await ethers.provider.getBlockNumber();

    console.log(`\n\t -- Delegating -- `);
    await followNFTContract.delegate(user.address);

    
    console.log(`delegateSupply ${ await followNFTContract.getDelegatedSupplyByBlockNumber(block) } `);
    

    // Governor setup on profile

    // Deploy TimeLock
    console.log('\n\t -- Deploying TimeLock --');
    const timeLock = await deployContract(
        new TimeLock__factory(user).deploy(
            3600,
            [],
            []
        )
    )
    console.log('\n\t -- Deployed at ', timeLock.address);

    // Deploy Governor Contract
    console.log('\n\t -- Deploying Governor Contract --');
    const governorContract = await deployContract(
        new GovernorContract__factory(user).deploy(
            _followNFT,
            timeLock.address,
            4,
            5,
            1
        )
    )
    console.log('\n\t -- Deployed at ', governorContract.address);
    

    // Setting-up roles
    console.log('\n\t -- Setting up roles --');
    const proposerRole = await timeLock.PROPOSER_ROLE()
    const executorRole = await timeLock.EXECUTOR_ROLE()
    const adminRole = await timeLock.TIMELOCK_ADMIN_ROLE()

    const proposerTx = await timeLock.grantRole(proposerRole, governorContract.address);
    await proposerTx.wait(1);
    const executorTx = await timeLock.grantRole(executorRole, ZERO_ADDRESS)
    await executorTx.wait(1)
    const revokeTx = await timeLock.revokeRole(adminRole, deployer.address)
    await revokeTx.wait(1)

    console.log('\n\t -- Roles Set --');

    // Deploy Box
    console.log('\n\t -- Deploying Box Contract --');
    const boxContract = await deployContract(
        new Box__factory(deployer).deploy()
    );
    console.log('\n\t -- Deployed at ', boxContract.address);

    const transferTx = await boxContract.transferOwnership(timeLock.address);
    await transferTx.wait(1);

    console.log('\n\t -- Passed all setup --');

    block = await ethers.provider.getBlockNumber();

    const voteP = await governorContract.getVotes(
        user.address,
        block
    )
    console.log(`user votes ${voteP}`);
    
    
    const cVal = await boxContract.retrieve();
    console.log(`Current Value : ${cVal}`);

    const proposalDescription = "Proposal #1 : Set the vale to 77";
    const descriptionHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(proposalDescription));
    const encodeFunctionCall = boxContract.interface.encodeFunctionData("store", [77])
    console.log(`Proposing store on ${boxContract.address} with [77]`);
    const proposeTx = await governorContract.propose(
        [boxContract.address],
        [0],
        [encodeFunctionCall],
        proposalDescription
    )

    const proposeReceipt = await proposeTx.wait(1);
    const proposalId = proposeReceipt.events[0].args.proposalId
    console.log(`Proposed with id ${proposalId}`);

    console.log(`Proposal State : ${await governorContract.state(proposalId)}`);
    console.log(`Proposal Snapshot : ${await governorContract.proposalSnapshot(proposalId)}`);
    console.log(`Proposal Deadline : ${await governorContract.proposalDeadline(proposalId)}`);
    
    await network.provider.send('evm_mine')
    await network.provider.send('evm_mine')
    console.log('Time passed..');

    const voteWay = 0;
    const reason = 'Aprrove cuz i like it'
    
    console.log(`\n\t -- voting Approve --`);
    
    const voteTx = await governorContract.castVoteWithReason(
        proposalId,
        voteWay,
        reason
    )
    const voteReceipt = await voteTx.wait(1);

    console.log(`Voted with reason ${voteReceipt.events[0].args.reason}`);
    console.log(`\n ${voteReceipt.events[0]}`);
    
    console.log('\n\t ---');

    console.log(`has voted : ${await governorContract.hasVoted(proposalId, deployer.address)}`);
    console.log(`supply : ${ await followNFTContract.totalSupply()} `)
    block = await ethers.provider.getBlockNumber();
    console.log(`blocknumber : ${block}`);
    console.log(`quorum : ${await governorContract.quorum(block)}`);
    console.log(`getVotes: ${ await governorContract.getVotes(deployer.address, block) }`);
    console.log(`delegateSupply ${ await followNFTContract.getDelegatedSupplyByBlockNumber(block) } `);
    
    

    console.log('\n\t ---');

    console.log(`Proposal State : ${await governorContract.state(proposalId)}`);
    console.log(`Proposal Snapshot : ${await governorContract.proposalSnapshot(proposalId)}`);
    console.log(`Proposal Deadline : ${await governorContract.proposalDeadline(proposalId)}`);
    
    await network.provider.send('evm_mine')
    await network.provider.send('evm_mine')
    await network.provider.send('evm_mine')
    await network.provider.send('evm_mine')
    await network.provider.send('evm_mine')
    console.log('Time passed..');

    console.log(`\n\t --- Queueing...`);
    console.log(`Proposal State : ${await governorContract.state(proposalId)}`);
    
    const queueTx = await governorContract.queue(
        [boxContract.address], 
        [0], 
        [encodeFunctionCall], 
        descriptionHash
    );
    await queueTx.wait(1);

    console.log('\n queued \n');
    console.log(`Proposal State : ${await governorContract.state(proposalId)}`);
    console.log(`Proposal Snapshot : ${await governorContract.proposalSnapshot(proposalId)}`);
    console.log(`Proposal Deadline : ${await governorContract.proposalDeadline(proposalId)}`);
    

    await network.provider.send("evm_increaseTime", [3601])
    await network.provider.send('evm_mine')
    console.log('Time passed..');
    

    console.log(`\n\t --- Executing...`);
    const executeTx = await governorContract.execute(
        [boxContract.address],
        [0],
        [encodeFunctionCall],
        descriptionHash
    )

    await executeTx.wait(1);
    console.log(`\n\t -- Executed --`);

    console.log(`new value : ${boxContract.retrieve().toString()}`);
    
    

});