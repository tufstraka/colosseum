// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./AgentRegistry.sol";

/**
 * @title TaskMarket
 * @notice Autonomous task marketplace where AI agents bid, complete work, and collect payment
 * @dev Jobs are posted with USDC bounties. Agents bid, complete, submit proof, get paid.
 *      Auto-approval after dispute window. Full economic loop on-chain.
 */
contract TaskMarket is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant ARBITER_ROLE = keccak256("ARBITER_ROLE");

    enum TaskStatus {
        Open,           // Posted, awaiting bids
        Assigned,       // Agent claimed it
        Submitted,      // Agent submitted result
        Approved,       // Result approved, payment released
        Disputed,       // Poster disputed the result
        Cancelled,      // Poster cancelled before assignment
        Expired         // Deadline passed without completion
    }

    struct Task {
        address poster;
        string description;
        AgentRegistry.SkillTag skillTag;
        uint256 bounty;           // USDC amount
        uint256 deadline;
        TaskStatus status;
        uint256 assignedAgent;    // agentId
        string resultHash;        // IPFS hash of completed work
        uint256 postedAt;
        uint256 assignedAt;
        uint256 submittedAt;
        uint256 approvedAt;
        uint256 rating;           // 0-500 (0 = unrated)
        bool autoApproved;
    }

    IERC20 public paymentToken;
    AgentRegistry public registry;
    
    uint256 public platformFeeBps;   // e.g., 500 = 5%
    address public feeRecipient;
    uint256 public autoApproveDelay; // seconds after submission before auto-approve
    
    uint256 public nextTaskId;
    uint256 public totalTasksPosted;
    uint256 public totalTasksCompleted;
    uint256 public totalVolumeUSD;
    uint256 public totalFeesCollected;

    mapping(uint256 => Task) public tasks;
    mapping(address => uint256[]) public posterTasks;
    mapping(uint256 => uint256[]) public agentTasks; // agentId → taskIds

    // Events
    event TaskPosted(uint256 indexed taskId, address indexed poster, AgentRegistry.SkillTag skillTag, uint256 bounty, uint256 deadline);
    event TaskBid(uint256 indexed taskId, uint256 indexed agentId);
    event TaskSubmitted(uint256 indexed taskId, uint256 indexed agentId, string resultHash);
    event TaskApproved(uint256 indexed taskId, uint256 indexed agentId, uint256 payout, bool autoApproved);
    event TaskDisputed(uint256 indexed taskId, address indexed poster);
    event TaskCancelled(uint256 indexed taskId);
    event TaskRated(uint256 indexed taskId, uint256 indexed agentId, uint256 rating);

    // Errors
    error TaskNotFound();
    error InvalidBounty();
    error InvalidDeadline();
    error TaskNotOpen();
    error TaskNotAssigned();
    error TaskNotSubmitted();
    error NotTaskPoster();
    error NotAssignedAgent();
    error AgentNotActive();
    error DeadlinePassed();
    error AutoApproveNotReady();
    error AlreadyRated();

    constructor(
        address _paymentToken,
        address _registry,
        uint256 _platformFeeBps,
        address _feeRecipient,
        uint256 _autoApproveDelay
    ) {
        paymentToken = IERC20(_paymentToken);
        registry = AgentRegistry(_registry);
        platformFeeBps = _platformFeeBps;
        feeRecipient = _feeRecipient;
        autoApproveDelay = _autoApproveDelay;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ARBITER_ROLE, msg.sender);
        nextTaskId = 1;
    }

    /**
     * @notice Post a new task with USDC bounty
     */
    function postTask(
        string calldata description,
        AgentRegistry.SkillTag skillTag,
        uint256 bounty,
        uint256 deadlineSeconds
    ) external nonReentrant returns (uint256 taskId) {
        if (bounty == 0) revert InvalidBounty();
        if (deadlineSeconds < 5 minutes) revert InvalidDeadline();

        // Escrow the bounty
        paymentToken.safeTransferFrom(msg.sender, address(this), bounty);

        taskId = nextTaskId++;
        Task storage task = tasks[taskId];
        task.poster = msg.sender;
        task.description = description;
        task.skillTag = skillTag;
        task.bounty = bounty;
        task.deadline = block.timestamp + deadlineSeconds;
        task.status = TaskStatus.Open;
        task.postedAt = block.timestamp;

        posterTasks[msg.sender].push(taskId);
        totalTasksPosted++;

        emit TaskPosted(taskId, msg.sender, skillTag, bounty, task.deadline);
    }

    /**
     * @notice Agent bids on and claims a task
     */
    function bidOnTask(uint256 taskId, uint256 agentId) external nonReentrant {
        Task storage task = tasks[taskId];
        if (task.poster == address(0)) revert TaskNotFound();
        if (task.status != TaskStatus.Open) revert TaskNotOpen();
        if (block.timestamp > task.deadline) revert DeadlinePassed();

        // Verify agent
        (address owner, address wallet,,, AgentRegistry.SkillTag primarySkill,,,,,, bool isActive,,,) = registry.getAgent(agentId);
        if (!isActive) revert AgentNotActive();
        // Agent owner or wallet must be caller
        require(msg.sender == owner || msg.sender == wallet, "Not agent owner/wallet");

        task.status = TaskStatus.Assigned;
        task.assignedAgent = agentId;
        task.assignedAt = block.timestamp;

        agentTasks[agentId].push(taskId);

        emit TaskBid(taskId, agentId);
    }

    /**
     * @notice Agent submits completed work
     */
    function submitResult(uint256 taskId, string calldata resultHash) external {
        Task storage task = tasks[taskId];
        if (task.status != TaskStatus.Assigned) revert TaskNotAssigned();

        // Verify caller is the assigned agent
        (address owner, address wallet,,,,,,,,,,,,) = registry.getAgent(task.assignedAgent);
        require(msg.sender == owner || msg.sender == wallet, "Not assigned agent");

        task.resultHash = resultHash;
        task.status = TaskStatus.Submitted;
        task.submittedAt = block.timestamp;

        emit TaskSubmitted(taskId, task.assignedAgent, resultHash);
    }

    /**
     * @notice Poster approves the result and releases payment
     */
    function approveResult(uint256 taskId) external nonReentrant {
        Task storage task = tasks[taskId];
        if (task.status != TaskStatus.Submitted) revert TaskNotSubmitted();
        if (msg.sender != task.poster) revert NotTaskPoster();

        _releasePayout(taskId, false);
    }

    /**
     * @notice Auto-approve after delay (anyone can call)
     */
    function autoApprove(uint256 taskId) external nonReentrant {
        Task storage task = tasks[taskId];
        if (task.status != TaskStatus.Submitted) revert TaskNotSubmitted();
        if (block.timestamp < task.submittedAt + autoApproveDelay) revert AutoApproveNotReady();

        _releasePayout(taskId, true);
    }

    /**
     * @notice Rate a completed task
     */
    function rateTask(uint256 taskId, uint256 rating) external {
        Task storage task = tasks[taskId];
        if (task.status != TaskStatus.Approved) revert TaskNotSubmitted();
        if (msg.sender != task.poster) revert NotTaskPoster();
        if (task.rating > 0) revert AlreadyRated();
        require(rating >= 100 && rating <= 500, "Rating must be 1.0-5.0 (100-500)");

        task.rating = rating;
        
        // Update agent reputation
        registry.recordTaskCompletion(task.assignedAgent, 0, rating);

        emit TaskRated(taskId, task.assignedAgent, rating);
    }

    /**
     * @notice Poster disputes the result
     */
    function disputeResult(uint256 taskId) external {
        Task storage task = tasks[taskId];
        if (task.status != TaskStatus.Submitted) revert TaskNotSubmitted();
        if (msg.sender != task.poster) revert NotTaskPoster();

        task.status = TaskStatus.Disputed;
        emit TaskDisputed(taskId, msg.sender);
    }

    /**
     * @notice Arbiter resolves a dispute
     */
    function resolveDispute(uint256 taskId, bool approveWork) external onlyRole(ARBITER_ROLE) {
        Task storage task = tasks[taskId];
        require(task.status == TaskStatus.Disputed, "Not disputed");

        if (approveWork) {
            _releasePayout(taskId, false);
        } else {
            // Refund poster
            paymentToken.safeTransfer(task.poster, task.bounty);
            task.status = TaskStatus.Cancelled;
            emit TaskCancelled(taskId);
        }
    }

    /**
     * @notice Cancel an open task
     */
    function cancelTask(uint256 taskId) external nonReentrant {
        Task storage task = tasks[taskId];
        if (msg.sender != task.poster) revert NotTaskPoster();
        require(task.status == TaskStatus.Open, "Cannot cancel");

        paymentToken.safeTransfer(task.poster, task.bounty);
        task.status = TaskStatus.Cancelled;
        emit TaskCancelled(taskId);
    }

    // --- Internal ---

    function _releasePayout(uint256 taskId, bool isAuto) internal {
        Task storage task = tasks[taskId];
        
        uint256 fee = (task.bounty * platformFeeBps) / 10000;
        uint256 payout = task.bounty - fee;

        // Pay the agent's owner
        (address owner,,,,,,,,,,,,,) = registry.getAgent(task.assignedAgent);
        paymentToken.safeTransfer(owner, payout);
        if (fee > 0) {
            paymentToken.safeTransfer(feeRecipient, fee);
        }

        task.status = TaskStatus.Approved;
        task.approvedAt = block.timestamp;
        task.autoApproved = isAuto;

        // Record on registry
        registry.recordTaskCompletion(task.assignedAgent, payout, 0);

        totalTasksCompleted++;
        totalVolumeUSD += task.bounty;
        totalFeesCollected += fee;

        emit TaskApproved(taskId, task.assignedAgent, payout, isAuto);
    }

    // --- View Functions ---

    function getTask(uint256 taskId) external view returns (
        address poster, string memory description, AgentRegistry.SkillTag skillTag,
        uint256 bounty, uint256 deadline, TaskStatus status, uint256 assignedAgent,
        string memory resultHash, uint256 postedAt, uint256 submittedAt,
        uint256 approvedAt, uint256 rating, bool autoApproved
    ) {
        Task storage t = tasks[taskId];
        return (t.poster, t.description, t.skillTag, t.bounty, t.deadline,
                t.status, t.assignedAgent, t.resultHash, t.postedAt,
                t.submittedAt, t.approvedAt, t.rating, t.autoApproved);
    }

    function getPosterTaskIds(address poster) external view returns (uint256[] memory) {
        return posterTasks[poster];
    }

    function getAgentTaskIds(uint256 agentId) external view returns (uint256[] memory) {
        return agentTasks[agentId];
    }

    function getOpenTaskCount() external view returns (uint256 count) {
        for (uint256 i = 1; i < nextTaskId; i++) {
            if (tasks[i].status == TaskStatus.Open) count++;
        }
    }
}
