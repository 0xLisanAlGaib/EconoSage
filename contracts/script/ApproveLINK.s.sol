// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ApproveLINK is Script {
    function run() public {
        // Sepolia LINK token address
        address linkToken = 0x779877A7B0D9E8603169DdbD7836e478b4624789;
        // US_GDP_Q contract address
        address gdpContract = 0x086C7dfa9B27d03520d1812E4772f31400E8f0Ac;
        // Oracle contract address
        address oracleContract = 0x086C7dfa9B27d03520d1812E4772f31400E8f0Ac;

        uint256 deployerPrivateKey = vm.envUint("DEV_ADMIN_PRIVATE_KEY");

        // Amount to approve (100 LINK = 100 * 10**18)
        uint256 approveAmount = 100 * 10 ** 18;

        vm.startBroadcast(deployerPrivateKey);

        // Approve both contracts to spend LINK tokens
        IERC20(linkToken).approve(gdpContract, approveAmount);
        IERC20(linkToken).approve(oracleContract, approveAmount);

        vm.stopBroadcast();
    }
}
