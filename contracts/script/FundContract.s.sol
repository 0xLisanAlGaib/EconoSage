// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract FundContract is Script {
    function run() public {
        // Sepolia LINK token address
        address linkToken = 0x779877A7B0D9E8603169DdbD7836e478b4624789;
        // US_GDP_Q contract address
        address gdpContract = 0x086C7dfa9B27d03520d1812E4772f31400E8f0Ac;

        uint256 deployerPrivateKey = vm.envUint("DEV_ADMIN_PRIVATE_KEY");

        // Amount to transfer (1 LINK = 1 * 10**18)
        uint256 fundAmount = 1 * 10 ** 18;

        vm.startBroadcast(deployerPrivateKey);

        // Transfer LINK tokens to the contract
        IERC20(linkToken).transfer(gdpContract, fundAmount);

        vm.stopBroadcast();
    }
}
