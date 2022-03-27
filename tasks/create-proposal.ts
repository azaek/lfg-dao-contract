/* eslint-disable prettier/prettier */
/* eslint-disable no-empty-pattern */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { task } from "hardhat/config";
import { LensHub__factory, FollowNFT__factory, TimeLock__factory, GovernorContract__factory, Box__factory } from "../typechain-types";
import { CreateProfileDataStruct } from "../typechain-types/LensHub";
import { waitForTx, initEnv, getAddrs, ZERO_ADDRESS, deployContract } from "./helpers/utils";
import addresses from "../addresses-one.json";
import addresses1 from "../addresses-two.json";

task('create-proposal', 'create a proposal').setAction(async ({}, hre) => {
    const ethers = hre.ethers;
    const network = hre.network;
    const accounts = await ethers.getSigners();
    const member = accounts[4];

    const box = Box__factory.connect(addresses1.boxContract, member);
    const governorContract = GovernorContract__factory.connect(addresses1.governorContract, member);

    const proposalDescription = "Prop#1 : Set value to 10";
    const encodedFunctionCall = box.interface.encodeFunctionData("store", [10]);
    console.log(`Proposing store on ${box.address} with [10]`);
    const propTx = await governorContract.propose(
        [box.address],
        [0],
        [encodedFunctionCall],
        proposalDescription
    )

    const proposeReceipt = await propTx.wait(1);
    
    
    // @ts-ignore: Object is possibly 'null'.
    const proposalId = proposeReceipt!.events[0]!.args!.proposalId;

    console.log(`Proposed with id ${proposalId}`);
    
    console.log(`Proposal State : ${await governorContract.state(proposalId)}`);
    console.log(`Proposal Snapshot : ${await governorContract.proposalSnapshot(proposalId)}`);
    console.log(`Proposal Deadline : ${await governorContract.proposalDeadline(proposalId)}`);

    await network.provider.send('evm_mine')
    await network.provider.send('evm_mine')

    console.log(`\n\t --- Done ---`);
    
})