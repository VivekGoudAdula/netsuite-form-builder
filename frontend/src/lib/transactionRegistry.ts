import type { LucideIcon } from 'lucide-react';
import {
  ShoppingBag,
  TrendingUp,
  CreditCard,
  ArrowUpRight,
  PackageCheck,
  FileStack,
} from 'lucide-react';
import type { TransactionType } from '../types';

export interface TransactionMeta {
  /** Stored transaction type (snake_case, used in API/DB). */
  code: TransactionType;
  /** Uppercase ERP code for display and integrations. */
  apiCode: string;
  name: string;
  /** Sidebar label for employee navigation. */
  navLabel: string;
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

export const TRANSACTION_ORDER: TransactionType[] = [
  'purchase_order',
  'sales_order',
  'accounts_payable',
  'accounts_receivable',
  'item_receipt',
  'vendor_bill',
];

export const TRANSACTION_ICONS: Record<TransactionType, LucideIcon> = {
  purchase_order: ShoppingBag,
  sales_order: TrendingUp,
  accounts_payable: CreditCard,
  accounts_receivable: ArrowUpRight,
  item_receipt: PackageCheck,
  vendor_bill: FileStack,
};

export const TRANSACTION_REGISTRY: Record<TransactionType, TransactionMeta> = {
  purchase_order: {
    code: 'purchase_order',
    apiCode: 'PURCHASE_ORDER',
    name: 'Purchase Order',
    navLabel: 'Purchase Orders',
    slug: 'po',
    cataloguePath: 'purchase-order',
  },
  sales_order: {
    code: 'sales_order',
    apiCode: 'SALES_ORDER',
    name: 'Sales Order',
    navLabel: 'Sales Orders',
    slug: 'so',
    cataloguePath: 'sales-order',
  },
  accounts_payable: {
    code: 'accounts_payable',
    apiCode: 'ACCOUNTS_PAYABLE',
    name: 'Accounts Payable',
    navLabel: 'Accounts Payable',
    slug: 'ap',
    cataloguePath: 'ap',
  },
  accounts_receivable: {
    code: 'accounts_receivable',
    apiCode: 'ACCOUNTS_RECEIVABLE',
    name: 'Accounts Receivable',
    navLabel: 'Accounts Receivable',
    slug: 'ar',
    cataloguePath: 'ar',
  },
  item_receipt: {
    code: 'item_receipt',
    apiCode: 'ITEM_RECEIPT',
    name: 'Item Receipt',
    navLabel: 'Item Receipt',
    slug: 'ir',
    cataloguePath: 'item-receipt',
  },
  vendor_bill: {
    code: 'vendor_bill',
    apiCode: 'VENDOR_BILL',
    name: 'Vendor Bill',
    navLabel: 'Vendor Bills',
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

export interface TransactionNavItem {
  name: string;
  icon: LucideIcon;
  path: string;
}

/** Build sidebar nav items from forms assigned to the current user. */
export function getAssignedTransactionNavItems(
  assignedForms: { transactionType: TransactionType }[],
): TransactionNavItem[] {
  const assignedTypes = new Set(assignedForms.map(f => f.transactionType));

  return TRANSACTION_ORDER.filter(type => assignedTypes.has(type)).map(type => {
    const meta = TRANSACTION_REGISTRY[type];
    return {
      name: meta.navLabel,
      icon: TRANSACTION_ICONS[type],
      path: `/user/${meta.slug}`,
    };
  });
}
