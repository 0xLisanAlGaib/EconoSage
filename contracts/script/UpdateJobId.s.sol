// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script} from "forge-std/Script.sol";
import {US_GDP_Q} from "../src/v0.8/econosage/US_GDP_Q.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract UpdateJobId is Script {
    function run() public {
        // Load environment variables
        uint256 deployerPrivateKey = vm.envUint("DEV_ADMIN_PRIVATE_KEY");
        address gdpContract = 0x8c2acF6Fb82305f19fbB3F60a53810b17df9BC9B;

        // Convert UUID to bytes32 by taking first 32 characters
        string memory jobIdStr = "8a5f1c49e1594111a152d73c42b605ef";
        bytes32 jobId = stringToBytes32(jobIdStr);

        // Start broadcasting
        vm.startBroadcast(deployerPrivateKey);

        // Update job ID
        US_GDP_Q(gdpContract).updateJobId(jobId);

        vm.stopBroadcast();
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
