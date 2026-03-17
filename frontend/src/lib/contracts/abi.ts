export const VAULTSTONE_INVOICE_ABI = [
  // ... (keeping existing ABI)
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
    name: "NotInvoiceRecipient",
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
    inputs: [],
    name: "ParachainNotSupported",
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
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "invoiceId", type: "uint256" },
      { indexed: true, internalType: "address", name: "disputer", type: "address" },
      { indexed: false, internalType: "string", name: "reason", type: "string" },
    ],
    name: "InvoiceDisputed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "invoiceId", type: "uint256" },
      { indexed: true, internalType: "uint32", name: "sourceParachain", type: "uint32" },
      { indexed: true, internalType: "address", name: "payer", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
      { indexed: false, internalType: "bytes32", name: "xcmMessageId", type: "bytes32" },
    ],
    name: "CrossChainPaymentInitiated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "invoiceId", type: "uint256" },
      { indexed: true, internalType: "uint32", name: "sourceParachain", type: "uint32" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "CrossChainPaymentReceived",
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
    inputs: [
      { internalType: "uint256", name: "invoiceId", type: "uint256" },
      { internalType: "uint32", name: "sourceParachain", type: "uint32" },
    ],
    name: "initiateCrossChainPayment",
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
    inputs: [
      { internalType: "uint256", name: "invoiceId", type: "uint256" },
      { internalType: "string", name: "reason", type: "string" },
    ],
    name: "disputeInvoice",
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
    name: "getSupportedParachains",
    outputs: [{ internalType: "uint32[]", name: "parachainIds", type: "uint32[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "invoiceId", type: "uint256" }],
    name: "getCrossChainPaymentStatus",
    outputs: [
      {
        components: [
          { internalType: "uint32", name: "sourceParachain", type: "uint32" },
          { internalType: "bytes32", name: "xcmMessageId", type: "bytes32" },
          { internalType: "uint256", name: "amount", type: "uint256" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
          { internalType: "bool", name: "completed", type: "bool" },
        ],
        internalType: "struct VaultstoneInvoice.CrossChainPayment",
        name: "",
        type: "tuple",
      },
    ],
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
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "ownerOf",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "tokenURI",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Contract addresses per chain
export const CONTRACT_ADDRESSES: Record<number, `0x${string}`> = {
  // Polkadot Hub TestNet - DEPLOYED with XCM support
  420420417: "0xa73fb25e9222623893b4Be283F7e7837E5bbE3B2" as `0x${string}`,
  // Polkadot Hub Mainnet - TO BE DEPLOYED
  420420419: "0x0000000000000000000000000000000000000000" as `0x${string}`,
  // Sepolia testnet
  11155111: "0x0000000000000000000000000000000000000000" as `0x${string}`,
  // Localhost (Anvil)
  31337: "0x5FbDB2315678afecb367f032d93F642f64180aa3" as `0x${string}`,
} as const;

// Helper to get contract address for current chain
export function getContractAddress(chainId: number): `0x${string}` {
  return CONTRACT_ADDRESSES[chainId] || CONTRACT_ADDRESSES[31337];
}
