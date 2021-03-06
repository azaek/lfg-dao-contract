/* eslint-disable prettier/prettier */
/* eslint-disable no-empty-pattern */
import { task } from "hardhat/config";

task("accounts", "Prints the list of accounts").setAction(
    async ({}, hre) => {
        const accounts = await hre.ethers.getSigners();

        for (const account of accounts) {
            console.log(account);
        }
    }
)