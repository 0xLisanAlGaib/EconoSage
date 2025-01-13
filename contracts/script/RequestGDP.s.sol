// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script} from "forge-std/Script.sol";
import {US_GDP_Q} from "../src/v0.8/econosage/US_GDP_Q.sol";

contract RequestGDP is Script {
    function run() public {
        // Load environment variables
        uint256 deployerPrivateKey = vm.envUint("DEV_ADMIN_PRIVATE_KEY");
        address gdpContract = 0x8c2acF6Fb82305f19fbB3F60a53810b17df9BC9B;

        // Start broadcasting
        vm.startBroadcast(deployerPrivateKey);

        // Request GDP update
        US_GDP_Q(gdpContract).requestGDPUpdate();

        vm.stopBroadcast();
    }
}
