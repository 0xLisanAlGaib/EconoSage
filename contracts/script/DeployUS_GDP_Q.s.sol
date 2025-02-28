// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script} from "forge-std/Script.sol";
import {US_GDP_Q} from "../src/v0.8/econosage/US_GDP_Q.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract DeployUS_GDP_Q is Script {
    function run() public returns (US_GDP_Q) {
        // Load environment variables
        address linkToken = 0x779877A7B0D9E8603169DdbD7836e478b4624789; // Sepolia LINK token address
        address oracle = vm.envAddress("ORACLE_ADDRESS");
        string memory jobIdStr = vm.envString("JOB_ID");
        bytes32 jobId = stringToBytes32(jobIdStr);
        uint256 deployerPrivateKey = vm.envUint("DEV_ADMIN_PRIVATE_KEY");

        // Start broadcasting
        vm.startBroadcast(deployerPrivateKey);

        // Deploy US_GDP_Q contract
        US_GDP_Q gdp = new US_GDP_Q(linkToken, oracle, jobId);

        vm.stopBroadcast();

        return gdp;
    }

    function stringToBytes32(
        string memory source
    ) internal pure returns (bytes32 result) {
        bytes memory tempEmptyStringTest = bytes(source);
        if (tempEmptyStringTest.length == 0) {
            return 0x0;
        }

        assembly {
            result := mload(add(source, 32))
        }
    }
}
