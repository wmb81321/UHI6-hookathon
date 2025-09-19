// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CompliantLPHook
 * @notice A simple Uniswap v4 hook that enforces ComplianceNFT ownership for swaps and liquidity provision
 * @dev Self-contained implementation without external v4 dependencies
 */

// ========== INTERFACES ==========

interface IComplianceCheck {
    function isCompliant(address account) external view returns (bool);
}

interface IPoolManager {
    struct ModifyLiquidityParams {
        int24 tickLower;
        int24 tickUpper;
        int256 liquidityDelta;
        bytes32 salt;
    }

    struct SwapParams {
        bool zeroForOne;
        int256 amountSpecified;
        uint160 sqrtPriceLimitX96;
    }
}

// ========== TYPES ==========

type Currency is address;

struct PoolKey {
    Currency currency0;
    Currency currency1;
    uint24 fee;
    int24 tickSpacing;
    address hooks;
}

// ========== HOOK CONTRACT ==========

contract CompliantLPHook {
    // Custom errors
    error NotCompliant();
    error InvalidComplianceNFT();
    error NotPoolManager();

    // Immutable state
    address public immutable poolManager;
    IComplianceCheck public immutable complianceNFT;

    // Events for tracking compliance checks
    event ComplianceCheckPassed(address indexed user, string action);
    event ComplianceCheckFailed(address indexed user, string action);

    constructor(address _poolManager, address _complianceNFT) {
        if (_poolManager == address(0)) revert NotPoolManager();
        if (_complianceNFT == address(0)) revert InvalidComplianceNFT();
        
        poolManager = _poolManager;
        complianceNFT = IComplianceCheck(_complianceNFT);
    }

    modifier onlyPoolManager() {
        if (msg.sender != poolManager) revert NotPoolManager();
        _;
    }

    // ========== HOOK FUNCTIONS ==========

    /**
     * @dev Hook called before any swap - enforces compliance
     */
    function beforeSwap(
        address sender,
        PoolKey calldata key,
        IPoolManager.SwapParams calldata params,
        bytes calldata hookData
    ) external onlyPoolManager returns (bytes4) {
        // Check if the sender is compliant
        if (!complianceNFT.isCompliant(sender)) {
            emit ComplianceCheckFailed(sender, "Swap");
            revert NotCompliant();
        }

        emit ComplianceCheckPassed(sender, "Swap");
        return this.beforeSwap.selector;
    }

    /**
     * @dev Hook called before adding/removing liquidity - enforces compliance
     */
    function beforeModifyPosition(
        address sender,
        PoolKey calldata key,
        IPoolManager.ModifyLiquidityParams calldata params,
        bytes calldata hookData
    ) external onlyPoolManager returns (bytes4) {
        // Check if the sender is compliant
        if (!complianceNFT.isCompliant(sender)) {
            emit ComplianceCheckFailed(sender, "ModifyPosition");
            revert NotCompliant();
        }

        emit ComplianceCheckPassed(sender, "ModifyPosition");
        return this.beforeModifyPosition.selector;
    }

    // ========== PLACEHOLDER HOOKS (Required for Uniswap v4) ==========

    function beforeInitialize(
        address sender,
        PoolKey calldata key,
        uint160 sqrtPriceX96,
        bytes calldata hookData
    ) external view onlyPoolManager returns (bytes4) {
        return this.beforeInitialize.selector;
    }

    function afterInitialize(
        address sender,
        PoolKey calldata key,
        uint160 sqrtPriceX96,
        int24 tick,
        bytes calldata hookData
    ) external view onlyPoolManager returns (bytes4) {
        return this.afterInitialize.selector;
    }

    function afterModifyPosition(
        address sender,
        PoolKey calldata key,
        IPoolManager.ModifyLiquidityParams calldata params,
        bytes calldata hookData
    ) external view onlyPoolManager returns (bytes4) {
        return this.afterModifyPosition.selector;
    }

    function afterSwap(
        address sender,
        PoolKey calldata key,
        IPoolManager.SwapParams calldata params,
        bytes calldata hookData
    ) external view onlyPoolManager returns (bytes4) {
        return this.afterSwap.selector;
    }

    function beforeDonate(
        address sender,
        PoolKey calldata key,
        uint256 amount0,
        uint256 amount1,
        bytes calldata hookData
    ) external view onlyPoolManager returns (bytes4) {
        return this.beforeDonate.selector;
    }

    function afterDonate(
        address sender,
        PoolKey calldata key,
        uint256 amount0,
        uint256 amount1,
        bytes calldata hookData
    ) external view onlyPoolManager returns (bytes4) {
        return this.afterDonate.selector;
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
        return poolManager;
    }

    /**
     * @dev Get hook configuration info
     */
    function getHookInfo() external view returns (
        address poolManager_,
        address complianceNFT_,
        bool enforceCompliance_
    ) {
        return (poolManager, address(complianceNFT), true);
    }
}