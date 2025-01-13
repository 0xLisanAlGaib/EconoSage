// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {Oracle} from "../src/v0.8/econosage/Oracle.sol";

contract DeployOracle is Script {
    // Sepolia LINK token address
    address constant LINK_TOKEN = 0x779877A7B0D9E8603169DdbD7836e478b4624789;

    function run() external returns (Oracle) {
        uint256 deployerPrivateKey = vm.envUint("DEV_ADMIN_PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        Oracle oracle = new Oracle(LINK_TOKEN);

        vm.stopBroadcast();

        return oracle;
    }
}
