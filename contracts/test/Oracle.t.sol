// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {Oracle} from "../src/v0.8/econosage/Oracle.sol";
import {MockLinkToken} from "chainlink/contracts/src/v0.8/mocks/MockLinkToken.sol";

contract OracleTest is Test {
    Oracle public oracle;
    MockLinkToken public linkToken;

    // Test addresses
    address public constant OWNER = address(1);
    address public constant NODE_ADDRESS = address(2);
    address public constant REQUESTER = address(3);

    // Test values
    bytes32 public constant SPEC_ID = "6b88e0402e5d415eb946e528b8e0c7ba";
    uint256 public constant PAYMENT = 1 * 10 ** 18; // 1 LINK

    // Events to test
    event OracleRequest(
        bytes32 indexed specId,
        address requester,
        bytes32 requestId,
        uint256 payment,
        address callbackAddr,
        bytes4 callbackFunctionId,
        uint256 cancelExpiration,
        uint256 dataVersion,
        bytes data
    );

    event CancelOracleRequest(bytes32 indexed requestId);

    function setUp() public {
        // Deploy mock LINK token
        linkToken = new MockLinkToken();

        // Deploy Oracle contract
        vm.prank(OWNER);
        oracle = new Oracle(address(linkToken));

        // Fund the oracle contract with LINK tokens
        deal(address(linkToken), address(oracle), 10 * 10 ** 18); // 10 LINK
    }

    function test_InitialState() public view {
        assertEq(oracle.owner(), OWNER);
    }

    function test_SetFulfillmentPermission() public {
        // Only owner can set fulfillment permission
        vm.prank(OWNER);
        oracle.setFulfillmentPermission(NODE_ADDRESS, true);

        assertTrue(oracle.getAuthorizationStatus(NODE_ADDRESS));

        // Revoke permission
        vm.prank(OWNER);
        oracle.setFulfillmentPermission(NODE_ADDRESS, false);

        assertFalse(oracle.getAuthorizationStatus(NODE_ADDRESS));
    }

    function test_SetFulfillmentPermission_OnlyOwner() public {
        // Should revert when called by non-owner
        vm.prank(NODE_ADDRESS);
        vm.expectRevert(
            abi.encodeWithSignature(
                "OwnableUnauthorizedAccount(address)",
                NODE_ADDRESS
            )
        );
        oracle.setFulfillmentPermission(NODE_ADDRESS, true);
    }

    function test_OnTokenTransfer() public {
        bytes memory data = abi.encode(
            SPEC_ID,
            REQUESTER,
            bytes4(keccak256("callback(bytes32,uint256)")),
            block.timestamp + 5 minutes,
            0x0
        );

        vm.prank(address(linkToken));
        oracle.onTokenTransfer(REQUESTER, PAYMENT, data);
    }

    function test_OnTokenTransfer_OnlyLink() public {
        bytes memory data = abi.encodeWithSelector(
            oracle.oracleRequest.selector,
            SPEC_ID,
            REQUESTER,
            bytes4(keccak256("callback(bytes32,uint256)")),
            0,
            0x0
        );

        vm.prank(REQUESTER);
        vm.expectRevert(abi.encodeWithSignature("MustUseLinkToken()"));
        oracle.onTokenTransfer(REQUESTER, PAYMENT, data);
    }

    function test_FulfillOracleRequest() public {
        // Set up the oracle request
        bytes memory data = abi.encode(
            SPEC_ID,
            REQUESTER,
            bytes4(keccak256("callback(bytes32,uint256)")),
            block.timestamp + 5 minutes,
            0x0
        );

        vm.prank(address(linkToken));
        oracle.onTokenTransfer(REQUESTER, PAYMENT, data);

        // Authorize node
        vm.prank(OWNER);
        oracle.setFulfillmentPermission(NODE_ADDRESS, true);

        // Get the request ID
        bytes32 requestId = keccak256(
            abi.encodePacked(
                REQUESTER,
                uint256(keccak256(abi.encodePacked(block.timestamp, REQUESTER)))
            )
        );

        // Fulfill the request
        vm.prank(NODE_ADDRESS);
        oracle.fulfillOracleRequest(
            requestId,
            PAYMENT,
            REQUESTER,
            bytes4(keccak256("callback(bytes32,uint256)")),
            block.timestamp + 5 minutes,
            bytes32(bytes.concat(bytes32(uint256(1))))
        );
    }

    function test_FulfillOracleRequest_OnlyAuthorized() public {
        bytes32 requestId = keccak256(abi.encodePacked(SPEC_ID, REQUESTER));

        vm.prank(NODE_ADDRESS);
        vm.expectRevert(abi.encodeWithSignature("NotAuthorizedNode()"));
        oracle.fulfillOracleRequest(
            requestId,
            PAYMENT,
            REQUESTER,
            bytes4(keccak256("callback(bytes32,uint256)")),
            block.timestamp,
            bytes32(bytes.concat(bytes32(uint256(1))))
        );
    }

    function test_CancelOracleRequest() public {
        uint256 expiration = block.timestamp + 5 minutes;

        // Set up the oracle request
        bytes memory data = abi.encode(
            SPEC_ID,
            REQUESTER,
            bytes4(keccak256("callback(bytes32,uint256)")),
            expiration,
            0x0
        );

        vm.prank(address(linkToken));
        oracle.onTokenTransfer(REQUESTER, PAYMENT, data);

        // Get the request ID
        bytes32 requestId = keccak256(
            abi.encodePacked(
                REQUESTER,
                uint256(keccak256(abi.encodePacked(block.timestamp, REQUESTER)))
            )
        );

        // Wait for expiration
        vm.warp(block.timestamp + 6 minutes);

        // Cancel the request
        vm.prank(REQUESTER);
        oracle.cancelOracleRequest(
            requestId,
            PAYMENT,
            bytes4(keccak256("callback(bytes32,uint256)")),
            expiration
        );
    }

    function test_CancelOracleRequest_BeforeExpiration() public {
        // Set up the oracle request
        bytes memory data = abi.encode(
            SPEC_ID,
            REQUESTER,
            bytes4(keccak256("callback(bytes32,uint256)")),
            block.timestamp + 5 minutes,
            0x0
        );

        vm.prank(address(linkToken));
        oracle.onTokenTransfer(REQUESTER, PAYMENT, data);

        // Get the request ID
        bytes32 requestId = keccak256(
            abi.encodePacked(
                REQUESTER,
                uint256(keccak256(abi.encodePacked(block.timestamp, REQUESTER)))
            )
        );

        // Try to cancel before expiration
        vm.prank(REQUESTER);
        vm.expectRevert(abi.encodeWithSignature("RequestNotExpired()"));
        oracle.cancelOracleRequest(
            requestId,
            PAYMENT,
            bytes4(keccak256("callback(bytes32,uint256)")),
            block.timestamp + 5 minutes
        );
    }

    function test_Withdraw() public {
        uint256 initialBalance = linkToken.balanceOf(address(oracle));

        vm.prank(OWNER);
        oracle.withdraw(OWNER, initialBalance);

        assertEq(linkToken.balanceOf(address(oracle)), 0);
        assertEq(linkToken.balanceOf(OWNER), initialBalance);
    }

    function test_Withdraw_OnlyOwner() public {
        vm.prank(REQUESTER);
        vm.expectRevert(
            abi.encodeWithSignature(
                "OwnableUnauthorizedAccount(address)",
                REQUESTER
            )
        );
        oracle.withdraw(REQUESTER, 1 * 10 ** 18);
    }
}
