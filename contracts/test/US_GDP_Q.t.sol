// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console, Vm} from "forge-std/Test.sol";
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
        vm.expectRevert(
            abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", USER)
        );
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
        vm.expectRevert(
            abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", USER)
        );
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
        vm.expectRevert(
            abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", USER)
        );
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
        vm.expectRevert(
            abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", USER)
        );
        gdpOracle.withdrawLink();

        // Should succeed when called by owner
        vm.prank(OWNER);
        gdpOracle.withdrawLink();

        // Owner should receive the LINK tokens
        assertEq(linkToken.balanceOf(OWNER), initialBalance + 10 * 10 ** 18);
        assertEq(linkToken.balanceOf(address(gdpOracle)), 0);
    }

    function test_FulfillGDPData() public {
        // Create the request and get the request ID
        vm.prank(OWNER);
        bytes32 requestId = gdpOracle.requestGDPUpdate();

        // Prepare test data
        int256 growthRate = 2_500_000_000_000_000_000; // 2.5%
        uint8 quarter = 2;
        uint16 year = 2024;

        // Create expected event data
        vm.expectEmit(true, true, true, true, address(gdpOracle));
        emit GDPDataUpdated(block.timestamp, growthRate, quarter, year);

        // Execute the fulfill function with the correct request ID
        vm.prank(ORACLE_ADDRESS);
        gdpOracle.fulfill(requestId, growthRate, quarter, year);

        // Verify state updates
        assertEq(gdpOracle.latestGrowthRate(), growthRate);
        assertEq(gdpOracle.latestQuarter(), quarter);
        assertEq(gdpOracle.latestYear(), year);
        assertEq(gdpOracle.lastUpdateTimestamp(), block.timestamp);
    }

    function test_RevertWhen_FulfillGDPData_InvalidQuarter() public {
        // Create the request and get the request ID
        vm.prank(OWNER);
        bytes32 requestId = gdpOracle.requestGDPUpdate();

        // Prepare test data with invalid quarter
        int256 growthRate = 2_500_000_000_000_000_000; // 2.5%
        uint8 invalidQuarter = 5; // Invalid quarter (must be 1-4)
        uint16 year = 2024;

        // Should revert with invalid quarter
        vm.prank(ORACLE_ADDRESS);
        vm.expectRevert("Invalid quarter");
        gdpOracle.fulfill(requestId, growthRate, invalidQuarter, year);
    }

    function test_RevertWhen_InsufficientLinkBalance() public {
        // Drain LINK balance
        vm.prank(OWNER);
        gdpOracle.withdrawLink();

        // Should revert when trying to request without LINK
        vm.prank(OWNER);
        vm.expectRevert();
        gdpOracle.requestGDPUpdate();
    }

    function test_RevertWhen_UnauthorizedOracleFulfills() public {
        // Create request
        vm.prank(OWNER);
        bytes32 requestId = gdpOracle.requestGDPUpdate();

        // Try to fulfill from unauthorized address
        vm.prank(USER);
        vm.expectRevert("Source must be the oracle of the request");
        gdpOracle.fulfill(requestId, 0, 1, 2024);
    }

    function test_GrowthRatePrecision() public {
        // Create request
        vm.prank(OWNER);
        bytes32 requestId = gdpOracle.requestGDPUpdate();

        // Test with various precision levels
        int256 preciseRate = 2_500_000_000_000_000_000; // 2.5% with 18 decimals
        uint8 quarter = 1;
        uint16 year = 2024;

        vm.prank(ORACLE_ADDRESS);
        gdpOracle.fulfill(requestId, preciseRate, quarter, year);

        assertEq(
            gdpOracle.latestGrowthRate(),
            preciseRate,
            "Growth rate precision mismatch"
        );
    }

    function test_MultipleUpdates() public {
        // First update
        vm.prank(OWNER);
        bytes32 requestId1 = gdpOracle.requestGDPUpdate();
        vm.prank(ORACLE_ADDRESS);
        gdpOracle.fulfill(requestId1, 2_500_000_000_000_000_000, 1, 2024);

        // Store first update timestamp
        uint256 firstUpdateTime = gdpOracle.lastUpdateTimestamp();

        // Advance block timestamp
        vm.warp(block.timestamp + 1 hours);

        // Second update
        vm.prank(OWNER);
        bytes32 requestId2 = gdpOracle.requestGDPUpdate();
        vm.prank(ORACLE_ADDRESS);
        gdpOracle.fulfill(requestId2, 3_100_000_000_000_000_000, 2, 2024);

        // Verify latest data is from second update
        assertEq(gdpOracle.latestQuarter(), 2, "Quarter not updated");
        assertEq(
            gdpOracle.latestGrowthRate(),
            3_100_000_000_000_000_000,
            "Growth rate not updated"
        );
        assertGt(
            gdpOracle.lastUpdateTimestamp(),
            firstUpdateTime,
            "Timestamp not updated"
        );
    }

    function test_EventEmissionOrder() public {
        // Start recording logs
        vm.recordLogs();

        // Create and fulfill request
        vm.prank(OWNER);
        bytes32 requestId = gdpOracle.requestGDPUpdate();

        int256 growthRate = 2_500_000_000_000_000_000;
        uint8 quarter = 1;
        uint16 year = 2024;

        vm.prank(ORACLE_ADDRESS);
        gdpOracle.fulfill(requestId, growthRate, quarter, year);

        // Get recorded logs
        Vm.Log[] memory entries = vm.getRecordedLogs();

        // Verify we have the expected events
        assertGt(entries.length, 0, "No events emitted");

        // The last event should be our GDPDataUpdated event
        Vm.Log memory lastEvent = entries[entries.length - 1];

        // Verify event topic (event signature)
        bytes32 expectedTopic = keccak256(
            "GDPDataUpdated(uint256,int256,uint8,uint16)"
        );
        assertEq(
            lastEvent.topics[0],
            expectedTopic,
            "Unexpected event signature"
        );
    }
}
