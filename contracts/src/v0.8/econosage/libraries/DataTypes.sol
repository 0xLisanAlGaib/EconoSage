// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title DataTypes
 * @dev Library containing data structures for US GDP quarterly growth rate data
 */
library DataTypes {
    /**
     * @dev Struct for a single GDP growth rate data point
     * @param timestamp Unix timestamp of when the data was recorded
     * @param growthRate GDP percent change from previous quarter (with 18 decimals for precision)
     * @param quarter Calendar quarter (1-4)
     * @param year Calendar year
     */
    struct GDPDataPoint {
        uint256 timestamp; // Unix timestamp
        int256 growthRate; // GDP growth rate as percentage (with 18 decimals for precision)
        uint8 quarter; // 1-4
        uint16 year; // Calendar year
    }

    /**
     * @dev Struct for storing historical data with metadata
     * @param lastUpdated Timestamp of the last update
     * @param source Data source identifier (e.g., "FRED")
     * @param frequency Update frequency (e.g., "Quarterly")
     * @param dataPointsCount Number of historical data points stored
     * @param description Dataset description (e.g., "Real GDP Growth Rate, Quarterly, Seasonally Adjusted Annual Rate")
     */
    struct DatasetMetadata {
        uint256 lastUpdated;
        string source;
        string frequency;
        uint256 dataPointsCount;
        string description;
    }

    /**
     * @dev Error messages
     */
    string constant INVALID_QUARTER = "Quarter must be between 1 and 4";
    string constant INVALID_TIMESTAMP = "Invalid timestamp";
    string constant INVALID_RATE = "Invalid growth rate";
}
