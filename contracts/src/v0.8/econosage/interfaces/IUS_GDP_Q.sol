// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {DataTypes} from "../libraries/DataTypes.sol";

/**
 * @title IUS_GDP_Q
 * @dev Interface for the US GDP Quarterly Growth Rate Oracle
 */
interface IUS_GDP_Q {
    /**
     * @dev Emitted when new GDP growth rate data is received and stored
     */
    event GDPDataUpdated(
        uint256 indexed timestamp,
        int256 growthRate,
        uint8 quarter,
        uint16 year
    );

    /**
     * @dev Emitted when metadata is updated
     */
    event MetadataUpdated(
        uint256 timestamp,
        string source,
        string frequency,
        string description
    );

    /**
     * @dev Returns the latest GDP growth rate data point
     */
    function getLatestGDPData()
        external
        view
        returns (DataTypes.GDPDataPoint memory);

    /**
     * @dev Returns GDP growth rate data for a specific year and quarter
     */
    function getGDPData(
        uint16 year,
        uint8 quarter
    ) external view returns (DataTypes.GDPDataPoint memory);

    /**
     * @dev Returns GDP growth rate data points within a time range
     * @param fromTimestamp Start timestamp (inclusive)
     * @param toTimestamp End timestamp (inclusive)
     */
    function getGDPDataRange(
        uint256 fromTimestamp,
        uint256 toTimestamp
    ) external view returns (DataTypes.GDPDataPoint[] memory);

    /**
     * @dev Returns the dataset metadata
     */
    function getMetadata()
        external
        view
        returns (DataTypes.DatasetMetadata memory);

    /**
     * @dev Requests an update for the latest GDP growth rate data from Chainlink oracle
     * Can only be called by authorized addresses
     */
    function requestGDPUpdate() external returns (bytes32 requestId);

    /**
     * @dev Returns true if the contract is paused, and false otherwise
     */
    function paused() external view returns (bool);
}
