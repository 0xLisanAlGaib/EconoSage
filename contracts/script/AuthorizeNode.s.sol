// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script} from "forge-std/Script.sol";
import {Oracle} from "../src/v0.8/econosage/Oracle.sol";

contract AuthorizeNode is Script {
    function run() public {
        // Oracle contract address
        address oracle = 0x086C7dfa9B27d03520d1812E4772f31400E8f0Ac;
        // Chainlink node address
        address node = 0xe6C88a7C2d10d5E9572d359dC5c4cB4959057Bb9;

        uint256 deployerPrivateKey = vm.envUint("DEV_ADMIN_PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        // Authorize the node
        Oracle(oracle).setFulfillmentPermission(node, true);

        vm.stopBroadcast();
    }
}
