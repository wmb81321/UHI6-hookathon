// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ComplianceNFT
 * @notice Soulbound NFT for compliance verification with 1-year validity
 * @dev Non-transferable ERC721 token with admin-controlled minting, renewal, and revocation
 */
contract ComplianceNFT is ERC721, Ownable {
    // Token validity duration (1 year)
    uint256 public constant VALIDITY_DURATION = 365 days;
    
    // Token counter
    uint256 private _nextTokenId = 1;
    
    // Mapping from token ID to expiry timestamp
    mapping(uint256 => uint256) public validUntil;
    
    // Mapping from address to token ID (for quick lookup)
    mapping(address => uint256) public tokenOf;
    
    // Events
    event NFTMinted(address indexed account, uint256 indexed tokenId, uint256 validUntil);
    event NFTRenewed(address indexed account, uint256 indexed tokenId, uint256 newValidUntil);
    event NFTRevoked(address indexed account, uint256 indexed tokenId);

    constructor(string memory name, string memory symbol) ERC721(name, symbol) Ownable(msg.sender) {}

    /**
     * @notice Mint a new compliance NFT to the specified account
     * @param account Address to receive the NFT
     * @dev Only callable by the contract owner (admin)
     */
    function adminMint(address account) external onlyOwner {
        require(account != address(0), "Cannot mint to zero address");
        require(tokenOf[account] == 0, "Account already has an NFT");
        
        uint256 tokenId = _nextTokenId++;
        uint256 expiryTime = block.timestamp + VALIDITY_DURATION;
        
        _mint(account, tokenId);
        validUntil[tokenId] = expiryTime;
        tokenOf[account] = tokenId;
        
        emit NFTMinted(account, tokenId, expiryTime);
    }

    /**
     * @notice Renew an existing compliance NFT for another year
     * @param account Address whose NFT should be renewed
     * @dev Only callable by the contract owner (admin)
     */
    function adminRenew(address account) external onlyOwner {
        require(account != address(0), "Cannot renew for zero address");
        uint256 tokenId = tokenOf[account];
        require(tokenId > 0, "Account does not have an NFT");
        require(_ownerOf(tokenId) == account, "Token not owned by account");
        
        uint256 newExpiryTime = block.timestamp + VALIDITY_DURATION;
        validUntil[tokenId] = newExpiryTime;
        
        emit NFTRenewed(account, tokenId, newExpiryTime);
    }

    /**
     * @notice Revoke a compliance NFT
     * @param account Address whose NFT should be revoked
     * @dev Only callable by the contract owner (admin)
     */
    function adminRevoke(address account) external onlyOwner {
        require(account != address(0), "Cannot revoke from zero address");
        uint256 tokenId = tokenOf[account];
        require(tokenId > 0, "Account does not have an NFT");
        require(_ownerOf(tokenId) == account, "Token not owned by account");
        
        _burn(tokenId);
        delete validUntil[tokenId];
        delete tokenOf[account];
        
        emit NFTRevoked(account, tokenId);
    }

    /**
     * @notice Check if an account is currently compliant
     * @param account Address to check
     * @return True if the account has a valid, non-expired NFT
     */
    function isCompliant(address account) external view returns (bool) {
        uint256 tokenId = tokenOf[account];
        if (tokenId == 0) return false;
        
        // Check if token still exists (not burned)
        if (_ownerOf(tokenId) != account) return false;
        
        // Check if token is not expired
        return block.timestamp <= validUntil[tokenId];
    }

    /**
     * @notice Get the valid until timestamp for an account's NFT
     * @param account Address to check
     * @return Timestamp when the NFT expires (0 if no NFT)
     */
    function getValidUntil(address account) external view returns (uint256) {
        uint256 tokenId = tokenOf[account];
        if (tokenId == 0) return 0;
        if (_ownerOf(tokenId) != account) return 0;
        return validUntil[tokenId];
    }

    /**
     * @notice Get contract information for admin panel
     * @return contractAddress The address of this contract
     * @return adminAddress The current admin/owner address
     * @return totalMinted Total number of NFTs minted
     * @return nextTokenId The next token ID to be minted
     */
    function getContractInfo() external view returns (
        address contractAddress,
        address adminAddress,
        uint256 totalMinted,
        uint256 nextTokenId
    ) {
        return (
            address(this),
            owner(),
            _nextTokenId - 1, // Total minted
            _nextTokenId
        );
    }

    /**
     * @notice Get account information
     * @param account Address to check
     * @return hasNFT Whether the account has an NFT
     * @return tokenId The token ID (0 if none)
     * @return expiryTimestamp When the NFT expires (0 if none)
     * @return isCurrentlyCompliant Whether the NFT is valid and not expired
     */
    function getAccountInfo(address account) external view returns (
        bool hasNFT,
        uint256 tokenId,
        uint256 expiryTimestamp,
        bool isCurrentlyCompliant
    ) {
        tokenId = tokenOf[account];
        hasNFT = tokenId > 0 && _ownerOf(tokenId) == account;
        expiryTimestamp = hasNFT ? validUntil[tokenId] : 0;
        isCurrentlyCompliant = hasNFT && block.timestamp <= expiryTimestamp;
        
        return (hasNFT, tokenId, expiryTimestamp, isCurrentlyCompliant);
    }

    /**
     * @notice Get all NFT holders (for admin panel)
     * @return holders Array of addresses that currently hold NFTs
     * @return tokenIds Array of corresponding token IDs
     * @return expiries Array of corresponding expiry timestamps
     */
    function getAllHolders() external view returns (
        address[] memory holders,
        uint256[] memory tokenIds,
        uint256[] memory expiries
    ) {
        // Count valid holders
        uint256 validHolders = 0;
        for (uint256 i = 1; i < _nextTokenId; i++) {
            if (_ownerOf(i) != address(0)) {
                validHolders++;
            }
        }
        
        // Populate arrays
        holders = new address[](validHolders);
        tokenIds = new uint256[](validHolders);
        expiries = new uint256[](validHolders);
        
        uint256 index = 0;
        for (uint256 i = 1; i < _nextTokenId; i++) {
            address holder = _ownerOf(i);
            if (holder != address(0)) {
                holders[index] = holder;
                tokenIds[index] = i;
                expiries[index] = validUntil[i];
                index++;
            }
        }
        
        return (holders, tokenIds, expiries);
    }

    /**
     * @notice Check if an address is the admin
     * @param account Address to check
     * @return True if the address is the owner/admin
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

    // ========== SOULBOUND OVERRIDES ==========
    
    /**
     * @dev Override to prevent transfers (soulbound)
     */
    function _update(address to, uint256 tokenId, address auth) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Allow minting (from == address(0))
        // Allow burning (to == address(0))  
        // Deny transfers (from != address(0) && to != address(0))
        require(from == address(0) || to == address(0), "Soulbound: transfers not allowed");
        
        return super._update(to, tokenId, auth);
    }

    /**
     * @dev Override to prevent approvals (soulbound)
     */
    function approve(address, uint256) public pure override {
        revert("Soulbound: approvals not allowed");
    }

    /**
     * @dev Override to prevent approval for all (soulbound)
     */
    function setApprovalForAll(address, bool) public pure override {
        revert("Soulbound: approvals not allowed");
    }
}
