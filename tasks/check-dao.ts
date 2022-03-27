/* eslint-disable prettier/prettier */
/* eslint-disable no-empty-pattern */
import { task } from "hardhat/config";
import { LensHub__factory, FollowNFT__factory } from "../typechain-types";
import { waitForTx, initEnv, getAddrs, ZERO_ADDRESS, deployContract } from "./helpers/utils";
import addresses from '../addresses-one.json';

task('test-dao', 'test the tokens and delegation').setAction(async ({}, hre) =>{
    const ethers = hre.ethers;
    const accounts = await ethers.getSigners();
    const [ , ,user] = await initEnv(hre);
    const member = accounts[4];
    const addrs = getAddrs();

    const followFactory = FollowNFT__factory.connect(addresses.followNFT, member);

    const totalSupply = await followFactory.totalSupply();
    const ownerOf = await followFactory.ownerOf(1);

    console.log(`\n\t -- checks`);
    console.log(`\nTotalNFT supply : ${totalSupply}`);
    console.log(`\nOwner of token 1: ${ownerOf}`);
    
    console.log(`\n\t --- Delegating address ${member.address} (should be owner)`);

    const delegateTx = await followFactory.delegate(member.address);
    const delegateR = await delegateTx.wait(1);

    console.log(`\n\t --- Delgate Done ---`);
    
    // console.log(delegateR?.events[0]?.args);
    // console.log(delegateR?.events[1]?.args);
    
    
    console.log(`\n\t --- Checking delegate supply ---`);
    const block = await ethers.provider.getBlockNumber();
    const checkDelegateTx = await followFactory.getDelegatedSupplyByBlockNumber(block);

    console.log(`\n Delegate supply : ${checkDelegateTx}`);
    
    

})