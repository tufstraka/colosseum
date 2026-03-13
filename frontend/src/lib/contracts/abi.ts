export const VAULTSTONE_INVOICE_ABI = [
  {
    inputs: [
      { internalType: "string", name: "name", type: "string" },
      { internalType: "string", name: "symbol", type: "string" },
      { internalType: "address", name: "admin", type: "address" },
      { internalType: "address", name: "feeRecipient", type: "address" },
      { internalType: "uint256", name: "initialFee", type: "uint256" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "InsufficientPayment",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidAmount",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidDueDate",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidFeeRecipient",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidPlatformFee",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidRecipient",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidSplits",
    type: "error",
  },
  {
    inputs: [],
    name: "InvoiceNotFound",
    type: "error",
  },
  {
    inputs: [],
    name: "InvoiceNotPending",
    type: "error",
  },
  {
    inputs: [],
    name: "NotInvoiceCreator",
    type: "error",
  },
  {
    inputs: [],
    name: "SplitsTotalInvalid",
    type: "error",
  },
  {
    inputs: [],
    name: "TooManySplits",
    type: "error",
  },
  {
    inputs: [],
    name: "TransferFailed",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "invoiceId", type: "uint256" },
      { indexed: true, internalType: "address", name: "creator", type: "address" },
      { indexed: true, internalType: "address", name: "recipient", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
      { indexed: false, internalType: "address", name: "currency", type: "address" },
      { indexed: false, internalType: "uint256", name: "dueDate", type: "uint256" },
    ],
    name: "InvoiceCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "invoiceId", type: "uint256" },
      { indexed: true, internalType: "address", name: "payer", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "paidAt", type: "uint256" },
    ],
    name: "InvoicePaid",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "invoiceId", type: "uint256" },
      { indexed: true, internalType: "address", name: "canceller", type: "address" },
    ],
    name: "InvoiceCancelled",
    type: "event",
  },
  {
    inputs: [
      { internalType: "address", name: "recipient", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "address", name: "currency", type: "address" },
      { internalType: "uint256", name: "dueDate", type: "uint256" },
      { internalType: "string", name: "metadataURI", type: "string" },
      {
        components: [
          { internalType: "address", name: "payee", type: "address" },
          { internalType: "uint256", name: "shares", type: "uint256" },
        ],
        internalType: "struct VaultstoneInvoice.PaymentSplit[]",
        name: "splits",
        type: "tuple[]",
      },
    ],
    name: "createInvoice",
    outputs: [{ internalType: "uint256", name: "invoiceId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "invoiceId", type: "uint256" }],
    name: "payInvoice",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "invoiceId", type: "uint256" }],
    name: "payInvoiceWithToken",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "invoiceId", type: "uint256" }],
    name: "cancelInvoice",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "invoiceId", type: "uint256" }],
    name: "getInvoice",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "id", type: "uint256" },
          { internalType: "address", name: "creator", type: "address" },
          { internalType: "address", name: "recipient", type: "address" },
          { internalType: "uint256", name: "amount", type: "uint256" },
          { internalType: "address", name: "currency", type: "address" },
          { internalType: "uint256", name: "dueDate", type: "uint256" },
          { internalType: "uint256", name: "createdAt", type: "uint256" },
          { internalType: "uint256", name: "paidAt", type: "uint256" },
          { internalType: "uint8", name: "status", type: "uint8" },
          {
            components: [
              { internalType: "address", name: "payee", type: "address" },
              { internalType: "uint256", name: "shares", type: "uint256" },
            ],
            internalType: "struct VaultstoneInvoice.PaymentSplit[]",
            name: "splits",
            type: "tuple[]",
          },
        ],
        internalType: "struct VaultstoneInvoice.Invoice",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "creator", type: "address" }],
    name: "getInvoicesByCreator",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "recipient", type: "address" }],
    name: "getInvoicesByRecipient",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "invoiceId", type: "uint256" }],
    name: "calculatePaymentAmount",
    outputs: [
      { internalType: "uint256", name: "total", type: "uint256" },
      { internalType: "uint256", name: "fee", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "invoiceId", type: "uint256" }],
    name: "isOverdue",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "platformFee",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "platformFeeRecipient",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Contract addresses - update after deployment
export const CONTRACT_ADDRESSES = {
  polkadotHubTestnet: "0x0000000000000000000000000000000000000000" as `0x${string}`,
} as const;
