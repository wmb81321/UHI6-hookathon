// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ComplianceNFT (Soulbound, 1-year validity)
 * @notice Admin-minted after AML/CFT approval. Non-transferable (soulbound).
 *         Hook can call isCompliant(account) to gate LP or swap interactions.
 *
 * Dependencies (OpenZeppelin 5.x):
 * - @openzeppelin/contracts/token/ERC721/ERC721.sol
 * - @openzeppelin/contracts/access/Ownable.sol
 *
 * Recommended: pin exact OZ version in package.json/foundry.toml.
 */

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @dev Soulbound behavior is enforced by reverting on ALL transfer/approval ops.
 * Each account can hold at most one token. Admin (owner) can mint, renew, revoke.
 */
contract ComplianceNFT is ERC721, Ownable {
    /// @dev 1-year validity (365 days). Adjust if you need leap-year precision.
    uint256 public constant VALIDITY_PERIOD = 365 days;

    uint256 private _nextTokenId = 1;
    mapping(address => uint256) private _tokenOf;     // account => tokenId (0 if none)
    mapping(uint256 => uint256) private _expiry;      // tokenId => unix timestamp

    error AlreadyHasToken();
    error NoToken();
    error NotOwnerOfToken();
    error Soulbound();
    error InvalidAddress();

    event Minted(address indexed account, uint256 indexed tokenId, uint256 validUntil);
    event Renewed(address indexed account, uint256 indexed tokenId, uint256 newValidUntil);
    event Revoked(address indexed account, uint256 indexed tokenId);

    constructor(string memory name_, string memory symbol_)
        ERC721(name_, symbol_)
        Ownable(msg.sender) // OZ v5 style ctor; for OZ v4 use Ownable()
    {}

    // ---------- View helpers ----------

    function tokenOf(address account) public view returns (uint256) {
        return _tokenOf[account];
    }

    function validUntil(address account) public view returns (uint256) {
        uint256 tid = _tokenOf[account];
        return tid == 0 ? 0 : _expiry[tid];
    }

    function isCompliant(address account) external view returns (bool) {
        uint256 tid = _tokenOf[account];
        return (tid != 0 && block.timestamp < _expiry[tid]);
    }

    // ---------- Admin actions ----------

    /**
     * @notice Mint a soulbound token to `account` with 1-year validity.
     *         Reverts if account already holds a token.
     */
    function adminMint(address account) external onlyOwner {
        if (account == address(0)) revert InvalidAddress();
        if (_tokenOf[account] != 0) revert AlreadyHasToken();

        uint256 tid = _nextTokenId++;
        _safeMint(account, tid);

        _tokenOf[account] = tid;
        uint256 until_ = block.timestamp + VALIDITY_PERIOD;
        _expiry[tid] = until_;

        emit Minted(account, tid, until_);
    }

    /**
     * @notice Renew validity for holder's token by resetting the 1-year window from now.
     *         Useful after re-assessment passes.
     */
    function adminRenew(address account) external onlyOwner {
        uint256 tid = _tokenOf[account];
        if (tid == 0) revert NoToken();

        uint256 until_ = block.timestamp + VALIDITY_PERIOD;
        _expiry[tid] = until_;
        emit Renewed(account, tid, until_);
    }

    /**
     * @notice Revoke and burn holder's token.
     */
    function adminRevoke(address account) external onlyOwner {
        uint256 tid = _tokenOf[account];
        if (tid == 0) revert NoToken();

        delete _tokenOf[account];
        delete _expiry[tid];
        _burn(tid);
        emit Revoked(account, tid);
    }

    // ---------- Soulbound enforcement ----------

    // Block transfers
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        // Allow mint (from address(0)) and burn (to address(0)), block all other moves.
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) revert Soulbound();

        // If burning, clear reverse index
        if (to == address(0)) {
            // find previous owner for reverse index cleanup
            address prevOwner = ownerOf(tokenId);
            if (_tokenOf[prevOwner] == tokenId) {
                _tokenOf[prevOwner] = 0;
            }
        }
        return super._update(to, tokenId, auth);
    }

    // Block approvals entirely
    function approve(address, uint256) public pure override {
        revert Soulbound();
    }
    function setApprovalForAll(address, bool) public pure override {
        revert Soulbound();
    }

    // ---------- Admin view functions for frontend ----------

    /**
     * @notice Get contract information for admin panel
     * @return admin_ The admin/owner address
     * @return totalSupply_ Total number of NFTs minted
     * @return nextTokenId_ The next token ID to be minted
     * @return contractAddress_ This contract's address
     */
    function getContractInfo() external view returns (
        address admin_,
        uint256 totalSupply_,
        uint256 nextTokenId_,
        address contractAddress_
    ) {
        return (
            owner(),
            _nextTokenId - 1, // total minted so far
            _nextTokenId,
            address(this)
        );
    }

    /**
     * @notice Get detailed info about a specific account's NFT
     * @param account The account to check
     * @return hasNFT_ Whether the account has an NFT
     * @return tokenId_ The token ID (0 if none)
     * @return validUntil_ Expiry timestamp (0 if no NFT)
     * @return isCurrentlyCompliant_ Whether compliant right now
     * @return daysRemaining_ Days until expiry (0 if expired/no NFT)
     */
    function getAccountInfo(address account) external view returns (
        bool hasNFT_,
        uint256 tokenId_,
        uint256 validUntil_,
        bool isCurrentlyCompliant_,
        uint256 daysRemaining_
    ) {
        uint256 tid = _tokenOf[account];
        uint256 expiry = tid == 0 ? 0 : _expiry[tid];
        bool compliant = (tid != 0 && block.timestamp < expiry);
        
        uint256 daysLeft = 0;
        if (compliant && expiry > block.timestamp) {
            daysLeft = (expiry - block.timestamp) / 1 days;
        }

        return (
            tid != 0,           // hasNFT
            tid,                // tokenId
            expiry,             // validUntil
            compliant,          // isCurrentlyCompliant
            daysLeft            // daysRemaining
        );
    }

    /**
     * @notice Get all token holders (for admin panel)
     * @dev This is gas-intensive, use carefully. Better to track off-chain via events.
     * @return holders_ Array of addresses that currently hold tokens
     * @return tokenIds_ Array of corresponding token IDs
     * @return validUntils_ Array of corresponding expiry timestamps
     */
    function getAllHolders() external view returns (
        address[] memory holders_,
        uint256[] memory tokenIds_,
        uint256[] memory validUntils_
    ) {
        uint256 totalMinted = _nextTokenId - 1;
        uint256 currentHolders = 0;
        
        // First pass: count current holders
        for (uint256 i = 1; i <= totalMinted; i++) {
            if (_ownerOf(i) != address(0)) {
                currentHolders++;
            }
        }
        
        // Second pass: populate arrays
        holders_ = new address[](currentHolders);
        tokenIds_ = new uint256[](currentHolders);
        validUntils_ = new uint256[](currentHolders);
        
        uint256 index = 0;
        for (uint256 i = 1; i <= totalMinted; i++) {
            address holder = _ownerOf(i);
            if (holder != address(0)) {
                holders_[index] = holder;
                tokenIds_[index] = i;
                validUntils_[index] = _expiry[i];
                index++;
            }
        }
    }

    /**
     * @notice Check if an address is the admin
     * @param account Address to check
     * @return true if the account is the contract owner/admin
     */
    function isAdmin(address account) external view returns (bool) {
        return account == owner();
    }

    /**
     * @notice Get the admin address
     * @return The current admin/owner address
     */
    function getAdmin() external view returns (address) {
        return owner();
    }
}