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

interface IComplianceNFT {
    function isCompliant(address account) external view returns (bool);
    function validUntil(address account) external view returns (uint256);
}

/**
 * @dev Soulbound behavior is enforced by reverting on ALL transfer/approval ops.
 * Each account can hold at most one token. Admin (owner) can mint, renew, revoke.
 */
contract ComplianceNFT is ERC721, Ownable, IComplianceNFT {
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

    function isCompliant(address account) external view override returns (bool) {
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
}