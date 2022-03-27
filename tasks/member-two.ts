/* eslint-disable prettier/prettier */
/* eslint-disable no-empty-pattern */
import { task } from "hardhat/config";
import { LensHub__factory, FollowNFT__factory } from "../typechain-types";
import { waitForTx, initEnv, getAddrs, ZERO_ADDRESS, deployContract } from "./helpers/utils";
import addresses from '../addresses-one.json';

task('member-two', 'test adding second member to dao').setAction(async ({}, hre) =>{
    const ethers = hre.ethers;
    const accounts = await ethers.getSigners();
    const [ , ,user] = await initEnv(hre);
    const member = accounts[4];
    const member2 = accounts[5];
    const addrs = getAddrs();

    const lensHub = LensHub__factory.connect(addrs["lensHub proxy"], member2);

    console.log(`\n\t --- Joining dao with ${member2.address}`);
    
    await waitForTx(lensHub.follow([1], [[]]))

    console.log(`\n\n joined`);
    

    const followFactory = FollowNFT__factory.connect(addresses.followNFT, member2);

    const totalSupply = await followFactory.totalSupply();
    const ownerOf = await followFactory.ownerOf(1);

    console.log(`\n\t -- checks`);
    console.log(`\nTotalNFT supply : ${totalSupply}`);
    console.log(`\nOwner of token 1: ${ownerOf}`);
    
    console.log(`\n\t --- Delegating address ${member2.address} (should be owner)`);

    const delegateTx = await followFactory.delegate(member2.address);
    const delegateR = await delegateTx.wait(1);

    console.log(`\n\t --- Delgate Done ---`);
    
    // console.log(delegateR?.events[0]?.args);
    // console.log(delegateR?.events[1]?.args);
    
    
    console.log(`\n\t --- Checking delegate supply ---`);
    const block = await ethers.provider.getBlockNumber();
    const checkDelegateTx = await followFactory.getDelegatedSupplyByBlockNumber(block);

    console.log(`\n Delegate supply : ${checkDelegateTx}`);
    
    

})