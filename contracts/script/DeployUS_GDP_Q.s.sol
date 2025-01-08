// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {US_GDP_Q} from "../src/v0.8/econosage/US_GDP_Q.sol";

contract DeployUS_GDP_Q is Script {
    // Configuration
    address public constant LINK_TOKEN_SEPOLIA =
        0x779877A7B0D9E8603169DdbD7836e478b4624789;
    address public constant ORACLE_ADDRESS_SEPOLIA = address(0); // TODO: Add oracle address
    bytes32 public constant JOB_ID = "6b88e0402e5d415eb946e528b8e0c7ba"; // TODO: Add actual job ID

    function run() public {
        // Retrieve deployer private key from environment
        uint256 deployerPrivateKey = vm.envUint("DEV_ADMIN_PRIVATE_KEY");

        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);

        // Deploy the oracle contract
        US_GDP_Q gdpOracle = new US_GDP_Q(
            LINK_TOKEN_SEPOLIA,
            ORACLE_ADDRESS_SEPOLIA,
            JOB_ID
        );

        // Log deployment info
        console.log("GDP Oracle deployed to:", address(gdpOracle));
        console.log("Owner:", gdpOracle.owner());

        vm.stopBroadcast();
    }
}
