// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {US_GDP_Q} from "../src/v0.8/econosage/US_GDP_Q.sol";
import {MockLinkToken} from "@chainlink/contracts/src/v0.8/mocks/MockLinkToken.sol";

contract US_GDP_QTest is Test {
    US_GDP_Q public gdpOracle;
    MockLinkToken public linkToken;
    address public constant ORACLE_ADDRESS = address(1);
    bytes32 public constant JOB_ID = "6b88e0402e5d415eb946e528b8e0c7ba";

    // Test addresses
    address public constant OWNER = address(2);
    address public constant USER = address(3);

    // Events to test
    event GDPDataUpdated(
        uint256 indexed timestamp,
        int256 growthRate,
        uint8 quarter,
        uint16 year
    );

    function setUp() public {
        // Deploy mock LINK token
        linkToken = new MockLinkToken();

        // Deploy GDP oracle with test parameters
        vm.prank(OWNER);
        gdpOracle = new US_GDP_Q(address(linkToken), ORACLE_ADDRESS, JOB_ID);

        // Fund the oracle contract with LINK tokens
        deal(address(linkToken), address(gdpOracle), 10 * 10 ** 18); // 10 LINK
    }

    function test_InitialState() public view {
        assertEq(gdpOracle.owner(), OWNER);
        assertEq(gdpOracle.latestGrowthRate(), 0);
        assertEq(gdpOracle.latestQuarter(), 0);
        assertEq(gdpOracle.latestYear(), 0);
        assertEq(gdpOracle.lastUpdateTimestamp(), 0);
    }

    function test_RequestUpdate_OnlyOwner() public {
        // Should revert when called by non-owner
        vm.prank(USER);
        vm.expectRevert("Ownable: caller is not the owner");
        gdpOracle.requestGDPUpdate();

        // Should succeed when called by owner
        vm.prank(OWNER);
        bytes32 requestId = gdpOracle.requestGDPUpdate();
        assertNotEq(requestId, bytes32(0));
    }

    function test_UpdateOracle_OnlyOwner() public {
        address newOracle = address(4);

        // Should revert when called by non-owner
        vm.prank(USER);
        vm.expectRevert("Ownable: caller is not the owner");
        gdpOracle.updateOracle(newOracle);

        // Should revert with zero address
        vm.prank(OWNER);
        vm.expectRevert("Invalid oracle address");
        gdpOracle.updateOracle(address(0));

        // Should succeed with valid address
        vm.prank(OWNER);
        gdpOracle.updateOracle(newOracle);
    }

    function test_UpdateJobId_OnlyOwner() public {
        bytes32 newJobId = "7c80f6c7ebce484cb78c3b132b7a859a";

        // Should revert when called by non-owner
        vm.prank(USER);
        vm.expectRevert("Ownable: caller is not the owner");
        gdpOracle.updateJobId(newJobId);

        // Should revert with zero bytes32
        vm.prank(OWNER);
        vm.expectRevert("Invalid job ID");
        gdpOracle.updateJobId(bytes32(0));

        // Should succeed with valid job ID
        vm.prank(OWNER);
        gdpOracle.updateJobId(newJobId);
    }

    function test_WithdrawLink_OnlyOwner() public {
        uint256 initialBalance = linkToken.balanceOf(OWNER);

        // Should revert when called by non-owner
        vm.prank(USER);
        vm.expectRevert("Ownable: caller is not the owner");
        gdpOracle.withdrawLink();

        // Should succeed when called by owner
        vm.prank(OWNER);
        gdpOracle.withdrawLink();

        // Owner should receive the LINK tokens
        assertEq(linkToken.balanceOf(OWNER), initialBalance + 10 * 10 ** 18);
        assertEq(linkToken.balanceOf(address(gdpOracle)), 0);
    }

    function test_FulfillGDPData() public {
        // Simulate a Chainlink oracle response
        bytes32 requestId = bytes32("test_request");
        int256 growthRate = 2_500_000_000_000_000_000; // 2.5%
        uint8 quarter = 2;
        uint16 year = 2024;

        vm.prank(ORACLE_ADDRESS);
        vm.expectEmit(true, true, true, true);
        emit GDPDataUpdated(block.timestamp, growthRate, quarter, year);

        gdpOracle.fulfill(requestId, growthRate, quarter, year);

        // Verify state updates
        assertEq(gdpOracle.latestGrowthRate(), growthRate);
        assertEq(gdpOracle.latestQuarter(), quarter);
        assertEq(gdpOracle.latestYear(), year);
        assertEq(gdpOracle.lastUpdateTimestamp(), block.timestamp);
    }

    function testFail_FulfillGDPData_InvalidQuarter() public {
        bytes32 requestId = bytes32("test_request");
        int256 growthRate = 2_500_000_000_000_000_000; // 2.5%
        uint8 invalidQuarter = 5; // Invalid quarter (must be 1-4)
        uint16 year = 2024;

        vm.prank(ORACLE_ADDRESS);
        gdpOracle.fulfill(requestId, growthRate, invalidQuarter, year);
    }
}
