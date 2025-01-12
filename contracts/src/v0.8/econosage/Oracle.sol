// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {LinkTokenInterface} from "../../../lib/chainlink/contracts/src/v0.8/shared/interfaces/LinkTokenInterface.sol";
import {OracleInterface} from "../../../lib/chainlink/contracts/src/v0.8/interfaces/OracleInterface.sol";
import {ChainlinkRequestInterface} from "../../../lib/chainlink/contracts/src/v0.8/interfaces/ChainlinkRequestInterface.sol";
import {Ownable} from "../../../lib/openzeppelin-contracts/contracts/access/Ownable.sol";

/**
 * @title Oracle
 * @dev Oracle contract for handling Chainlink requests
 */
contract Oracle is ChainlinkRequestInterface, OracleInterface, Ownable {
    uint256 public constant EXPIRY_TIME = 5 minutes;
    uint256 private constant MINIMUM_CONSUMER_GAS_LIMIT = 400000;

    struct Callback {
        bytes32 externalId;
        uint256 payment;
        address callbackAddress;
        bytes4 callbackFunctionId;
        uint256 expiration;
    }

    LinkTokenInterface internal immutable LINK;
    mapping(bytes32 => Callback) private callbacks;
    mapping(address => bool) private authorizedNodes;

    // Custom errors
    error MustUseLinkToken();
    error UnableToCreateRequest();
    error MustUseUniqueId();
    error MustHaveValidRequestId();
    error PaymentAmountMismatch();
    error CallbackAddressMismatch();
    error CallbackFunctionIdMismatch();
    error ExpirationMismatch();
    error RequestNotExpired();
    error InsufficientConsumerGas();
    error CannotCallbackToLink();
    error NotAuthorizedNode();

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

    /**
     * @notice Deploy with the address of the LINK token
     * @dev Sets the LinkToken address for the imported LinkTokenInterface
     * @param link The address of the LINK token
     */
    constructor(address link) Ownable(msg.sender) {
        LINK = LinkTokenInterface(link);
    }

    /**
     * @notice Called when LINK is sent to the contract via `transferAndCall`
     * @dev The data payload must begin with the function selector of `oracleRequest`
     * @param sender Address of the sender
     * @param amount Amount of LINK sent (specified in wei)
     * @param data The data payload of the request
     */
    function onTokenTransfer(
        address sender,
        uint256 amount,
        bytes memory data
    ) external {
        if (msg.sender != address(LINK)) revert MustUseLinkToken();

        // Call oracleRequest with the data
        bytes memory callData = abi.encodeWithSelector(
            this.oracleRequest.selector,
            sender,
            amount,
            abi.decode(data, (bytes32)), // specId
            sender, // callbackAddress
            bytes4(keccak256("callback(bytes32,uint256)")), // callbackFunctionId
            uint256(keccak256(abi.encodePacked(block.timestamp, sender))), // nonce
            1, // dataVersion
            "" // requestData
        );

        // Call oracleRequest with the modified data
        (bool success, ) = address(this).delegatecall(callData);
        if (!success) revert UnableToCreateRequest();
    }

    /**
     * @notice Creates the Chainlink request
     * @dev Stores the hash of the params as the on-chain commitment for the request.
     * Emits OracleRequest event for the Chainlink node to detect.
     * @param sender The sender of the request
     * @param payment The amount of payment given (specified in wei)
     * @param specId The Job Specification ID
     * @param callbackAddress The callback address for the response
     * @param callbackFunctionId The callback function ID for the response
     * @param nonce The nonce sent by the requester
     * @param dataVersion The specified data version
     * @param data The CBOR payload of the request
     */
    function oracleRequest(
        address sender,
        uint256 payment,
        bytes32 specId,
        address callbackAddress,
        bytes4 callbackFunctionId,
        uint256 nonce,
        uint256 dataVersion,
        bytes calldata data
    ) external override onlyLINK checkCallbackAddress(callbackAddress) {
        bytes32 requestId = keccak256(abi.encodePacked(sender, nonce));
        if (callbacks[requestId].callbackAddress != address(0))
            revert MustUseUniqueId();

        callbacks[requestId] = Callback(
            specId,
            payment,
            callbackAddress,
            callbackFunctionId,
            block.timestamp + EXPIRY_TIME
        );

        emit OracleRequest(
            specId,
            sender,
            requestId,
            payment,
            callbackAddress,
            callbackFunctionId,
            block.timestamp + EXPIRY_TIME,
            dataVersion,
            data
        );
    }

    /**
     * @notice Called by the Chainlink node to fulfill requests
     * @dev Given params must hash back to the commitment stored from `oracleRequest`.
     * Will call the callback address' callback function without bubbling up error
     * checking in a `require` so that the node can get paid.
     * @param requestId The fulfillment request ID that must match the requester's
     * @param payment The payment amount that will be released for the oracle (specified in wei)
     * @param callbackAddress The callback address to call for fulfillment
     * @param callbackFunctionId The callback function ID to use for fulfillment
     * @param expiration The expiration that the node should respond by before the requester can cancel
     * @param data The data to return to the consuming contract
     * @return Status if the external call was successful
     */
    function fulfillOracleRequest(
        bytes32 requestId,
        uint256 payment,
        address callbackAddress,
        bytes4 callbackFunctionId,
        uint256 expiration,
        bytes32 data
    ) external override isAuthorizedNode returns (bool) {
        Callback memory callback = callbacks[requestId];
        if (callback.callbackAddress == address(0))
            revert MustHaveValidRequestId();
        if (callback.payment != payment) revert PaymentAmountMismatch();
        if (callback.callbackAddress != callbackAddress)
            revert CallbackAddressMismatch();
        if (callback.callbackFunctionId != callbackFunctionId)
            revert CallbackFunctionIdMismatch();
        if (callback.expiration != expiration) revert ExpirationMismatch();

        delete callbacks[requestId];

        if (gasleft() < MINIMUM_CONSUMER_GAS_LIMIT)
            revert InsufficientConsumerGas();

        // All updates to the oracle's fulfillment should come before calling the callback
        // to avoid reentrancy attacks
        (bool success, ) = callbackAddress.call(
            abi.encodeWithSelector(callbackFunctionId, requestId, data)
        ); // solhint-disable-line avoid-low-level-calls
        return success;
    }

    /**
     * @notice Allows requesters to cancel requests which are expired
     * @param requestId The request ID
     * @param payment The amount of payment given (specified in wei)
     * @param callbackFunc The requester's callback address's function ID
     * @param expiration The time of the expiration for the request
     */
    function cancelOracleRequest(
        bytes32 requestId,
        uint256 payment,
        bytes4 callbackFunc,
        uint256 expiration
    ) external override {
        if (callbacks[requestId].callbackAddress == address(0))
            revert MustHaveValidRequestId();
        if (callbacks[requestId].payment != payment)
            revert PaymentAmountMismatch();
        if (callbacks[requestId].callbackFunctionId != callbackFunc)
            revert CallbackFunctionIdMismatch();
        if (callbacks[requestId].expiration != expiration)
            revert ExpirationMismatch();
        if (block.timestamp <= expiration) revert RequestNotExpired();

        delete callbacks[requestId];
        LINK.transfer(msg.sender, payment);

        emit CancelOracleRequest(requestId);
    }

    /**
     * @notice Returns the address of the LINK token
     * @dev This is the public implementation for chainlinkTokenAddress, which is
     * an internal method of the ChainlinkClient contract
     */
    function getChainlinkToken() public view returns (address) {
        return address(LINK);
    }

    /**
     * @notice Allows the node operator to withdraw earned LINK to a given address
     * @dev The owner of the contract can be another wallet and does not have to be a Chainlink node
     * @param recipient The address to send the LINK token to
     * @param amount The amount to send (specified in wei)
     */
    function withdraw(
        address recipient,
        uint256 amount
    ) external override onlyOwner {
        LINK.transfer(recipient, amount);
    }

    /**
     * @notice Displays the amount of LINK that is available for the node operator to withdraw
     * @dev We use `this.balance` instead of `linkToken.balanceOf(address(this))` for accurate gas estimation
     */
    function withdrawable() external view override returns (uint256) {
        return LINK.balanceOf(address(this));
    }

    /**
     * @notice Allows the node operator to set permissions for a set of nodes
     * @param node The address of the Chainlink node
     * @param allowed Bool value to determine if the node can fulfill requests
     */
    function setFulfillmentPermission(
        address node,
        bool allowed
    ) external onlyOwner {
        authorizedNodes[node] = allowed;
    }

    /**
     * @notice Checks if the node is authorized to fulfill requests
     * @param node The address of the Chainlink node
     */
    function getAuthorizationStatus(address node) external view returns (bool) {
        return authorizedNodes[node];
    }

    /**
     * @dev Reverts if the sender is not the LINK token
     */
    modifier onlyLINK() {
        if (msg.sender != address(LINK)) revert MustUseLinkToken();
        _;
    }

    /**
     * @dev Reverts if the sender is not an authorized Chainlink node
     */
    modifier isAuthorizedNode() {
        if (!authorizedNodes[msg.sender]) revert NotAuthorizedNode();
        _;
    }

    /**
     * @dev Reverts if the callback address is the LINK token
     */
    modifier checkCallbackAddress(address callbackAddress) {
        if (callbackAddress == address(LINK)) revert CannotCallbackToLink();
        _;
    }
}
