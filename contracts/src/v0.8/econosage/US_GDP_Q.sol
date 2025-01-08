// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ChainlinkClient} from "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import {Chainlink} from "@chainlink/contracts/src/v0.8/Chainlink.sol";
import {LinkTokenInterface} from "@chainlink/contracts/src/v0.8/shared/interfaces/LinkTokenInterface.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title US_GDP_Q
 * @dev Minimal implementation of US GDP Quarterly Growth Rate Oracle
 */
contract US_GDP_Q is ChainlinkClient, Ownable {
    using Chainlink for Chainlink.Request;

    // State variables
    uint256 private constant ORACLE_PAYMENT = 0.1 * 10 ** 18; // 0.1 LINK
    bytes32 private jobId;
    address private oracle;

    // Latest GDP data
    int256 public latestGrowthRate;
    uint8 public latestQuarter;
    uint16 public latestYear;
    uint256 public lastUpdateTimestamp;

    // Events
    event GDPDataUpdated(
        uint256 indexed timestamp,
        int256 growthRate,
        uint8 quarter,
        uint16 year
    );

    /**
     * @dev Constructor sets initial values
     * @param _link Address of the LINK token
     * @param _oracle Address of the Chainlink oracle
     * @param _jobId Job ID for the oracle request
     */
    constructor(
        address _link,
        address _oracle,
        bytes32 _jobId
    ) Ownable(msg.sender) {
        _setChainlinkToken(_link);
        _setChainlinkOracle(_oracle);
        oracle = _oracle;
        jobId = _jobId;
    }

    /**
     * @dev Requests GDP data update from Chainlink oracle
     */
    function requestGDPUpdate() external onlyOwner returns (bytes32) {
        Chainlink.Request memory req = _buildChainlinkRequest(
            jobId,
            address(this),
            this.fulfill.selector
        );

        // Set the URL to fetch data from FRED API
        Chainlink._add(
            req,
            "get",
            "https://api.stlouisfed.org/fred/series/observations"
        );
        Chainlink._add(req, "path", "value"); // Path to growth rate in the response

        return _sendChainlinkRequestTo(oracle, req, ORACLE_PAYMENT);
    }

    /**
     * @dev Callback function for Chainlink oracle response
     */
    function fulfill(
        bytes32 _requestId,
        int256 _growthRate,
        uint8 _quarter,
        uint16 _year
    ) external recordChainlinkFulfillment(_requestId) {
        require(_quarter >= 1 && _quarter <= 4, "Invalid quarter");

        latestGrowthRate = _growthRate;
        latestQuarter = _quarter;
        latestYear = _year;
        lastUpdateTimestamp = block.timestamp;

        emit GDPDataUpdated(block.timestamp, _growthRate, _quarter, _year);
    }

    /**
     * @dev Updates the oracle address
     */
    function updateOracle(address _oracle) external onlyOwner {
        require(_oracle != address(0), "Invalid oracle address");
        _setChainlinkOracle(_oracle);
        oracle = _oracle;
    }

    /**
     * @dev Updates the job ID
     */
    function updateJobId(bytes32 _jobId) external onlyOwner {
        require(_jobId != bytes32(0), "Invalid job ID");
        jobId = _jobId;
    }

    /**
     * @dev Allows withdrawal of LINK tokens from the contract
     */
    function withdrawLink() external onlyOwner {
        LinkTokenInterface link = LinkTokenInterface(_chainlinkTokenAddress());
        require(
            link.transfer(msg.sender, link.balanceOf(address(this))),
            "Unable to transfer"
        );
    }
}
