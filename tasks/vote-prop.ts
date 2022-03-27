/* eslint-disable prettier/prettier */
/* eslint-disable no-empty-pattern */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { task } from "hardhat/config";
import { LensHub__factory, FollowNFT__factory, TimeLock__factory, GovernorContract__factory, Box__factory } from "../typechain-types";
import { CreateProfileDataStruct } from "../typechain-types/LensHub";
import { waitForTx, initEnv, getAddrs, ZERO_ADDRESS, deployContract } from "./helpers/utils";
import addresses from "../addresses-one.json";
import addresses1 from "../addresses-two.json";

task('vote-prop', 'Vote on prop').setAction(async ({}, hre) => {
    const ethers = hre.ethers;
    const network = hre.network;
    const accounts = await ethers.getSigners();
    const member = accounts[4];

    const box = Box__factory.connect(addresses1.boxContract, member);
    const governorContract = GovernorContract__factory.connect(addresses1.governorContract, member);

    const proposalDescription = "Prop#1 : Set value to 10";
    const encodedFunctionCall = box.interface.encodeFunctionData("store", [10]);
    // paste prop id here
    const propId = ethers.BigNumber.from("87086985988182994870492423461433650264359122399922666454632959627357395611535");
    const voteWay = 1;
    const reason = "Agree"

    console.log('\n\t ---');

    console.log(`Proposal State : ${await governorContract.state(propId)}`);
    console.log(`Proposal Snapshot : ${await governorContract.proposalSnapshot(propId)}`);
    console.log(`Proposal Deadline : ${await governorContract.proposalDeadline(propId)}`);

    console.log(`\n\t --- Voting --- `);
    
    const voteTx = await governorContract.castVoteWithReason(
        propId,
        voteWay,
        reason
    )
    
    const voteReceipt = await voteTx.wait(1);
    // @ts-ignore: Object is possibly 'null'.
    console.log(`Voted with reason ${voteReceipt.events[0].args.reason}`);

    console.log(`\n\t --- Voted ---`);

    console.log('\n\t ---');

    console.log(`Proposal State : ${await governorContract.state(propId)}`);
    console.log(`Proposal Snapshot : ${await governorContract.proposalSnapshot(propId)}`);
    console.log(`Proposal Deadline : ${await governorContract.proposalDeadline(propId)}`);
    
    await network.provider.send('evm_mine')
    await network.provider.send('evm_mine')
    await network.provider.send('evm_mine')
    await network.provider.send('evm_mine')
    await network.provider.send('evm_mine')
    await network.provider.send('evm_mine')
    console.log('Time passed..');

    console.log(`\n\t --- Done ---`);
    
})