/* eslint-disable prettier/prettier */
/* eslint-disable no-empty-pattern */
import { task } from 'hardhat/config';
import {
    TimeLock__factory,
    GovernorContract__factory,
    Box__factory
} from '../typechain-types';
import fs from 'fs';
import { deployContract, getAddrs, initEnv, waitForTx, ZERO_ADDRESS } from './helpers/utils';
import addresses from '../addresses-one.json';

task('deploy-dao', 'deploy contracts').setAction(async ({}, hre) =>{
    const ethers = hre.ethers;
    const accounts = await ethers.getSigners();
    const [,,user] = await initEnv(hre);
    const member = accounts[4];
    const followNFT = addresses.followNFT;

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
            followNFT,
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
    const revokeTx = await timeLock.revokeRole(adminRole, user.address)
    await revokeTx.wait(1)

    console.log('\n\t -- Roles Set --');

    // Deploy Box
    console.log('\n\t -- Deploying Box Contract --');
    const boxContract = await deployContract(
        new Box__factory(user).deploy()
    );
    console.log('\n\t -- Deployed at ', boxContract.address);

    const transferTx = await boxContract.transferOwnership(timeLock.address);
    await transferTx.wait(1);

    console.log('\n\t -- Passed all setup --');

    const addresses1 = {
        timeLock: timeLock.address,
        governorContract: governorContract.address,
        boxContract: boxContract.address
    }

    const json = JSON.stringify(addresses1, null, 2);
    fs.writeFileSync('addresses-two.json', json, 'utf-8');
})