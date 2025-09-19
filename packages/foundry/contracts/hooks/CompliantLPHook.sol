// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseHook} from "v4-periphery/src/utils/BaseHook.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary} from "@uniswap/v4-core/src/types/BeforeSwapDelta.sol";
import {ModifyLiquidityParams, SwapParams} from "@uniswap/v4-core/src/types/PoolOperation.sol";

/**
 * @title CompliantLPHook
 * @notice A proper Uniswap v4 BaseHook that enforces ComplianceNFT ownership
 * @dev Inherits from BaseHook with correct interface implementation
 */

interface IComplianceCheck {
    function isCompliant(address account) external view returns (bool);
}

contract CompliantLPHook is BaseHook {
    using PoolIdLibrary for PoolKey;

    // Custom errors
    error NotCompliant();
    error InvalidComplianceNFT();

    // State variables
    IComplianceCheck public immutable complianceNFT;

    // Events for tracking compliance checks
    event ComplianceCheckPassed(address indexed user, string action);
    event ComplianceCheckFailed(address indexed user, string action);

    /**
     * @notice Constructor
     * @param _poolManager Address of the Uniswap v4 PoolManager
     * @param _complianceNFT Address of the ComplianceNFT contract
     */
    constructor(IPoolManager _poolManager, address _complianceNFT) BaseHook(_poolManager) {
        if (_complianceNFT == address(0)) revert InvalidComplianceNFT();
        complianceNFT = IComplianceCheck(_complianceNFT);
    }

    /**
     * @notice Returns the hook permissions
     * @return Hooks.Permissions struct indicating which hooks are enabled
     */
    function getHookPermissions() public pure override returns (Hooks.Permissions memory) {
        return Hooks.Permissions({
            beforeInitialize: false,
            afterInitialize: false,
            beforeAddLiquidity: true,
            afterAddLiquidity: false,
            beforeRemoveLiquidity: true,
            afterRemoveLiquidity: false,
            beforeSwap: true,
            afterSwap: false,
            beforeDonate: false,
            afterDonate: false,
            beforeSwapReturnDelta: false,
            afterSwapReturnDelta: false,
            afterAddLiquidityReturnDelta: false,
            afterRemoveLiquidityReturnDelta: false
        });
    }

    // ========== HOOK IMPLEMENTATIONS ==========

    /**
     * @dev Hook called before any swap - enforces compliance
     */
    function _beforeSwap(
        address sender,
        PoolKey calldata key,
        SwapParams calldata params,
        bytes calldata hookData
    ) internal override returns (bytes4, BeforeSwapDelta, uint24) {
        // Extract the actual user from hookData if provided
        address user = sender;
        if (hookData.length >= 20) {
            user = abi.decode(hookData, (address));
        }

        // Check if the user is compliant
        if (!complianceNFT.isCompliant(user)) {
            emit ComplianceCheckFailed(user, "Swap");
            revert NotCompliant();
        }

        emit ComplianceCheckPassed(user, "Swap");
        return (BaseHook.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, 0);
    }

    /**
     * @dev Hook called before adding liquidity - enforces compliance
     */
    function _beforeAddLiquidity(
        address sender,
        PoolKey calldata key,
        ModifyLiquidityParams calldata params,
        bytes calldata hookData
    ) internal override returns (bytes4) {
        // Extract the actual user from hookData if provided
        address user = sender;
        if (hookData.length >= 20) {
            user = abi.decode(hookData, (address));
        }

        // Check if the user is compliant
        if (!complianceNFT.isCompliant(user)) {
            emit ComplianceCheckFailed(user, "AddLiquidity");
            revert NotCompliant();
        }

        emit ComplianceCheckPassed(user, "AddLiquidity");
        return BaseHook.beforeAddLiquidity.selector;
    }

    /**
     * @dev Hook called before removing liquidity - enforces compliance
     */
    function _beforeRemoveLiquidity(
        address sender,
        PoolKey calldata key,
        ModifyLiquidityParams calldata params,
        bytes calldata hookData
    ) internal override returns (bytes4) {
        // Extract the actual user from hookData if provided
        address user = sender;
        if (hookData.length >= 20) {
            user = abi.decode(hookData, (address));
        }

        // Check if the user is compliant
        if (!complianceNFT.isCompliant(user)) {
            emit ComplianceCheckFailed(user, "RemoveLiquidity");
            revert NotCompliant();
        }

        emit ComplianceCheckPassed(user, "RemoveLiquidity");
        return BaseHook.beforeRemoveLiquidity.selector;
    }

    // ========== VIEW FUNCTIONS ==========

    /**
     * @dev Utility function to check if an address is compliant
     */
    function isAddressCompliant(address account) external view returns (bool) {
        return complianceNFT.isCompliant(account);
    }

    /**
     * @dev Get the ComplianceNFT address used by this hook
     */
    function getComplianceNFT() external view returns (address) {
        return address(complianceNFT);
    }

    /**
     * @dev Get the PoolManager address
     */
    function getPoolManager() external view returns (address) {
        return address(poolManager);
    }

    /**
     * @dev Get hook configuration info
     */
    function getHookInfo() external view returns (
        address poolManager_,
        address complianceNFT_,
        bool enforceCompliance_
    ) {
        return (address(poolManager), address(complianceNFT), true);
    }
}