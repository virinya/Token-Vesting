// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @dev This contract was designed to distributed token to shareholders, the fixed amount of token could be claimed monthy.
 * Has function to record shareholders information.
 * Has function to calculate shareholder's claim limit per month.
 * Has function for shareholders to claim token.
 */

contract TokenVesting is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Shareholder {
        uint256 tokenAmount;
        uint256 claimedAmount;
        uint256 startDate;
    }
    mapping(address => Shareholder) public shareholder;
    IERC20 public immutable token;
    address public immutable junTokenAddress;
    uint256 public immutable distributionPercent;
    uint256 public immutable timeInterval;

    constructor(
        address _junTokenAddress,
        uint256 _distributionPercent,
        uint256 _timeInterval
    ) {
        token = IERC20(_junTokenAddress);
        junTokenAddress = _junTokenAddress;
        distributionPercent = _distributionPercent;
        timeInterval = _timeInterval;
    }

    /**
     * @dev Function for record shareholder information.
     * Owner can use to increase pool reward in contract.
     * @param _shareholderAddress - an address of a shareholder.
     * @param _tokenAmount - the total amount of distributed reward of a shareholder.
     */
    function recordShareholderInfo(address _shareholderAddress, uint256 _tokenAmount) public onlyOwner {
        shareholder[_shareholderAddress].tokenAmount = _tokenAmount;
        shareholder[_shareholderAddress].startDate = block.timestamp;
        token.safeTransferFrom(msg.sender, address(this), _tokenAmount);
    } 


    /**
     * @dev Function for calculating shareholder's claim limit.
     * @param _shareholderAddress - an address of a shareholder
     */
    function calculateClaimLimit(address _shareholderAddress) public view returns(uint256) {
        uint256 timePassed;
        uint256 intervalPassed;
        uint256 claimLimit;
        timePassed = block.timestamp - shareholder[_shareholderAddress].startDate;
        intervalPassed = timePassed / timeInterval;
        claimLimit = (shareholder[_shareholderAddress].tokenAmount * distributionPercent/100) * intervalPassed;

        return claimLimit;
    }

     /**
     * @dev Function for shareholder to claim token and update claimed amount.
     * @param _claimAmount - token amount to be claimed.
     */
    function claimToken(uint256 _claimAmount) public {
        uint256 claimLimit = calculateClaimLimit(msg.sender);
        uint256 totalClaimLimit = claimLimit - shareholder[msg.sender].claimedAmount;
        require(
            shareholder[msg.sender].claimedAmount < shareholder[msg.sender].tokenAmount,
            "[TokenVesting.claimToken] all token claimed"
        );
        require(
            _claimAmount <= totalClaimLimit,
            "[TokenVesting.claimToken] claim amount exceed claim limit"
        );
        token.safeTransfer(msg.sender, _claimAmount);
        shareholder[msg.sender].claimedAmount += _claimAmount;
    }
}