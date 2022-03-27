/* eslint-disable prettier/prettier */
/* eslint-disable no-empty-pattern */
import { task } from 'hardhat/config';
import {
    DAOFactory__factory
} from '../typechain-types';
import fs from 'fs';
import { deployContract, getAddrs, initEnv, waitForTx, ZERO_ADDRESS } from './helpers/utils';
import addresses from '../addresses-one.json';

task('deploy-dao-factory01', 'deploy contracts').setAction(async ({}, hre) =>{
    const ethers = hre.ethers;
    const accounts = await ethers.getSigners();
    const [,,user] = await initEnv(hre);
    const member = accounts[4];
    const followNFT = addresses.followNFT;

    console.log('\n\t -- Deploying Dao Factory --');
    // Deploy daoFactory
    console.log('\n\t -- FollowNFT --',followNFT);
    const daoFactory = await deployContract(
        new DAOFactory__factory(user).deploy(
            followNFT,
            4,
            5,
            1,
            3600
        )
    )
    console.log('\n\t -- DAOFactory Deployed at Address: ', daoFactory.address);
    
    console.log('\n\t -- DAOFactory Deployed new DAO ');

    await daoFactory.createDAO();

    console.log('\n\t -- Get Gov Address --');
    const govAddr = await daoFactory.getDaoAddress(0);

    console.log('\n\t -- Governor Deployed at: ', govAddr);


    console.log('\n\t -- Get Box Address --');
    const box = await daoFactory.getBoxAddress(0);

    console.log('\n\t -- Box Deployed at: ', box);


    console.log('\n\t -- Get Timelock Address --');
    const timeLock = await daoFactory.getTimelockAddress(0);

    console.log('\n\t -- Timelock Deployed at: ', timeLock);


    const addresses1 = {
        timeLock: timeLock,
        governorContract: govAddr,
        boxContract: box
    }

    const json = JSON.stringify(addresses1, null, 2);
    fs.writeFileSync('addresses-two.json', json, 'utf-8');
   
    console.log('\n\t -- Passed all setup --');

})