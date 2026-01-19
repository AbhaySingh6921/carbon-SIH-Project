// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/dev/v1_X/FunctionsClient.sol";
import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/dev/v1_X/libraries/FunctionsRequest.sol";

/**
 * @title WeatherSurvival
 * @dev Fetches temperature from OpenWeatherMap via Chainlink Functions,
 * calculates a survival score, and stores it on-chain.
 */
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

// Interface to call your main Verification contract
interface IVerification {
    function submitAIScore(uint256 projectId, uint8 score) external;
    function flagProjectAsDisputed(uint256 projectId, uint8 score) external;
}

/**
 * @title WeatherSurvival
 * @dev Fetches temperature from OpenWeatherMap via Chainlink Functions,
 * calculates a survival score, and stores it on-chain.
 */
contract WeatherSurvival is FunctionsClient, ConfirmedOwner {
    using FunctionsRequest for FunctionsRequest.Request;
    using Strings for int256;
    using Strings for uint256;

    // --- Chainlink Functions Settings ---
    address public router = 0xb83E47C2bC239B3bf370bc41e1459A34b41238D0; // Sepolia Router
    bytes32 public donId = 0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000; // Sepolia DON ID
    uint64 public subscriptionId;
    uint32 public gasLimit = 300000;

    // --- Inline JS for Chainlink Functions ---
    // WARNING: This contains a hardcoded API key and is NOT secure for production.
    string public source =
        "const idealTemp = parseInt(args[0]);"
        "const sensitivity = parseInt(args[1]);"
        "const lat = args[2];"
        "const lon = args[3];"
        "const apiKey = '0fe068562bb1f319a7d5e76afa935dd1';"
        "if (!apiKey) { throw Error('API Key missing'); }"
        "const weatherResponse = await Functions.makeHttpRequest({"
        "  url: `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`"
        "});"
        "if (weatherResponse.error) { throw new Error('Weather API request failed'); }"
        "const temp = weatherResponse.data.main.temp;"
        "let score = 100 - (Math.abs(idealTemp - temp) * sensitivity);"
        "if (score < 0) score = 0;"
        "return Functions.encodeUint256(Math.round(score));";

    IVerification public verificationContract;

    // --- Configurable Scoring Parameters ---
    uint8 public scoreThreshold;
    int8 public idealTemperature;
    uint8 public scoreSensitivity;

    // --- Mappings & Events ---
    mapping(bytes32 => uint256) public requestIdToProjectId;
    mapping(uint256 => uint256) public projectToScore;
    event RequestSent(bytes32 indexed requestId, uint256 indexed projectId);
    event ScoreReceived(bytes32 indexed requestId, uint256 score, uint256 projectId);
    event ResponseError(bytes32 indexed requestId, bytes err);

    constructor(
        uint64 _subscriptionId,
        address _verificationContractAddress
    ) FunctionsClient(router) ConfirmedOwner(msg.sender) {
        subscriptionId = _subscriptionId;
        verificationContract = IVerification(_verificationContractAddress);
        // Set default values on deployment
        scoreThreshold = 70;
        idealTemperature = 25;
        scoreSensitivity = 2;
    }

    function intToString(int256 value) internal pure returns (string memory) {
    if (value >= 0) {
        return Strings.toString(uint256(value));
    } else {
        return string(abi.encodePacked("-", Strings.toString(uint256(-value))));
    }
}   

    // --- Core Functions ---
    function sendRequest(uint256 _projectId, string[] memory _args) external onlyOwner {
        FunctionsRequest.Request memory req;
        req._initializeRequestForInlineJavaScript(source);

        string[] memory fullArgs = new string[](4);
        fullArgs[0] = intToString(idealTemperature);
        fullArgs[1] = uint256(scoreSensitivity).toString();
        fullArgs[2] = _args[0]; // lat
        fullArgs[3] = _args[1]; // lon
        req._setArgs(fullArgs);

        bytes32 requestId = _sendRequest(req._encodeCBOR(), subscriptionId, gasLimit, donId);
        requestIdToProjectId[requestId] = _projectId;
        emit RequestSent(requestId, _projectId);
    }

    function _fulfillRequest(bytes32 requestId, bytes memory response, bytes memory err) internal override {
        if (err.length > 0) {
            emit ResponseError(requestId, err);
            return;
        }
        uint256 projectId = requestIdToProjectId[requestId];
        uint256 score = abi.decode(response, (uint256));
        projectToScore[projectId] = score;
        emit ScoreReceived(requestId, score, projectId);

        // "Intelligent Assistant" logic:
        if (score >= scoreThreshold) {
            verificationContract.submitAIScore(projectId, uint8(score));
        } else {
            verificationContract.flagProjectAsDisputed(projectId, uint8(score));
        }
    }

    // --- Configuration Functions ---
    function setScoreThreshold(uint8 _newThreshold) external onlyOwner {
        require(_newThreshold <= 100, "Threshold cannot be > 100");
        scoreThreshold = _newThreshold;
    }

    function setIdealTemperature(int8 _newTemp) external onlyOwner {
        idealTemperature = _newTemp;
    }

    function setScoreSensitivity(uint8 _newSensitivity) external onlyOwner {
        require(_newSensitivity > 0, "Sensitivity must be > 0");
        scoreSensitivity = _newSensitivity;
    }

    function getProjectScore(uint256 projectId) external view returns (uint256) {
        return projectToScore[projectId];
    }
    // --- Gas Limit Management ---
function getGasLimit() public view returns (uint32) {
    return gasLimit;
}

function setGasLimit(uint32 _newGasLimit) external onlyOwner {
    require(_newGasLimit > 0, "Gas limit must be positive");
    gasLimit = _newGasLimit;
}

}


