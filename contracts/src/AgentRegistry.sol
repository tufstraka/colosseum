// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title AgentRegistry
 * @notice On-chain registry for autonomous AI agents on AgentArena
 * @dev Agents register with skills, pricing, and endpoint. Reputation is earned through work.
 */
contract AgentRegistry is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    enum SkillTag {
        Research,
        Writing,
        DataAnalysis,
        CodeReview,
        Translation,
        Summarization,
        Creative,
        TechnicalWriting,
        SmartContractAudit,
        MarketAnalysis
    }

    struct Agent {
        address owner;           // Human who deployed this agent
        address wallet;          // Agent's on-chain wallet (could be same as owner)
        string name;
        string description;
        SkillTag primarySkill;
        SkillTag[] skills;
        uint256 pricePerTask;    // In USDC (6 decimals)
        string endpointHash;     // IPFS hash or URL hash of agent's API endpoint
        uint256 totalTasksCompleted;
        uint256 totalEarnings;
        uint256 reputationScore; // 0-500 (displayed as 0.0-5.0)
        uint256 totalRatings;
        bool isActive;
        uint256 registeredAt;
        uint256 lastActiveAt;
        uint256 stakedAmount;    // Optional stake for credibility
    }

    IERC20 public paymentToken;
    uint256 public registrationFee;
    uint256 public nextAgentId;
    uint256 public totalAgents;
    uint256 public totalActiveAgents;

    mapping(uint256 => Agent) public agents;
    mapping(address => uint256[]) public ownerAgents;
    mapping(address => uint256) public walletToAgent; // wallet → agentId

    // Events
    event AgentRegistered(uint256 indexed agentId, address indexed owner, string name, SkillTag primarySkill, uint256 pricePerTask);
    event AgentUpdated(uint256 indexed agentId, uint256 newPrice, bool isActive);
    event AgentDeactivated(uint256 indexed agentId);
    event ReputationUpdated(uint256 indexed agentId, uint256 newScore, uint256 totalRatings);
    event TaskCompleted(uint256 indexed agentId, uint256 earnings);
    event AgentStaked(uint256 indexed agentId, uint256 amount);

    // Errors
    error AgentNotFound();
    error NotAgentOwner();
    error AgentNotActive();
    error InvalidPrice();
    error InvalidName();
    error InsufficientFee();

    constructor(address _paymentToken, uint256 _registrationFee) {
        paymentToken = IERC20(_paymentToken);
        registrationFee = _registrationFee;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
        nextAgentId = 1;
    }

    /**
     * @notice Register a new AI agent
     */
    function registerAgent(
        string calldata name,
        string calldata description,
        SkillTag primarySkill,
        SkillTag[] calldata skills,
        uint256 pricePerTask,
        string calldata endpointHash
    ) external returns (uint256 agentId) {
        if (bytes(name).length == 0 || bytes(name).length > 64) revert InvalidName();
        if (pricePerTask == 0) revert InvalidPrice();

        // Collect registration fee if set
        if (registrationFee > 0) {
            paymentToken.safeTransferFrom(msg.sender, address(this), registrationFee);
        }

        agentId = nextAgentId++;
        Agent storage agent = agents[agentId];
        agent.owner = msg.sender;
        agent.wallet = msg.sender; // Default: owner wallet
        agent.name = name;
        agent.description = description;
        agent.primarySkill = primarySkill;
        for (uint i = 0; i < skills.length; i++) {
            agent.skills.push(skills[i]);
        }
        agent.pricePerTask = pricePerTask;
        agent.endpointHash = endpointHash;
        agent.isActive = true;
        agent.registeredAt = block.timestamp;
        agent.lastActiveAt = block.timestamp;
        agent.reputationScore = 250; // Start at 2.5/5.0

        ownerAgents[msg.sender].push(agentId);
        walletToAgent[msg.sender] = agentId;
        totalAgents++;
        totalActiveAgents++;

        emit AgentRegistered(agentId, msg.sender, name, primarySkill, pricePerTask);
    }

    /**
     * @notice Set a separate wallet address for the agent
     */
    function setAgentWallet(uint256 agentId, address newWallet) external {
        Agent storage agent = agents[agentId];
        if (agent.owner != msg.sender) revert NotAgentOwner();
        walletToAgent[agent.wallet] = 0;
        agent.wallet = newWallet;
        walletToAgent[newWallet] = agentId;
    }

    /**
     * @notice Update agent pricing and status
     */
    function updateAgent(
        uint256 agentId,
        uint256 newPrice,
        bool isActive,
        string calldata newEndpointHash
    ) external {
        Agent storage agent = agents[agentId];
        if (agent.owner == address(0)) revert AgentNotFound();
        if (agent.owner != msg.sender) revert NotAgentOwner();
        if (newPrice == 0) revert InvalidPrice();

        bool wasActive = agent.isActive;
        agent.pricePerTask = newPrice;
        agent.isActive = isActive;
        if (bytes(newEndpointHash).length > 0) {
            agent.endpointHash = newEndpointHash;
        }

        if (wasActive && !isActive) totalActiveAgents--;
        if (!wasActive && isActive) totalActiveAgents++;

        emit AgentUpdated(agentId, newPrice, isActive);
    }

    /**
     * @notice Record task completion (called by TaskMarket)
     */
    function recordTaskCompletion(
        uint256 agentId,
        uint256 earnings,
        uint256 rating // 0-500
    ) external onlyRole(OPERATOR_ROLE) {
        Agent storage agent = agents[agentId];
        if (agent.owner == address(0)) revert AgentNotFound();

        agent.totalTasksCompleted++;
        agent.totalEarnings += earnings;
        agent.lastActiveAt = block.timestamp;

        // Update reputation (weighted moving average)
        if (rating > 0) {
            uint256 totalWeight = agent.totalRatings + 1;
            agent.reputationScore = ((agent.reputationScore * agent.totalRatings) + rating) / totalWeight;
            agent.totalRatings = totalWeight;
            emit ReputationUpdated(agentId, agent.reputationScore, totalWeight);
        }

        emit TaskCompleted(agentId, earnings);
    }

    /**
     * @notice Stake tokens for credibility
     */
    function stakeForAgent(uint256 agentId, uint256 amount) external {
        Agent storage agent = agents[agentId];
        if (agent.owner != msg.sender) revert NotAgentOwner();
        paymentToken.safeTransferFrom(msg.sender, address(this), amount);
        agent.stakedAmount += amount;
        emit AgentStaked(agentId, amount);
    }

    // --- View Functions ---

    function getAgent(uint256 agentId) external view returns (
        address owner, address wallet, string memory name, string memory description,
        SkillTag primarySkill, uint256 pricePerTask, uint256 totalTasksCompleted,
        uint256 totalEarnings, uint256 reputationScore, uint256 totalRatings,
        bool isActive, uint256 registeredAt, uint256 lastActiveAt, uint256 stakedAmount
    ) {
        Agent storage a = agents[agentId];
        return (a.owner, a.wallet, a.name, a.description, a.primarySkill,
                a.pricePerTask, a.totalTasksCompleted, a.totalEarnings,
                a.reputationScore, a.totalRatings, a.isActive, a.registeredAt,
                a.lastActiveAt, a.stakedAmount);
    }

    function getAgentSkills(uint256 agentId) external view returns (SkillTag[] memory) {
        return agents[agentId].skills;
    }

    function getOwnerAgentIds(address owner) external view returns (uint256[] memory) {
        return ownerAgents[owner];
    }

    function getReputationDisplay(uint256 agentId) external view returns (uint256 whole, uint256 decimal) {
        uint256 score = agents[agentId].reputationScore;
        whole = score / 100;
        decimal = (score % 100) / 10;
    }
}
