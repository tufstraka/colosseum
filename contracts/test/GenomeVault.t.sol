// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/GenomeVault.sol";
import "../script/DeployGenomeVault.s.sol";

contract GenomeVaultTest is Test {
    GenomeVault public vault;
    MockUSDC public usdc;
    
    address public admin = address(1);
    address public patient1 = address(2);
    address public patient2 = address(3);
    address public researcher1 = address(4);
    address public researcher2 = address(5);
    address public anonymizer = address(6);
    address public feeRecipient = address(7);

    uint256 constant USDC_DECIMALS = 6;
    uint256 constant PRICE_10_USDC = 10 * 10**USDC_DECIMALS;
    uint256 constant PRICE_100_USDC = 100 * 10**USDC_DECIMALS;
    
    function setUp() public {
        vm.startPrank(admin);
        usdc = new MockUSDC();
        vault = new GenomeVault(address(usdc), 250, feeRecipient); // 2.5% fee
        vault.grantRole(vault.ANONYMIZER_ROLE(), anonymizer);
        vm.stopPrank();

        // Fund researchers with USDC
        usdc.mint(researcher1, 10_000 * 10**USDC_DECIMALS);
        usdc.mint(researcher2, 10_000 * 10**USDC_DECIMALS);

        // Approve vault to spend USDC
        vm.prank(researcher1);
        usdc.approve(address(vault), type(uint256).max);
        vm.prank(researcher2);
        usdc.approve(address(vault), type(uint256).max);
    }

    // --- Listing Tests ---

    function test_ListData() public {
        vm.prank(patient1);
        string[] memory tags = new string[](3);
        tags[0] = "diabetes";
        tags[1] = "european";
        tags[2] = "male";
        
        uint256 listingId = vault.listData(
            "QmEncryptedGenomeHash123",
            "QmMetadataHash456",
            GenomeVault.DataCategory.WholeGenome,
            PRICE_10_USDC,
            24 hours,
            tags
        );

        assertEq(listingId, 1);
        
        (address owner,,, GenomeVault.DataCategory category,
         uint256 price, uint256 window,,, bool active,) = vault.getListing(1);
        
        assertEq(owner, patient1);
        assertEq(uint(category), uint(GenomeVault.DataCategory.WholeGenome));
        assertEq(price, PRICE_10_USDC);
        assertEq(window, 24 hours);
        assertTrue(active);
        assertEq(vault.totalListings(), 1);
    }

    function test_ListMultipleData() public {
        string[] memory tags = new string[](0);
        
        vm.startPrank(patient1);
        vault.listData("hash1", "meta1", GenomeVault.DataCategory.WholeGenome, PRICE_10_USDC, 24 hours, tags);
        vault.listData("hash2", "meta2", GenomeVault.DataCategory.Microbiome, PRICE_100_USDC, 48 hours, tags);
        vm.stopPrank();

        assertEq(vault.totalListings(), 2);
        
        uint256[] memory ids = vault.getOwnerListingIds(patient1);
        assertEq(ids.length, 2);
    }

    function test_RevertListDataZeroPrice() public {
        string[] memory tags = new string[](0);
        vm.prank(patient1);
        vm.expectRevert(GenomeVault.InvalidPrice.selector);
        vault.listData("hash", "meta", GenomeVault.DataCategory.WholeGenome, 0, 24 hours, tags);
    }

    function test_RevertListDataShortWindow() public {
        string[] memory tags = new string[](0);
        vm.prank(patient1);
        vm.expectRevert(GenomeVault.InvalidAccessWindow.selector);
        vault.listData("hash", "meta", GenomeVault.DataCategory.WholeGenome, PRICE_10_USDC, 30 minutes, tags);
    }

    function test_UpdateListing() public {
        string[] memory tags = new string[](0);
        vm.prank(patient1);
        vault.listData("hash", "meta", GenomeVault.DataCategory.WholeGenome, PRICE_10_USDC, 24 hours, tags);

        vm.prank(patient1);
        vault.updateListing(1, PRICE_100_USDC, true);

        (,,,, uint256 price,,,,, ) = vault.getListing(1);
        assertEq(price, PRICE_100_USDC);
    }

    function test_RevertUpdateNotOwner() public {
        string[] memory tags = new string[](0);
        vm.prank(patient1);
        vault.listData("hash", "meta", GenomeVault.DataCategory.WholeGenome, PRICE_10_USDC, 24 hours, tags);

        vm.prank(patient2);
        vm.expectRevert(GenomeVault.NotListingOwner.selector);
        vault.updateListing(1, PRICE_100_USDC, true);
    }

    function test_DeactivateListing() public {
        string[] memory tags = new string[](0);
        vm.prank(patient1);
        vault.listData("hash", "meta", GenomeVault.DataCategory.WholeGenome, PRICE_10_USDC, 24 hours, tags);

        vm.prank(patient1);
        vault.updateListing(1, PRICE_10_USDC, false);

        (,,,,,,,, bool active,) = vault.getListing(1);
        assertFalse(active);
    }

    // --- Purchase Tests ---

    function test_PurchaseAccess() public {
        // Patient lists data
        string[] memory tags = new string[](0);
        vm.prank(patient1);
        vault.listData("hash", "meta", GenomeVault.DataCategory.WholeGenome, PRICE_10_USDC, 24 hours, tags);

        // Researcher purchases
        uint256 balanceBefore = usdc.balanceOf(patient1);
        vm.prank(researcher1);
        uint256 accessId = vault.purchaseAccess(1, 5); // 5 queries

        assertEq(accessId, 1);
        
        // Check payment: 50 USDC total, 2.5% fee = 1.25 USDC
        uint256 totalCost = PRICE_10_USDC * 5;
        uint256 fee = (totalCost * 250) / 10000;
        assertEq(usdc.balanceOf(patient1), balanceBefore + totalCost - fee);
        assertEq(usdc.balanceOf(feeRecipient), fee);

        // Check access grant
        (uint256 lid, address res,,,,,,, uint256 maxQ) = vault.getAccessGrant(1);
        assertEq(lid, 1);
        assertEq(res, researcher1);
        assertEq(maxQ, 5);
    }

    function test_PurchaseAccessNative() public {
        string[] memory tags = new string[](0);
        vm.prank(patient1);
        vault.listData("hash", "meta", GenomeVault.DataCategory.WholeGenome, 1 ether, 24 hours, tags);

        vm.deal(researcher1, 10 ether);
        uint256 patientBefore = patient1.balance;
        
        vm.prank(researcher1);
        vault.purchaseAccessNative{value: 3 ether}(1, 3); // 3 queries × 1 ETH

        uint256 totalCost = 3 ether;
        uint256 fee = (totalCost * 250) / 10000;
        assertEq(patient1.balance, patientBefore + totalCost - fee);
    }

    function test_RevertPurchaseInactiveListing() public {
        string[] memory tags = new string[](0);
        vm.prank(patient1);
        vault.listData("hash", "meta", GenomeVault.DataCategory.WholeGenome, PRICE_10_USDC, 24 hours, tags);
        
        vm.prank(patient1);
        vault.updateListing(1, PRICE_10_USDC, false);

        vm.prank(researcher1);
        vm.expectRevert(GenomeVault.ListingNotActive.selector);
        vault.purchaseAccess(1, 1);
    }

    function test_RevertPurchaseRevokedConsent() public {
        string[] memory tags = new string[](0);
        vm.prank(patient1);
        vault.listData("hash", "meta", GenomeVault.DataCategory.WholeGenome, PRICE_10_USDC, 24 hours, tags);

        vm.prank(patient1);
        vault.revokeConsent(1, researcher1);

        vm.prank(researcher1);
        vm.expectRevert(GenomeVault.NotAuthorized.selector);
        vault.purchaseAccess(1, 1);
    }

    // --- Anonymization Tests ---

    function test_FulfillAnonymization() public {
        string[] memory tags = new string[](0);
        vm.prank(patient1);
        vault.listData("hash", "meta", GenomeVault.DataCategory.WholeGenome, PRICE_10_USDC, 24 hours, tags);

        vm.prank(researcher1);
        vault.purchaseAccess(1, 1);

        // Anonymizer fulfills
        vm.prank(anonymizer);
        vault.fulfillAnonymization(1, "QmAnonymizedDataHash789");

        (,,,,, GenomeVault.AccessStatus status, string memory anonHash,,) = vault.getAccessGrant(1);
        assertEq(uint(status), uint(GenomeVault.AccessStatus.Active));
        assertEq(anonHash, "QmAnonymizedDataHash789");
    }

    function test_RevertAnonymizeNotRole() public {
        string[] memory tags = new string[](0);
        vm.prank(patient1);
        vault.listData("hash", "meta", GenomeVault.DataCategory.WholeGenome, PRICE_10_USDC, 24 hours, tags);

        vm.prank(researcher1);
        vault.purchaseAccess(1, 1);

        vm.prank(researcher1); // Not anonymizer
        vm.expectRevert();
        vault.fulfillAnonymization(1, "QmFakeHash");
    }

    // --- Consent Tests ---

    function test_RevokeConsent() public {
        string[] memory tags = new string[](0);
        vm.prank(patient1);
        vault.listData("hash", "meta", GenomeVault.DataCategory.WholeGenome, PRICE_10_USDC, 24 hours, tags);

        vm.prank(researcher1);
        vault.purchaseAccess(1, 1);

        vm.prank(anonymizer);
        vault.fulfillAnonymization(1, "QmAnon");

        // Patient revokes consent
        vm.prank(patient1);
        vault.revokeConsent(1, researcher1);

        assertTrue(vault.consentRevoked(1, researcher1));

        // Access should be revoked
        (,,,,, GenomeVault.AccessStatus status,,,) = vault.getAccessGrant(1);
        assertEq(uint(status), uint(GenomeVault.AccessStatus.Revoked));
    }

    // --- Access Expiration ---

    function test_ExpireAccess() public {
        string[] memory tags = new string[](0);
        vm.prank(patient1);
        vault.listData("hash", "meta", GenomeVault.DataCategory.WholeGenome, PRICE_10_USDC, 1 hours, tags);

        vm.prank(researcher1);
        vault.purchaseAccess(1, 1);

        vm.prank(anonymizer);
        vault.fulfillAnonymization(1, "QmAnon");

        // Fast forward past expiry
        vm.warp(block.timestamp + 2 hours);

        vault.expireAccess(1);

        (,,,,, GenomeVault.AccessStatus status,,,) = vault.getAccessGrant(1);
        assertEq(uint(status), uint(GenomeVault.AccessStatus.Expired));
    }

    function test_IsAccessValid() public {
        string[] memory tags = new string[](0);
        vm.prank(patient1);
        vault.listData("hash", "meta", GenomeVault.DataCategory.WholeGenome, PRICE_10_USDC, 24 hours, tags);

        vm.prank(researcher1);
        vault.purchaseAccess(1, 1);

        // Not valid yet (pending anonymization)
        assertFalse(vault.isAccessValid(1));

        vm.prank(anonymizer);
        vault.fulfillAnonymization(1, "QmAnon");

        // Now valid
        assertTrue(vault.isAccessValid(1));

        // After expiry
        vm.warp(block.timestamp + 25 hours);
        assertFalse(vault.isAccessValid(1));
    }

    // --- Stats Tests ---

    function test_StatsTracking() public {
        string[] memory tags = new string[](0);
        vm.prank(patient1);
        vault.listData("hash", "meta", GenomeVault.DataCategory.WholeGenome, PRICE_10_USDC, 24 hours, tags);

        vm.prank(researcher1);
        vault.purchaseAccess(1, 5);

        assertEq(vault.totalQueriesSold(), 5);
        assertEq(vault.totalVolumeUSD(), PRICE_10_USDC * 5);
        
        uint256 totalCost = PRICE_10_USDC * 5;
        uint256 fee = (totalCost * 250) / 10000;
        assertEq(vault.totalPayoutToPatients(), totalCost - fee);
    }

    // --- Researcher Profile ---

    function test_RegisterResearcher() public {
        vm.prank(researcher1);
        vault.registerResearcher("MIT", "Cancer genomics research");

        (string memory inst, string memory purpose, bool verified,,) = vault.researchers(researcher1);
        assertEq(inst, "MIT");
        assertEq(purpose, "Cancer genomics research");
        assertFalse(verified);
    }

    function test_VerifyResearcher() public {
        vm.prank(admin);
        vault.verifyResearcher(researcher1, "MIT");

        (,, bool verified,,) = vault.researchers(researcher1);
        assertTrue(verified);
    }

    // --- Admin ---

    function test_SetPlatformFee() public {
        vm.prank(admin);
        vault.setPlatformFee(500); // 5%
        assertEq(vault.platformFeeBps(), 500);
    }

    function test_RevertFeeTooHigh() public {
        vm.prank(admin);
        vm.expectRevert("Fee too high");
        vault.setPlatformFee(1001); // >10%
    }

    // --- Tags ---

    function test_ListingTags() public {
        string[] memory tags = new string[](3);
        tags[0] = "diabetes";
        tags[1] = "european";
        tags[2] = "age:30-40";

        vm.prank(patient1);
        vault.listData("hash", "meta", GenomeVault.DataCategory.WholeGenome, PRICE_10_USDC, 24 hours, tags);

        string[] memory storedTags = vault.getListingTags(1);
        assertEq(storedTags.length, 3);
        assertEq(storedTags[0], "diabetes");
        assertEq(storedTags[2], "age:30-40");
    }

    // --- Data Categories ---

    function test_AllCategories() public {
        string[] memory tags = new string[](0);
        vm.startPrank(patient1);
        
        vault.listData("h1", "m1", GenomeVault.DataCategory.WholeGenome, PRICE_10_USDC, 1 hours, tags);
        vault.listData("h2", "m2", GenomeVault.DataCategory.Exome, PRICE_10_USDC, 1 hours, tags);
        vault.listData("h3", "m3", GenomeVault.DataCategory.SNPArray, PRICE_10_USDC, 1 hours, tags);
        vault.listData("h4", "m4", GenomeVault.DataCategory.Microbiome, PRICE_10_USDC, 1 hours, tags);
        vault.listData("h5", "m5", GenomeVault.DataCategory.Epigenetic, PRICE_10_USDC, 1 hours, tags);
        vault.listData("h6", "m6", GenomeVault.DataCategory.Proteomic, PRICE_10_USDC, 1 hours, tags);
        vault.listData("h7", "m7", GenomeVault.DataCategory.Metabolomic, PRICE_10_USDC, 1 hours, tags);
        vault.listData("h8", "m8", GenomeVault.DataCategory.ClinicalTrial, PRICE_10_USDC, 1 hours, tags);
        vault.listData("h9", "m9", GenomeVault.DataCategory.EHR, PRICE_10_USDC, 1 hours, tags);
        vault.listData("h10", "m10", GenomeVault.DataCategory.Imaging, PRICE_10_USDC, 1 hours, tags);
        vault.listData("h11", "m11", GenomeVault.DataCategory.Other, PRICE_10_USDC, 1 hours, tags);
        
        vm.stopPrank();
        assertEq(vault.totalListings(), 11);
    }
}
