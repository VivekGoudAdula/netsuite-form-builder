import type { TransactionType } from '../types';

export interface TransactionMeta {
  /** Stored transaction type (snake_case, used in API/DB). */
  code: TransactionType;
  /** Uppercase ERP code for display and integrations. */
  apiCode: string;
  name: string;
  slug: string;
  cataloguePath: string;
  statLabels?: {
    total: string;
    pending: string;
    approved: string;
    rejected: string;
    drafts?: string;
  };
}

export const TRANSACTION_REGISTRY: Record<TransactionType, TransactionMeta> = {
  purchase_order: {
    code: 'purchase_order',
    apiCode: 'PURCHASE_ORDER',
    name: 'Purchase Order',
    slug: 'po',
    cataloguePath: 'purchase-order',
  },
  sales_order: {
    code: 'sales_order',
    apiCode: 'SALES_ORDER',
    name: 'Sales Order',
    slug: 'so',
    cataloguePath: 'sales-order',
  },
  accounts_payable: {
    code: 'accounts_payable',
    apiCode: 'ACCOUNTS_PAYABLE',
    name: 'Accounts Payable',
    slug: 'ap',
    cataloguePath: 'ap',
  },
  accounts_receivable: {
    code: 'accounts_receivable',
    apiCode: 'ACCOUNTS_RECEIVABLE',
    name: 'Accounts Receivable',
    slug: 'ar',
    cataloguePath: 'ar',
  },
  item_receipt: {
    code: 'item_receipt',
    apiCode: 'ITEM_RECEIPT',
    name: 'Item Receipt',
    slug: 'ir',
    cataloguePath: 'item-receipt',
  },
  vendor_bill: {
    code: 'vendor_bill',
    apiCode: 'VENDOR_BILL',
    name: 'Vendor Bill',
    slug: 'vb',
    cataloguePath: 'vendor-bill',
    statLabels: {
      total: 'Total Bills',
      pending: 'Pending Approval',
      approved: 'Approved',
      rejected: 'Rejected',
      drafts: 'Drafts',
    },
  },
};

export function slugToTransactionType(slug: string | undefined): TransactionType {
  const entry = Object.values(TRANSACTION_REGISTRY).find(m => m.slug === slug);
  return entry?.code ?? 'purchase_order';
}

export function transactionTypeToSlug(type: TransactionType): string {
  return TRANSACTION_REGISTRY[type]?.slug ?? 'po';
}

export function cataloguePathToTransactionType(path: string | undefined): TransactionType {
  const entry = Object.values(TRANSACTION_REGISTRY).find(m => m.cataloguePath === path);
  return entry?.code ?? 'purchase_order';
}
