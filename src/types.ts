/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type BrandType =
  | 'Apple'
  | 'Samsung'
  | 'Vivo'
  | 'Oppo'
  | 'Realme'
  | 'iQOO'
  | 'Xiaomi'
  | 'OnePlus'
  | 'Honor'
  | 'Nokia';

export type CategoryType = 'Keypad' | 'Low Range' | 'Mid Range' | 'Flagship';

export type IMEIStatus = 'In Stock' | 'Sold' | 'Returned' | 'Damaged' | 'Reserved';

export interface Product {
  id: string; // SKU or UUID
  name: string;
  brand: BrandType;
  category: CategoryType;
  ramRom: string; // e.g. "8GB/256GB"
  color: string;
  purchasePrice: number;
  sellingPrice: number;
}

export interface IMEIItem {
  imei: string;
  productId: string;
  status: IMEIStatus;
  branchId: string;
  supplierId: string;
  customerId?: string;
  createdAt: string;
  soldAt?: string;
  returnedAt?: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  vatNo?: string;
  address?: string;
  pendingDues: number;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  address?: string;
  type: 'Retail' | 'Wholesale';
  pendingAmount: number;
}

export interface PurchaseItem {
  productId: string;
  imei: string;
  purchaseRate: number;
  sellingRate: number;
}

export interface Purchase {
  id: string;
  invoiceNo: string;
  date: string;
  supplierId: string;
  branchId: string;
  items: PurchaseItem[];
  totalAmount: number;
  dueAmount: number;
}

export interface SaleItem {
  productId: string;
  productName: string;
  imei: string;
  price: number;
  vatPercent: number;
  taxPercent: number;
  discount: number;
  total: number;
}

export interface Sale {
  id: string;
  invoiceNo: string;
  date: string;
  customerId: string;
  branchId: string;
  items: SaleItem[];
  vatPercent: number;
  taxPercent: number;
  discountTotal: number;
  vatTotal: number;
  taxTotal: number;
  subTotal: number;
  finalAmount: number;
  paymentMethod: 'Cash' | 'Card';
  cardType?: 'Visa' | 'MasterCard' | 'American Express' | 'UnionPay' | 'Debit Card' | 'Credit Card';
  salesPerson: string;
  gifts?: string;
}

export interface ReturnRecord {
  id: string;
  type: 'Purchase Return' | 'Sales Return';
  imei: string;
  date: string;
  partyId: string; // Supplier ID or Customer ID
  partyName: string;
  amount: number;
  notes?: string;
}

export interface Branch {
  id: string;
  name: string;
  location: string;
  status: 'Active' | 'Inactive';
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'Admin' | 'Staff';
  branchId: string;
  joinedDate: string;
  password?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  username: string;
  module: string;
  action: 'Create' | 'Edit' | 'Delete' | 'Restore' | 'Stock Transfer';
  details: string;
  branchId: string;
}

export interface DeletedRecord {
  id: string;
  module: 'products' | 'purchases' | 'sales' | 'customers' | 'suppliers' | 'branches' | 'users' | 'returns' | 'expenses';
  originalData: any;
  deletedAt: string;
  deletedBy: string;
}

export interface Expense {
  id: string;
  voucherNo: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  branchId: string;
  paidBy: string;
}

export interface TaxSettings {
  vatPercent: number;
  taxPercent: number;
}

export interface SystemSettings {
  tax: TaxSettings;
  companyName: string;
  vatNo: string;
  address: string;
  phone: string;
  email: string;
  language: 'en' | 'ar';
  
  // Custom schema compatibility fields
  vatPercent: number;
  taxPercent: number;
  currencySymbol: string;
  shopName: string;
  shopPhone: string;
  shopTRN: string;
  shopAddress: string;
  shopEmail: string;
  warrantyNotice: string;
}
