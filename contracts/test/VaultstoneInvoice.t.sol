// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/VaultstoneInvoice.sol";

contract VaultstoneInvoiceTest is Test {
    VaultstoneInvoice public invoice;
    
    address public admin = address(1);
    address public feeRecipient = address(2);
    address public creator = address(3);
    address public recipient = address(4);
    address public payer = address(5);
    
    uint256 public constant PLATFORM_FEE = 100; // 1%
    uint256 public constant INVOICE_AMOUNT = 1 ether;
    
    event InvoiceCreated(
        uint256 indexed invoiceId,
        address indexed creator,
        address indexed recipient,
        uint256 amount,
        address currency,
        uint256 dueDate
    );
    
    event InvoicePaid(uint256 indexed invoiceId, address indexed payer, uint256 amount, uint256 paidAt);
    event InvoiceCancelled(uint256 indexed invoiceId, address indexed canceller);

    function setUp() public {
        invoice = new VaultstoneInvoice(
            "Vaultstone Invoice",
            "VINV",
            admin,
            feeRecipient,
            PLATFORM_FEE
        );
        
        // Fund accounts
        vm.deal(creator, 10 ether);
        vm.deal(recipient, 10 ether);
        vm.deal(payer, 10 ether);
    }

    // ============ Constructor Tests ============

    function test_Constructor() public view {
        assertEq(invoice.name(), "Vaultstone Invoice");
        assertEq(invoice.symbol(), "VINV");
        assertEq(invoice.platformFee(), PLATFORM_FEE);
        assertEq(invoice.platformFeeRecipient(), feeRecipient);
        assertTrue(invoice.hasRole(invoice.ADMIN_ROLE(), admin));
        assertTrue(invoice.hasRole(invoice.PAUSER_ROLE(), admin));
    }

    function test_Constructor_RevertInvalidAdmin() public {
        vm.expectRevert(VaultstoneInvoice.InvalidRecipient.selector);
        new VaultstoneInvoice("Test", "TST", address(0), feeRecipient, PLATFORM_FEE);
    }

    function test_Constructor_RevertInvalidFeeRecipient() public {
        vm.expectRevert(VaultstoneInvoice.InvalidFeeRecipient.selector);
        new VaultstoneInvoice("Test", "TST", admin, address(0), PLATFORM_FEE);
    }

    function test_Constructor_RevertInvalidFee() public {
        vm.expectRevert(VaultstoneInvoice.InvalidPlatformFee.selector);
        new VaultstoneInvoice("Test", "TST", admin, feeRecipient, 600); // > 5%
    }

    // ============ Create Invoice Tests ============

    function test_CreateInvoice() public {
        vm.startPrank(creator);
        
        VaultstoneInvoice.PaymentSplit[] memory splits = new VaultstoneInvoice.PaymentSplit[](0);
        
        uint256 dueDate = block.timestamp + 7 days;
        
        vm.expectEmit(true, true, true, true);
        emit InvoiceCreated(1, creator, recipient, INVOICE_AMOUNT, address(0), dueDate);
        
        uint256 invoiceId = invoice.createInvoice(
            recipient,
            INVOICE_AMOUNT,
            address(0),
            dueDate,
            "ipfs://metadata",
            splits
        );
        
        assertEq(invoiceId, 1);
        assertEq(invoice.ownerOf(1), creator);
        assertEq(invoice.tokenURI(1), "ipfs://metadata");
        
        VaultstoneInvoice.Invoice memory inv = invoice.getInvoice(1);
        assertEq(inv.creator, creator);
        assertEq(inv.recipient, recipient);
        assertEq(inv.amount, INVOICE_AMOUNT);
        assertEq(inv.currency, address(0));
        assertEq(inv.dueDate, dueDate);
        assertEq(uint256(inv.status), uint256(VaultstoneInvoice.InvoiceStatus.Pending));
        
        vm.stopPrank();
    }

    function test_CreateInvoice_WithSplits() public {
        vm.startPrank(creator);
        
        VaultstoneInvoice.PaymentSplit[] memory splits = new VaultstoneInvoice.PaymentSplit[](2);
        splits[0] = VaultstoneInvoice.PaymentSplit({ payee: creator, shares: 7000 }); // 70%
        splits[1] = VaultstoneInvoice.PaymentSplit({ payee: address(6), shares: 3000 }); // 30%
        
        uint256 invoiceId = invoice.createInvoice(
            recipient,
            INVOICE_AMOUNT,
            address(0),
            block.timestamp + 7 days,
            "ipfs://metadata",
            splits
        );
        
        VaultstoneInvoice.Invoice memory inv = invoice.getInvoice(invoiceId);
        assertEq(inv.splits.length, 2);
        assertEq(inv.splits[0].payee, creator);
        assertEq(inv.splits[0].shares, 7000);
        assertEq(inv.splits[1].payee, address(6));
        assertEq(inv.splits[1].shares, 3000);
        
        vm.stopPrank();
    }

    function test_CreateInvoice_RevertInvalidRecipient() public {
        vm.startPrank(creator);
        
        VaultstoneInvoice.PaymentSplit[] memory splits = new VaultstoneInvoice.PaymentSplit[](0);
        
        vm.expectRevert(VaultstoneInvoice.InvalidRecipient.selector);
        invoice.createInvoice(
            address(0),
            INVOICE_AMOUNT,
            address(0),
            block.timestamp + 7 days,
            "ipfs://metadata",
            splits
        );
        
        vm.stopPrank();
    }

    function test_CreateInvoice_RevertInvalidAmount() public {
        vm.startPrank(creator);
        
        VaultstoneInvoice.PaymentSplit[] memory splits = new VaultstoneInvoice.PaymentSplit[](0);
        
        vm.expectRevert(VaultstoneInvoice.InvalidAmount.selector);
        invoice.createInvoice(
            recipient,
            0,
            address(0),
            block.timestamp + 7 days,
            "ipfs://metadata",
            splits
        );
        
        vm.stopPrank();
    }

    function test_CreateInvoice_RevertInvalidDueDate() public {
        vm.startPrank(creator);
        
        VaultstoneInvoice.PaymentSplit[] memory splits = new VaultstoneInvoice.PaymentSplit[](0);
        
        vm.expectRevert(VaultstoneInvoice.InvalidDueDate.selector);
        invoice.createInvoice(
            recipient,
            INVOICE_AMOUNT,
            address(0),
            block.timestamp - 1,
            "ipfs://metadata",
            splits
        );
        
        vm.stopPrank();
    }

    function test_CreateInvoice_RevertInvalidSplitsTotal() public {
        vm.startPrank(creator);
        
        VaultstoneInvoice.PaymentSplit[] memory splits = new VaultstoneInvoice.PaymentSplit[](2);
        splits[0] = VaultstoneInvoice.PaymentSplit({ payee: creator, shares: 5000 });
        splits[1] = VaultstoneInvoice.PaymentSplit({ payee: address(6), shares: 4000 }); // Total 9000, not 10000
        
        vm.expectRevert(VaultstoneInvoice.SplitsTotalInvalid.selector);
        invoice.createInvoice(
            recipient,
            INVOICE_AMOUNT,
            address(0),
            block.timestamp + 7 days,
            "ipfs://metadata",
            splits
        );
        
        vm.stopPrank();
    }

    // ============ Pay Invoice Tests ============

    function test_PayInvoice() public {
        // Create invoice
        vm.prank(creator);
        VaultstoneInvoice.PaymentSplit[] memory splits = new VaultstoneInvoice.PaymentSplit[](0);
        uint256 invoiceId = invoice.createInvoice(
            recipient,
            INVOICE_AMOUNT,
            address(0),
            block.timestamp + 7 days,
            "ipfs://metadata",
            splits
        );
        
        // Calculate payment
        (uint256 totalPayment, uint256 fee) = invoice.calculatePaymentAmount(invoiceId);
        assertEq(fee, INVOICE_AMOUNT * PLATFORM_FEE / 10000); // 1% fee
        assertEq(totalPayment, INVOICE_AMOUNT + fee);
        
        // Record balances before
        uint256 creatorBalanceBefore = creator.balance;
        uint256 feeRecipientBalanceBefore = feeRecipient.balance;
        
        // Pay invoice
        vm.prank(payer);
        vm.expectEmit(true, true, false, true);
        emit InvoicePaid(invoiceId, payer, INVOICE_AMOUNT, block.timestamp);
        invoice.payInvoice{value: totalPayment}(invoiceId);
        
        // Verify status
        VaultstoneInvoice.Invoice memory inv = invoice.getInvoice(invoiceId);
        assertEq(uint256(inv.status), uint256(VaultstoneInvoice.InvoiceStatus.Paid));
        assertEq(inv.paidAt, block.timestamp);
        
        // Verify balances
        assertEq(creator.balance, creatorBalanceBefore + INVOICE_AMOUNT);
        assertEq(feeRecipient.balance, feeRecipientBalanceBefore + fee);
    }

    function test_PayInvoice_WithSplits() public {
        address payee2 = address(6);
        vm.deal(payee2, 0);
        
        // Create invoice with splits
        vm.prank(creator);
        VaultstoneInvoice.PaymentSplit[] memory splits = new VaultstoneInvoice.PaymentSplit[](2);
        splits[0] = VaultstoneInvoice.PaymentSplit({ payee: creator, shares: 7000 });
        splits[1] = VaultstoneInvoice.PaymentSplit({ payee: payee2, shares: 3000 });
        
        uint256 invoiceId = invoice.createInvoice(
            recipient,
            INVOICE_AMOUNT,
            address(0),
            block.timestamp + 7 days,
            "ipfs://metadata",
            splits
        );
        
        (uint256 totalPayment,) = invoice.calculatePaymentAmount(invoiceId);
        
        uint256 creatorBalanceBefore = creator.balance;
        
        // Pay invoice
        vm.prank(payer);
        invoice.payInvoice{value: totalPayment}(invoiceId);
        
        // Verify splits
        assertEq(creator.balance, creatorBalanceBefore + (INVOICE_AMOUNT * 7000 / 10000));
        assertEq(payee2.balance, INVOICE_AMOUNT * 3000 / 10000);
    }

    function test_PayInvoice_RevertInsufficientPayment() public {
        vm.prank(creator);
        VaultstoneInvoice.PaymentSplit[] memory splits = new VaultstoneInvoice.PaymentSplit[](0);
        uint256 invoiceId = invoice.createInvoice(
            recipient,
            INVOICE_AMOUNT,
            address(0),
            block.timestamp + 7 days,
            "ipfs://metadata",
            splits
        );
        
        vm.prank(payer);
        vm.expectRevert(VaultstoneInvoice.InsufficientPayment.selector);
        invoice.payInvoice{value: INVOICE_AMOUNT - 1}(invoiceId); // Missing fee
    }

    function test_PayInvoice_RevertAlreadyPaid() public {
        vm.prank(creator);
        VaultstoneInvoice.PaymentSplit[] memory splits = new VaultstoneInvoice.PaymentSplit[](0);
        uint256 invoiceId = invoice.createInvoice(
            recipient,
            INVOICE_AMOUNT,
            address(0),
            block.timestamp + 7 days,
            "ipfs://metadata",
            splits
        );
        
        (uint256 totalPayment,) = invoice.calculatePaymentAmount(invoiceId);
        
        vm.prank(payer);
        invoice.payInvoice{value: totalPayment}(invoiceId);
        
        vm.prank(payer);
        vm.expectRevert(VaultstoneInvoice.InvoiceNotPending.selector);
        invoice.payInvoice{value: totalPayment}(invoiceId);
    }

    // ============ Cancel Invoice Tests ============

    function test_CancelInvoice() public {
        vm.prank(creator);
        VaultstoneInvoice.PaymentSplit[] memory splits = new VaultstoneInvoice.PaymentSplit[](0);
        uint256 invoiceId = invoice.createInvoice(
            recipient,
            INVOICE_AMOUNT,
            address(0),
            block.timestamp + 7 days,
            "ipfs://metadata",
            splits
        );
        
        vm.prank(creator);
        vm.expectEmit(true, true, false, false);
        emit InvoiceCancelled(invoiceId, creator);
        invoice.cancelInvoice(invoiceId);
        
        VaultstoneInvoice.Invoice memory inv = invoice.getInvoice(invoiceId);
        assertEq(uint256(inv.status), uint256(VaultstoneInvoice.InvoiceStatus.Cancelled));
    }

    function test_CancelInvoice_RevertNotCreator() public {
        vm.prank(creator);
        VaultstoneInvoice.PaymentSplit[] memory splits = new VaultstoneInvoice.PaymentSplit[](0);
        uint256 invoiceId = invoice.createInvoice(
            recipient,
            INVOICE_AMOUNT,
            address(0),
            block.timestamp + 7 days,
            "ipfs://metadata",
            splits
        );
        
        vm.prank(recipient);
        vm.expectRevert(VaultstoneInvoice.NotInvoiceCreator.selector);
        invoice.cancelInvoice(invoiceId);
    }

    // ============ View Function Tests ============

    function test_GetInvoicesByCreator() public {
        vm.startPrank(creator);
        VaultstoneInvoice.PaymentSplit[] memory splits = new VaultstoneInvoice.PaymentSplit[](0);
        
        invoice.createInvoice(recipient, INVOICE_AMOUNT, address(0), block.timestamp + 7 days, "ipfs://1", splits);
        invoice.createInvoice(recipient, INVOICE_AMOUNT, address(0), block.timestamp + 7 days, "ipfs://2", splits);
        invoice.createInvoice(recipient, INVOICE_AMOUNT, address(0), block.timestamp + 7 days, "ipfs://3", splits);
        
        vm.stopPrank();
        
        uint256[] memory creatorInvoices = invoice.getInvoicesByCreator(creator);
        assertEq(creatorInvoices.length, 3);
        assertEq(creatorInvoices[0], 1);
        assertEq(creatorInvoices[1], 2);
        assertEq(creatorInvoices[2], 3);
    }

    function test_GetInvoicesByRecipient() public {
        vm.startPrank(creator);
        VaultstoneInvoice.PaymentSplit[] memory splits = new VaultstoneInvoice.PaymentSplit[](0);
        
        invoice.createInvoice(recipient, INVOICE_AMOUNT, address(0), block.timestamp + 7 days, "ipfs://1", splits);
        invoice.createInvoice(address(7), INVOICE_AMOUNT, address(0), block.timestamp + 7 days, "ipfs://2", splits);
        invoice.createInvoice(recipient, INVOICE_AMOUNT, address(0), block.timestamp + 7 days, "ipfs://3", splits);
        
        vm.stopPrank();
        
        uint256[] memory recipientInvoices = invoice.getInvoicesByRecipient(recipient);
        assertEq(recipientInvoices.length, 2);
        assertEq(recipientInvoices[0], 1);
        assertEq(recipientInvoices[1], 3);
    }

    function test_IsOverdue() public {
        vm.prank(creator);
        VaultstoneInvoice.PaymentSplit[] memory splits = new VaultstoneInvoice.PaymentSplit[](0);
        uint256 invoiceId = invoice.createInvoice(
            recipient,
            INVOICE_AMOUNT,
            address(0),
            block.timestamp + 1 days,
            "ipfs://metadata",
            splits
        );
        
        assertFalse(invoice.isOverdue(invoiceId));
        
        vm.warp(block.timestamp + 2 days);
        
        assertTrue(invoice.isOverdue(invoiceId));
    }

    // ============ Admin Function Tests ============

    function test_SetPlatformFee() public {
        vm.prank(admin);
        invoice.setPlatformFee(200); // 2%
        
        assertEq(invoice.platformFee(), 200);
    }

    function test_SetPlatformFee_RevertNotAdmin() public {
        vm.prank(creator);
        vm.expectRevert();
        invoice.setPlatformFee(200);
    }

    function test_SetPlatformFee_RevertTooHigh() public {
        vm.prank(admin);
        vm.expectRevert(VaultstoneInvoice.InvalidPlatformFee.selector);
        invoice.setPlatformFee(600); // > 5%
    }

    function test_Pause() public {
        vm.prank(admin);
        invoice.pause();
        
        assertTrue(invoice.paused());
        
        vm.prank(creator);
        VaultstoneInvoice.PaymentSplit[] memory splits = new VaultstoneInvoice.PaymentSplit[](0);
        vm.expectRevert();
        invoice.createInvoice(
            recipient,
            INVOICE_AMOUNT,
            address(0),
            block.timestamp + 7 days,
            "ipfs://metadata",
            splits
        );
    }

    function test_Unpause() public {
        vm.prank(admin);
        invoice.pause();
        
        vm.prank(admin);
        invoice.unpause();
        
        assertFalse(invoice.paused());
    }
}
