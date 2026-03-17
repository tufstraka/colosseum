// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title GenomeVault
 * @notice Decentralized marketplace for genomic data access
 * @dev Patients list encrypted genomic data, researchers pay to query.
 *      AI anonymization layer strips identifiers before data release.
 *      Built for Polkadot Hub with USDC micropayments.
 */
contract GenomeVault is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant ANONYMIZER_ROLE = keccak256("ANONYMIZER_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    // --- Data Types ---

    enum DataCategory {
        WholeGenome,        // Full genome sequencing
        Exome,              // Exome sequencing
        SNPArray,           // SNP genotyping array
        Microbiome,         // Gut/skin microbiome
        Epigenetic,         // Methylation/epigenetic data
        Proteomic,          // Protein expression data
        Metabolomic,        // Metabolite profiles
        ClinicalTrial,      // Clinical trial results
        EHR,                // Electronic health records
        Imaging,            // Medical imaging (MRI, CT, X-ray)
        Other
    }

    enum AccessStatus {
        Pending,            // Payment received, awaiting anonymization
        Active,             // Anonymized data available for query
        Expired,            // Access window closed
        Revoked             // Data owner revoked access
    }

    struct DataListing {
        address owner;              // Patient/data owner
        string encryptedIpfsHash;   // IPFS CID of encrypted data
        string metadataHash;        // IPFS CID of public metadata (demographics, data type, etc.)
        DataCategory category;
        uint256 pricePerQuery;      // Price in payment token (USDC) per query
        uint256 accessWindowSeconds; // How long access lasts per purchase
        uint256 totalQueries;       // Total queries sold
        uint256 totalEarnings;      // Total earned by data owner
        bool isActive;              // Whether listing is available
        uint256 createdAt;
        uint256 updatedAt;
        string[] tags;              // Searchable tags (e.g., "diabetes", "european", "male", "age:30-40")
    }

    struct AccessGrant {
        uint256 listingId;
        address researcher;
        uint256 paidAmount;
        uint256 grantedAt;
        uint256 expiresAt;
        AccessStatus status;
        string anonymizedDataHash;  // Set by anonymizer after processing
        uint256 queriesUsed;
        uint256 maxQueries;
    }

    struct ResearcherProfile {
        string institution;
        string purpose;             // Research purpose description
        bool isVerified;            // KYC/verified researcher
        uint256 totalSpent;
        uint256 totalAccesses;
    }

    // --- State ---

    IERC20 public paymentToken;     // USDC on Polkadot Hub
    uint256 public platformFeeBps;  // Platform fee in basis points (e.g., 250 = 2.5%)
    address public feeRecipient;
    
    uint256 public nextListingId;
    uint256 public nextAccessId;

    mapping(uint256 => DataListing) public listings;
    mapping(uint256 => AccessGrant) public accessGrants;
    mapping(address => uint256[]) public ownerListings;     // owner → listing IDs
    mapping(address => uint256[]) public researcherAccesses; // researcher → access IDs
    mapping(address => ResearcherProfile) public researchers;
    
    // Consent tracking
    mapping(uint256 => mapping(address => bool)) public consentRevoked; // listing → researcher → revoked

    // Stats
    uint256 public totalListings;
    uint256 public totalQueriesSold;
    uint256 public totalVolumeUSD;
    uint256 public totalPayoutToPatients;

    // --- Events ---

    event DataListed(
        uint256 indexed listingId,
        address indexed owner,
        DataCategory category,
        uint256 pricePerQuery,
        string metadataHash
    );

    event ListingUpdated(
        uint256 indexed listingId,
        uint256 newPrice,
        bool isActive
    );

    event AccessPurchased(
        uint256 indexed accessId,
        uint256 indexed listingId,
        address indexed researcher,
        uint256 amount,
        uint256 expiresAt
    );

    event DataAnonymized(
        uint256 indexed accessId,
        string anonymizedDataHash
    );

    event AccessExpired(uint256 indexed accessId);
    event AccessRevoked(uint256 indexed accessId, address indexed owner);
    event ConsentRevoked(uint256 indexed listingId, address indexed researcher);
    event EarningsWithdrawn(address indexed owner, uint256 amount);
    event ResearcherVerified(address indexed researcher, string institution);

    // --- Errors ---

    error ListingNotFound();
    error ListingNotActive();
    error InsufficientPayment();
    error NotListingOwner();
    error AccessNotFound();
    error AccessNotActive();
    error AccessExpiredError();
    error ConsentAlreadyRevoked();
    error NotAuthorized();
    error InvalidPrice();
    error InvalidAccessWindow();
    error ZeroAddress();

    // --- Constructor ---

    constructor(
        address _paymentToken,
        uint256 _platformFeeBps,
        address _feeRecipient
    ) {
        if (_paymentToken == address(0)) revert ZeroAddress();
        if (_feeRecipient == address(0)) revert ZeroAddress();
        
        paymentToken = IERC20(_paymentToken);
        platformFeeBps = _platformFeeBps;
        feeRecipient = _feeRecipient;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
        _grantRole(ANONYMIZER_ROLE, msg.sender);

        nextListingId = 1;
        nextAccessId = 1;
    }

    // --- Patient Functions ---

    /**
     * @notice List genomic data for sale
     * @param encryptedIpfsHash IPFS CID of encrypted genomic data
     * @param metadataHash IPFS CID of public metadata
     * @param category Type of genomic data
     * @param pricePerQuery Price in USDC per query
     * @param accessWindowSeconds Duration of access per purchase
     * @param tags Searchable tags
     */
    function listData(
        string calldata encryptedIpfsHash,
        string calldata metadataHash,
        DataCategory category,
        uint256 pricePerQuery,
        uint256 accessWindowSeconds,
        string[] memory tags
    ) external returns (uint256 listingId) {
        if (pricePerQuery == 0) revert InvalidPrice();
        if (accessWindowSeconds < 1 hours) revert InvalidAccessWindow();

        listingId = nextListingId++;

        DataListing storage listing = listings[listingId];
        listing.owner = msg.sender;
        listing.encryptedIpfsHash = encryptedIpfsHash;
        listing.metadataHash = metadataHash;
        listing.category = category;
        listing.pricePerQuery = pricePerQuery;
        listing.accessWindowSeconds = accessWindowSeconds;
        listing.isActive = true;
        listing.createdAt = block.timestamp;
        listing.updatedAt = block.timestamp;
        for (uint256 i = 0; i < tags.length; i++) {
            listing.tags.push(tags[i]);
        }

        ownerListings[msg.sender].push(listingId);
        totalListings++;

        emit DataListed(listingId, msg.sender, category, pricePerQuery, metadataHash);
    }

    /**
     * @notice Update listing price or status
     */
    function updateListing(
        uint256 listingId,
        uint256 newPrice,
        bool isActive
    ) external {
        DataListing storage listing = listings[listingId];
        if (listing.owner == address(0)) revert ListingNotFound();
        if (listing.owner != msg.sender) revert NotListingOwner();
        if (newPrice == 0) revert InvalidPrice();

        listing.pricePerQuery = newPrice;
        listing.isActive = isActive;
        listing.updatedAt = block.timestamp;

        emit ListingUpdated(listingId, newPrice, isActive);
    }

    /**
     * @notice Revoke a specific researcher's access and future consent
     */
    function revokeConsent(uint256 listingId, address researcher) external {
        DataListing storage listing = listings[listingId];
        if (listing.owner != msg.sender) revert NotListingOwner();
        if (consentRevoked[listingId][researcher]) revert ConsentAlreadyRevoked();

        consentRevoked[listingId][researcher] = true;

        // Revoke any active access grants
        uint256[] storage accesses = researcherAccesses[researcher];
        for (uint256 i = 0; i < accesses.length; i++) {
            AccessGrant storage grant = accessGrants[accesses[i]];
            if (grant.listingId == listingId && grant.status == AccessStatus.Active) {
                grant.status = AccessStatus.Revoked;
                emit AccessRevoked(accesses[i], msg.sender);
            }
        }

        emit ConsentRevoked(listingId, researcher);
    }

    // --- Researcher Functions ---

    /**
     * @notice Purchase access to a genomic dataset
     * @param listingId ID of the data listing
     * @param maxQueries Number of queries to purchase
     */
    function purchaseAccess(
        uint256 listingId,
        uint256 maxQueries
    ) external nonReentrant returns (uint256 accessId) {
        DataListing storage listing = listings[listingId];
        if (listing.owner == address(0)) revert ListingNotFound();
        if (!listing.isActive) revert ListingNotActive();
        if (consentRevoked[listingId][msg.sender]) revert NotAuthorized();

        uint256 totalCost = listing.pricePerQuery * maxQueries;
        if (totalCost == 0) revert InsufficientPayment();

        // Calculate fees
        uint256 platformFee = (totalCost * platformFeeBps) / 10000;
        uint256 ownerPayout = totalCost - platformFee;

        // Transfer payment
        paymentToken.safeTransferFrom(msg.sender, listing.owner, ownerPayout);
        if (platformFee > 0) {
            paymentToken.safeTransferFrom(msg.sender, feeRecipient, platformFee);
        }

        // Create access grant
        accessId = nextAccessId++;
        AccessGrant storage grant = accessGrants[accessId];
        grant.listingId = listingId;
        grant.researcher = msg.sender;
        grant.paidAmount = totalCost;
        grant.grantedAt = block.timestamp;
        grant.expiresAt = block.timestamp + listing.accessWindowSeconds;
        grant.status = AccessStatus.Pending; // Pending anonymization
        grant.maxQueries = maxQueries;

        // Update stats
        listing.totalQueries += maxQueries;
        listing.totalEarnings += ownerPayout;
        researcherAccesses[msg.sender].push(accessId);
        
        researchers[msg.sender].totalSpent += totalCost;
        researchers[msg.sender].totalAccesses++;
        
        totalQueriesSold += maxQueries;
        totalVolumeUSD += totalCost;
        totalPayoutToPatients += ownerPayout;

        emit AccessPurchased(accessId, listingId, msg.sender, totalCost, grant.expiresAt);
    }

    /**
     * @notice Register researcher profile
     */
    function registerResearcher(
        string calldata institution,
        string calldata purpose
    ) external {
        researchers[msg.sender].institution = institution;
        researchers[msg.sender].purpose = purpose;
    }

    // --- Anonymizer Functions (AI Agent) ---

    /**
     * @notice Called by AI anonymizer after processing data
     * @param accessId The access grant to fulfill
     * @param anonymizedDataHash IPFS CID of anonymized data
     */
    function fulfillAnonymization(
        uint256 accessId,
        string calldata anonymizedDataHash
    ) external onlyRole(ANONYMIZER_ROLE) {
        AccessGrant storage grant = accessGrants[accessId];
        if (grant.researcher == address(0)) revert AccessNotFound();
        if (grant.status != AccessStatus.Pending) revert NotAuthorized();

        grant.anonymizedDataHash = anonymizedDataHash;
        grant.status = AccessStatus.Active;

        emit DataAnonymized(accessId, anonymizedDataHash);
    }

    /**
     * @notice Mark expired access grants
     */
    function expireAccess(uint256 accessId) external {
        AccessGrant storage grant = accessGrants[accessId];
        if (grant.researcher == address(0)) revert AccessNotFound();
        if (block.timestamp < grant.expiresAt) revert NotAuthorized();
        if (grant.status != AccessStatus.Active) revert AccessNotActive();

        grant.status = AccessStatus.Expired;
        emit AccessExpired(accessId);
    }

    // --- Admin Functions ---

    function setFeeRecipient(address _feeRecipient) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_feeRecipient == address(0)) revert ZeroAddress();
        feeRecipient = _feeRecipient;
    }

    function setPlatformFee(uint256 _feeBps) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_feeBps <= 1000, "Fee too high"); // Max 10%
        platformFeeBps = _feeBps;
    }

    function verifyResearcher(
        address researcher,
        string calldata institution
    ) external onlyRole(OPERATOR_ROLE) {
        researchers[researcher].isVerified = true;
        researchers[researcher].institution = institution;
        emit ResearcherVerified(researcher, institution);
    }

    // --- View Functions ---

    function getListing(uint256 listingId) external view returns (
        address owner,
        string memory encryptedIpfsHash,
        string memory metadataHash,
        DataCategory category,
        uint256 pricePerQuery,
        uint256 accessWindowSeconds,
        uint256 totalQueries,
        uint256 totalEarnings,
        bool isActive,
        uint256 createdAt
    ) {
        DataListing storage l = listings[listingId];
        return (
            l.owner, l.encryptedIpfsHash, l.metadataHash, l.category,
            l.pricePerQuery, l.accessWindowSeconds, l.totalQueries,
            l.totalEarnings, l.isActive, l.createdAt
        );
    }

    function getAccessGrant(uint256 accessId) external view returns (
        uint256 listingId,
        address researcher,
        uint256 paidAmount,
        uint256 grantedAt,
        uint256 expiresAt,
        AccessStatus status,
        string memory anonymizedDataHash,
        uint256 queriesUsed,
        uint256 maxQueries
    ) {
        AccessGrant storage g = accessGrants[accessId];
        return (
            g.listingId, g.researcher, g.paidAmount, g.grantedAt,
            g.expiresAt, g.status, g.anonymizedDataHash,
            g.queriesUsed, g.maxQueries
        );
    }

    function getOwnerListingIds(address owner) external view returns (uint256[] memory) {
        return ownerListings[owner];
    }

    function getResearcherAccessIds(address researcher) external view returns (uint256[] memory) {
        return researcherAccesses[researcher];
    }

    function getListingTags(uint256 listingId) external view returns (string[] memory) {
        return listings[listingId].tags;
    }

    function isAccessValid(uint256 accessId) external view returns (bool) {
        AccessGrant storage g = accessGrants[accessId];
        return g.status == AccessStatus.Active && 
               block.timestamp < g.expiresAt &&
               g.queriesUsed < g.maxQueries;
    }

    // --- Native payment support (PAS) ---

    /**
     * @notice Purchase access with native PAS token
     */
    function purchaseAccessNative(
        uint256 listingId,
        uint256 maxQueries
    ) external payable nonReentrant returns (uint256 accessId) {
        DataListing storage listing = listings[listingId];
        if (listing.owner == address(0)) revert ListingNotFound();
        if (!listing.isActive) revert ListingNotActive();
        if (consentRevoked[listingId][msg.sender]) revert NotAuthorized();

        uint256 totalCost = listing.pricePerQuery * maxQueries;
        if (msg.value < totalCost) revert InsufficientPayment();

        // Calculate fees
        uint256 platformFee = (totalCost * platformFeeBps) / 10000;
        uint256 ownerPayout = totalCost - platformFee;

        // Transfer native token
        (bool sent,) = listing.owner.call{value: ownerPayout}("");
        require(sent, "Transfer failed");
        if (platformFee > 0) {
            (bool feeSent,) = feeRecipient.call{value: platformFee}("");
            require(feeSent, "Fee transfer failed");
        }

        // Refund excess
        if (msg.value > totalCost) {
            (bool refunded,) = msg.sender.call{value: msg.value - totalCost}("");
            require(refunded, "Refund failed");
        }

        // Create access grant
        accessId = nextAccessId++;
        AccessGrant storage grant = accessGrants[accessId];
        grant.listingId = listingId;
        grant.researcher = msg.sender;
        grant.paidAmount = totalCost;
        grant.grantedAt = block.timestamp;
        grant.expiresAt = block.timestamp + listing.accessWindowSeconds;
        grant.status = AccessStatus.Pending;
        grant.maxQueries = maxQueries;

        // Update stats
        listing.totalQueries += maxQueries;
        listing.totalEarnings += ownerPayout;
        researcherAccesses[msg.sender].push(accessId);
        
        researchers[msg.sender].totalSpent += totalCost;
        researchers[msg.sender].totalAccesses++;
        
        totalQueriesSold += maxQueries;
        totalVolumeUSD += totalCost;
        totalPayoutToPatients += ownerPayout;

        emit AccessPurchased(accessId, listingId, msg.sender, totalCost, grant.expiresAt);
    }
}
