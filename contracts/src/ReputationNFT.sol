// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

/**
 * @title ReputationNFT
 * @notice Soulbound ERC-721 — non-transferable reputation tokens for AI agents
 * @dev Minted on first task completion. Score updated on-chain. Cannot be transferred.
 *      On-chain SVG metadata — no external dependencies.
 */
contract ReputationNFT is ERC721, AccessControl {
    using Strings for uint256;

    bytes32 public constant UPDATER_ROLE = keccak256("UPDATER_ROLE");

    struct Reputation {
        uint256 agentId;
        string agentName;
        string skill;
        uint256 score;          // 0-500 (displayed as 0.0-5.0)
        uint256 totalTasks;
        uint256 totalEarnings;  // in USDC (6 decimals)
        uint256 mintedAt;
        uint256 lastUpdated;
    }

    uint256 public nextTokenId;
    mapping(uint256 => Reputation) public reputations;    // tokenId → reputation
    mapping(uint256 => uint256) public agentToToken;      // agentId → tokenId
    mapping(uint256 => bool) public agentHasNFT;

    string[] public skillLabels;

    event ReputationMinted(uint256 indexed tokenId, uint256 indexed agentId, string agentName);
    event ReputationUpdated(uint256 indexed tokenId, uint256 newScore, uint256 totalTasks, uint256 totalEarnings);

    error Soulbound();
    error AlreadyMinted();
    error NotMinted();

    constructor() ERC721("AgentArena Reputation", "REP") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(UPDATER_ROLE, msg.sender);
        nextTokenId = 1;

        // Initialize skill labels
        skillLabels.push("Research");
        skillLabels.push("Writing");
        skillLabels.push("Data Analysis");
        skillLabels.push("Code Review");
        skillLabels.push("Translation");
        skillLabels.push("Summarization");
        skillLabels.push("Creative");
        skillLabels.push("Technical Writing");
        skillLabels.push("Smart Contract Audit");
        skillLabels.push("Market Analysis");
    }

    /**
     * @notice Mint reputation NFT on first task completion
     */
    function mintReputation(
        uint256 agentId,
        string calldata agentName,
        uint256 skillIndex,
        address agentOwner
    ) external onlyRole(UPDATER_ROLE) returns (uint256 tokenId) {
        if (agentHasNFT[agentId]) revert AlreadyMinted();

        tokenId = nextTokenId++;
        _mint(agentOwner, tokenId);

        string memory skill = skillIndex < skillLabels.length ? skillLabels[skillIndex] : "Other";

        reputations[tokenId] = Reputation({
            agentId: agentId,
            agentName: agentName,
            skill: skill,
            score: 250,           // Start at 2.5
            totalTasks: 1,
            totalEarnings: 0,
            mintedAt: block.timestamp,
            lastUpdated: block.timestamp
        });

        agentToToken[agentId] = tokenId;
        agentHasNFT[agentId] = true;

        emit ReputationMinted(tokenId, agentId, agentName);
    }

    /**
     * @notice Update reputation score after task completion
     */
    function updateReputation(
        uint256 agentId,
        uint256 newScore,
        uint256 taskEarnings
    ) external onlyRole(UPDATER_ROLE) {
        if (!agentHasNFT[agentId]) revert NotMinted();

        uint256 tokenId = agentToToken[agentId];
        Reputation storage rep = reputations[tokenId];
        rep.score = newScore;
        rep.totalTasks++;
        rep.totalEarnings += taskEarnings;
        rep.lastUpdated = block.timestamp;

        emit ReputationUpdated(tokenId, newScore, rep.totalTasks, rep.totalEarnings);
    }

    /**
     * @notice On-chain SVG + JSON metadata
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        Reputation memory rep = reputations[tokenId];

        uint256 scoreWhole = rep.score / 100;
        uint256 scoreDecimal = (rep.score % 100) / 10;
        string memory earningsStr = (rep.totalEarnings / 1e6).toString();

        // Star color based on score
        string memory starColor = rep.score >= 400 ? "#F59E0B" : rep.score >= 300 ? "#A3E635" : "#94A3B8";
        string memory tierName = rep.score >= 450 ? "Elite" : rep.score >= 350 ? "Expert" : rep.score >= 250 ? "Established" : "Newcomer";
        string memory bgGradient = rep.score >= 400 ? "#F59E0B" : rep.score >= 300 ? "#10B981" : "#6366F1";

        string memory svg = string(abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500">',
            '<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">',
            '<stop offset="0%" stop-color="#0a0a0a"/>',
            '<stop offset="100%" stop-color="#1a1a2e"/>',
            '</linearGradient></defs>',
            '<rect width="400" height="500" fill="url(#bg)" rx="20"/>',
            '<rect x="1" y="1" width="398" height="498" fill="none" stroke="', bgGradient, '" stroke-width="2" rx="20" opacity="0.5"/>',
            // Header
            '<text x="200" y="40" text-anchor="middle" fill="#666" font-family="monospace" font-size="11">AGENTARENA REPUTATION // SOULBOUND</text>',
            // Agent name
            '<text x="200" y="90" text-anchor="middle" fill="white" font-family="sans-serif" font-size="28" font-weight="bold">', rep.agentName, '</text>',
            // Skill badge
            '<rect x="120" y="105" width="160" height="28" rx="14" fill="', bgGradient, '" opacity="0.2"/>',
            '<text x="200" y="124" text-anchor="middle" fill="', bgGradient, '" font-family="sans-serif" font-size="13">', rep.skill, '</text>'
        ));

        svg = string(abi.encodePacked(svg,
            // Score - big number
            '<text x="200" y="210" text-anchor="middle" fill="', starColor, '" font-family="sans-serif" font-size="72" font-weight="bold">', scoreWhole.toString(), '.', scoreDecimal.toString(), '</text>',
            '<text x="200" y="240" text-anchor="middle" fill="#666" font-family="sans-serif" font-size="16">', tierName, '</text>',
            // Stars
            _renderStars(rep.score, 125, 260, starColor),
            // Stats
            '<line x1="40" y1="300" x2="360" y2="300" stroke="#333" stroke-width="1"/>',
            '<text x="60" y="340" fill="#888" font-family="monospace" font-size="12">TASKS COMPLETED</text>',
            '<text x="340" y="340" text-anchor="end" fill="white" font-family="monospace" font-size="14" font-weight="bold">', rep.totalTasks.toString(), '</text>',
            '<text x="60" y="370" fill="#888" font-family="monospace" font-size="12">TOTAL EARNED</text>',
            '<text x="340" y="370" text-anchor="end" fill="#10B981" font-family="monospace" font-size="14" font-weight="bold">$', earningsStr, ' USDC</text>',
            '<text x="60" y="400" fill="#888" font-family="monospace" font-size="12">AGENT ID</text>',
            '<text x="340" y="400" text-anchor="end" fill="white" font-family="monospace" font-size="14">#', rep.agentId.toString(), '</text>'
        ));

        svg = string(abi.encodePacked(svg,
            // Footer
            '<line x1="40" y1="430" x2="360" y2="430" stroke="#333" stroke-width="1"/>',
            '<text x="200" y="460" text-anchor="middle" fill="#444" font-family="monospace" font-size="10">NON-TRANSFERABLE // POLKADOT HUB TESTNET</text>',
            '<text x="200" y="480" text-anchor="middle" fill="#333" font-family="monospace" font-size="9">MINTED BLOCK ', rep.mintedAt.toString(), '</text>',
            '</svg>'
        ));

        string memory json = string(abi.encodePacked(
            '{"name":"', rep.agentName, ' Reputation #', tokenId.toString(),
            '","description":"Soulbound reputation NFT for AI agent ', rep.agentName,
            ' on AgentArena. Score: ', scoreWhole.toString(), '.', scoreDecimal.toString(),
            '/5.0. Tasks: ', rep.totalTasks.toString(),
            '","image":"data:image/svg+xml;base64,', Base64.encode(bytes(svg)),
            '","attributes":[',
            '{"trait_type":"Score","value":', rep.score.toString(), '},',
            '{"trait_type":"Tier","value":"', tierName, '"},',
            '{"trait_type":"Skill","value":"', rep.skill, '"},',
            '{"trait_type":"Tasks Completed","value":', rep.totalTasks.toString(), '},',
            '{"trait_type":"Total Earned USDC","value":', earningsStr, '},',
            '{"trait_type":"Soulbound","value":"true"}',
            ']}'
        ));

        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(bytes(json))));
    }

    function _renderStars(uint256 score, uint256 startX, uint256 y, string memory color) internal pure returns (string memory) {
        uint256 fullStars = score / 100;
        bytes memory stars;
        for (uint256 i = 0; i < 5; i++) {
            uint256 cx = startX + (i * 38);
            if (i < fullStars) {
                stars = abi.encodePacked(stars, '<text x="', cx.toString(), '" y="', y.toString(), '" fill="', color, '" font-size="24">&#9733;</text>');
            } else {
                stars = abi.encodePacked(stars, '<text x="', cx.toString(), '" y="', y.toString(), '" fill="#333" font-size="24">&#9733;</text>');
            }
        }
        return string(stars);
    }

    // ========== SOULBOUND: Block all transfers ==========

    function transferFrom(address, address, uint256) public pure override {
        revert Soulbound();
    }

    function safeTransferFrom(address, address, uint256, bytes memory) public pure override {
        revert Soulbound();
    }

    function approve(address, uint256) public pure override {
        revert Soulbound();
    }

    function setApprovalForAll(address, bool) public pure override {
        revert Soulbound();
    }

    // Required override
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
