/* eslint-disable prettier/prettier */
/* eslint-disable no-empty-pattern */
import '@nomiclabs/hardhat-ethers';
import { hexlify, keccak256, RLP } from 'ethers/lib/utils';
import fs from 'fs';
import { task } from 'hardhat/config';
import {
    LensHub__factory
} from '../typechain-types';
import { CreateProfileDataStruct } from '../typechain-types/LensHub';
import { deployContract, getAddrs, initEnv, waitForTx, ZERO_ADDRESS } from './helpers/utils';

task('create-dao', 'mint a profile and deploy governor and propose and vote').setAction(
    async ({}, hre) => {
        const ethers = hre.ethers;
        const accounts = await ethers.getSigners();
        const [governance, ,user] = await initEnv(hre)
        const member = accounts[4];
        const addrs = getAddrs();
        // governance uses address 1, user 3
        const lensHub = LensHub__factory.connect(addrs["lensHub proxy"], governance);
        await waitForTx(lensHub.whitelistProfileCreator(user.address, true));

        const username = "agoradao"

        const inputStruct: CreateProfileDataStruct = {
            to: user.address,
            handle: username,
            imageURI: 'https://ipfs.fleek.co/ipfs/ghostplantghostplantghostplantghostplantghostplantghostplan',
            followModule: ZERO_ADDRESS,
            followModuleData: [],
            followNFTURI: 'https://ipfs.fleek.co/ipfs/ghostplantghostplantghostplantghostplantghostplantghostplan',
        }

        console.log(`\n\t --- addresses :>`);
        console.log(`Lens Governance : ${governance.address}`);
        console.log(`User : ${user.address}`);
        console.log(`Member : ${member.address}\n\t ---`);
        

        await waitForTx(lensHub.connect(user).createProfile(inputStruct));

        const profileId = await lensHub.getProfileIdByHandle(username);

        const followTx = await lensHub.connect(member).follow([profileId], [[]]);

        const followReciept = await followTx.wait(1);

        console.log(`followed from ${member.address} e: ${followReciept.events}`);
        
        const followNFT = await lensHub.getFollowNFT(profileId);

        console.log(`\n\t -- Follow Nft: ${followNFT}`);
        
        
        const address = {
            followNFT: followNFT,
            member: member.address,
            governance: governance.address,
            user: user.address,
            profileId: profileId
        }

        const json = JSON.stringify(address, null, 2);
        fs.writeFileSync('addresses-one.json', json, 'utf-8');
    }
)
