export enum InvoiceStatus {
  Pending = 0,
  Paid = 1,
  Cancelled = 2,
  Overdue = 3,
  Disputed = 4,
}

export interface PaymentSplit {
  payee: `0x${string}`;
  shares: bigint;
}

export interface Invoice {
  id: bigint;
  creator: `0x${string}`;
  recipient: `0x${string}`;
  amount: bigint;
  currency: `0x${string}`;
  dueDate: bigint;
  createdAt: bigint;
  paidAt: bigint;
  status: InvoiceStatus;
  splits: PaymentSplit[];
}

export interface InvoiceMetadata {
  title: string;
  description: string;
  items: InvoiceItem[];
  terms: string;
  notes: string;
  attachments: string[];
  creatorInfo: {
    name: string;
    email: string;
    address: string;
    taxId?: string;
  };
  recipientInfo: {
    name: string;
    email: string;
    address: string;
  };
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: string;
  total: string;
}

export interface CreateInvoiceParams {
  recipient: `0x${string}`;
  amount: bigint;
  currency: `0x${string}`;
  dueDate: bigint;
  metadataURI: string;
  splits: PaymentSplit[];
}
