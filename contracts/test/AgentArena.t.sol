// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/AgentRegistry.sol";
import "../src/TaskMarket.sol";
import "../script/DeployGenomeVault.s.sol"; // MockUSDC

contract AgentArenaTest is Test {
    AgentRegistry public registry;
    TaskMarket public market;
    MockUSDC public usdc;
    
    address public admin = address(1);
    address public agentOwner1 = address(2);
    address public agentOwner2 = address(3);
    address public taskPoster = address(4);
    address public arbiter = address(5);
    address public feeRecipient = address(6);

    uint256 constant USDC_1 = 1e6;
    uint256 constant USDC_100 = 100e6;

    function setUp() public {
        vm.startPrank(admin);
        usdc = new MockUSDC();
        registry = new AgentRegistry(address(usdc), 0); // No registration fee
        market = new TaskMarket(
            address(usdc),
            address(registry),
            500,                // 5% fee
            feeRecipient,
            1 hours             // Auto-approve after 1 hour
        );
        // Grant market the OPERATOR_ROLE on registry
        registry.grantRole(registry.OPERATOR_ROLE(), address(market));
        market.grantRole(market.ARBITER_ROLE(), arbiter);
        vm.stopPrank();

        // Fund accounts
        usdc.mint(agentOwner1, 10_000 * USDC_1);
        usdc.mint(agentOwner2, 10_000 * USDC_1);
        usdc.mint(taskPoster, 10_000 * USDC_1);

        // Approve
        vm.prank(agentOwner1);
        usdc.approve(address(registry), type(uint256).max);
        vm.prank(agentOwner2);
        usdc.approve(address(registry), type(uint256).max);
        vm.prank(taskPoster);
        usdc.approve(address(market), type(uint256).max);
    }

    // ========== REGISTRY TESTS ==========

    function test_RegisterAgent() public {
        vm.prank(agentOwner1);
        AgentRegistry.SkillTag[] memory skills = new AgentRegistry.SkillTag[](2);
        skills[0] = AgentRegistry.SkillTag.Research;
        skills[1] = AgentRegistry.SkillTag.Summarization;

        uint256 agentId = registry.registerAgent(
            "ResearchBot",
            "AI research and summarization agent",
            AgentRegistry.SkillTag.Research,
            skills,
            2 * USDC_1, // $2 per task
            "QmEndpointHash123"
        );

        assertEq(agentId, 1);
        assertEq(registry.totalAgents(), 1);
        assertEq(registry.totalActiveAgents(), 1);

        (address owner,,string memory name,,,uint256 price,
         uint256 tasks, uint256 earnings, uint256 rep, uint256 ratings,
         bool active,,,) = registry.getAgent(1);
        
        assertEq(owner, agentOwner1);
        assertEq(name, "ResearchBot");
        assertEq(price, 2 * USDC_1);
        assertEq(tasks, 0);
        assertEq(earnings, 0);
        assertEq(rep, 250); // Starting reputation 2.5
        assertEq(ratings, 0);
        assertTrue(active);
    }

    function test_RegisterMultipleAgents() public {
        AgentRegistry.SkillTag[] memory skills = new AgentRegistry.SkillTag[](1);
        skills[0] = AgentRegistry.SkillTag.Research;

        vm.prank(agentOwner1);
        registry.registerAgent("Agent1", "Desc", AgentRegistry.SkillTag.Research, skills, USDC_1, "hash1");
        
        vm.prank(agentOwner2);
        registry.registerAgent("Agent2", "Desc", AgentRegistry.SkillTag.CodeReview, skills, 5 * USDC_1, "hash2");

        assertEq(registry.totalAgents(), 2);
    }

    function test_UpdateAgent() public {
        _registerAgent(agentOwner1, "Bot1", AgentRegistry.SkillTag.Research, USDC_1);

        vm.prank(agentOwner1);
        registry.updateAgent(1, 5 * USDC_1, true, "newHash");

        (,,,,, uint256 price,,,,, bool active,,,) = registry.getAgent(1);
        assertEq(price, 5 * USDC_1);
        assertTrue(active);
    }

    function test_DeactivateAgent() public {
        _registerAgent(agentOwner1, "Bot1", AgentRegistry.SkillTag.Research, USDC_1);

        vm.prank(agentOwner1);
        registry.updateAgent(1, USDC_1, false, "");

        (,,,,,,,,,,bool active,,,) = registry.getAgent(1);
        assertFalse(active);
        assertEq(registry.totalActiveAgents(), 0);
    }

    function test_ReputationDisplay() public {
        _registerAgent(agentOwner1, "Bot1", AgentRegistry.SkillTag.Research, USDC_1);
        
        (uint256 whole, uint256 decimal) = registry.getReputationDisplay(1);
        assertEq(whole, 2);
        assertEq(decimal, 5); // 2.5
    }

    // ========== TASK MARKET TESTS ==========

    function test_PostTask() public {
        vm.prank(taskPoster);
        uint256 taskId = market.postTask(
            "Summarize top 5 Polkadot governance proposals",
            AgentRegistry.SkillTag.Research,
            2 * USDC_1,
            1 hours
        );

        assertEq(taskId, 1);
        assertEq(market.totalTasksPosted(), 1);
        
        // Bounty should be escrowed
        assertEq(usdc.balanceOf(address(market)), 2 * USDC_1);
    }

    function test_FullTaskLifecycle() public {
        // 1. Register agent
        _registerAgent(agentOwner1, "ResearchBot", AgentRegistry.SkillTag.Research, 2 * USDC_1);

        // 2. Post task
        vm.prank(taskPoster);
        uint256 taskId = market.postTask(
            "Summarize governance proposals",
            AgentRegistry.SkillTag.Research,
            2 * USDC_1,
            1 hours
        );

        // 3. Agent bids
        vm.prank(agentOwner1);
        market.bidOnTask(taskId, 1);

        // 4. Agent submits result
        vm.prank(agentOwner1);
        market.submitResult(taskId, "QmResultHash456");

        // 5. Poster approves
        uint256 agentBalanceBefore = usdc.balanceOf(agentOwner1);
        vm.prank(taskPoster);
        market.approveResult(taskId);

        // 6. Verify payment: 2 USDC - 5% = 1.9 USDC
        uint256 payout = 2 * USDC_1 - (2 * USDC_1 * 500 / 10000);
        assertEq(usdc.balanceOf(agentOwner1), agentBalanceBefore + payout);
        assertEq(usdc.balanceOf(feeRecipient), 2 * USDC_1 * 500 / 10000);

        // 7. Check stats
        assertEq(market.totalTasksCompleted(), 1);
        
        (,,,,,, uint256 completed, uint256 earnings,,,,,,) = registry.getAgent(1);
        assertEq(completed, 1);
        assertEq(earnings, payout);
    }

    function test_AutoApprove() public {
        _registerAgent(agentOwner1, "Bot", AgentRegistry.SkillTag.Writing, USDC_1);

        vm.prank(taskPoster);
        uint256 taskId = market.postTask("Write article", AgentRegistry.SkillTag.Writing, 5 * USDC_1, 2 hours);

        vm.prank(agentOwner1);
        market.bidOnTask(taskId, 1);

        vm.prank(agentOwner1);
        market.submitResult(taskId, "QmArticle123");

        // Can't auto-approve yet
        vm.expectRevert(TaskMarket.AutoApproveNotReady.selector);
        market.autoApprove(taskId);

        // Fast forward past auto-approve delay
        vm.warp(block.timestamp + 1 hours + 1);

        market.autoApprove(taskId);

        (,,,,,TaskMarket.TaskStatus status,,,,,,,bool auto_) = market.getTask(taskId);
        assertEq(uint(status), uint(TaskMarket.TaskStatus.Approved));
        assertTrue(auto_);
    }

    function test_RateTask() public {
        _registerAgent(agentOwner1, "Bot", AgentRegistry.SkillTag.Research, USDC_1);
        
        vm.prank(taskPoster);
        uint256 taskId = market.postTask("Research task", AgentRegistry.SkillTag.Research, USDC_1, 1 hours);
        
        vm.prank(agentOwner1);
        market.bidOnTask(taskId, 1);
        
        vm.prank(agentOwner1);
        market.submitResult(taskId, "QmResult");
        
        vm.prank(taskPoster);
        market.approveResult(taskId);

        // Rate 4.5/5.0 = 450
        vm.prank(taskPoster);
        market.rateTask(taskId, 450);

        // Reputation should update (weighted avg of 250 and 450)
        (,,,,,,,, uint256 rep, uint256 ratings,,,,) = registry.getAgent(1);
        assertEq(ratings, 1);
        // (250 * 0 + 450) / 1 = 450 (first rating replaces starting score via the formula)
        assertEq(rep, 450);
    }

    function test_DisputeAndResolve() public {
        _registerAgent(agentOwner1, "Bot", AgentRegistry.SkillTag.Writing, USDC_1);
        
        vm.prank(taskPoster);
        uint256 taskId = market.postTask("Write something", AgentRegistry.SkillTag.Writing, 3 * USDC_1, 1 hours);
        
        vm.prank(agentOwner1);
        market.bidOnTask(taskId, 1);
        
        vm.prank(agentOwner1);
        market.submitResult(taskId, "QmBadResult");

        // Poster disputes
        vm.prank(taskPoster);
        market.disputeResult(taskId);

        (,,,,,TaskMarket.TaskStatus status,,,,,,,) = market.getTask(taskId);
        assertEq(uint(status), uint(TaskMarket.TaskStatus.Disputed));

        // Arbiter resolves in favor of poster (refund)
        uint256 posterBefore = usdc.balanceOf(taskPoster);
        vm.prank(arbiter);
        market.resolveDispute(taskId, false);

        assertEq(usdc.balanceOf(taskPoster), posterBefore + 3 * USDC_1);
    }

    function test_CancelTask() public {
        vm.prank(taskPoster);
        uint256 taskId = market.postTask("Task", AgentRegistry.SkillTag.Research, 5 * USDC_1, 1 hours);

        uint256 before = usdc.balanceOf(taskPoster);
        vm.prank(taskPoster);
        market.cancelTask(taskId);

        assertEq(usdc.balanceOf(taskPoster), before + 5 * USDC_1);
    }

    function test_RevertBidInactiveAgent() public {
        _registerAgent(agentOwner1, "Bot", AgentRegistry.SkillTag.Research, USDC_1);
        
        vm.prank(agentOwner1);
        registry.updateAgent(1, USDC_1, false, "");

        vm.prank(taskPoster);
        uint256 taskId = market.postTask("Task", AgentRegistry.SkillTag.Research, USDC_1, 1 hours);

        vm.prank(agentOwner1);
        vm.expectRevert(TaskMarket.AgentNotActive.selector);
        market.bidOnTask(taskId, 1);
    }

    function test_RevertDoubleRate() public {
        _registerAgent(agentOwner1, "Bot", AgentRegistry.SkillTag.Research, USDC_1);
        
        vm.prank(taskPoster);
        uint256 taskId = market.postTask("Task", AgentRegistry.SkillTag.Research, USDC_1, 1 hours);
        
        vm.prank(agentOwner1);
        market.bidOnTask(taskId, 1);
        vm.prank(agentOwner1);
        market.submitResult(taskId, "QmResult");
        vm.prank(taskPoster);
        market.approveResult(taskId);
        vm.prank(taskPoster);
        market.rateTask(taskId, 400);

        vm.prank(taskPoster);
        vm.expectRevert(TaskMarket.AlreadyRated.selector);
        market.rateTask(taskId, 500);
    }

    // ========== HELPERS ==========

    function _registerAgent(
        address owner,
        string memory name,
        AgentRegistry.SkillTag skill,
        uint256 price
    ) internal returns (uint256) {
        AgentRegistry.SkillTag[] memory skills = new AgentRegistry.SkillTag[](1);
        skills[0] = skill;
        vm.prank(owner);
        return registry.registerAgent(name, "Test agent", skill, skills, price, "QmHash");
    }
}
