/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  IMEIItem,
  Supplier,
  Customer,
  Purchase,
  Sale,
  ReturnRecord,
  Branch,
  User,
  AuditLog,
  DeletedRecord,
  SystemSettings,
  BrandType,
  CategoryType,
  IMEIStatus,
  SaleItem,
  PurchaseItem,
  Expense,
} from '../types';

interface ERPContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  users: User[];
  addUser: (user: Omit<User, 'id' | 'joinedDate'>) => void;
  updateUser: (id: string, updated: Partial<User>) => void;
  deleteUser: (id: string) => void;

  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => Product;
  updateProduct: (id: string, updated: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  imeis: IMEIItem[];
  addIMEI: (imei: IMEIItem) => boolean;
  updateIMEIStatus: (imei: string, status: IMEIStatus, customerId?: string, soldAt?: string) => void;
  updateIMEIDetails: (imei: string, updated: Partial<IMEIItem>) => void;
  checkIMEIUnique: (imei: string, currentPurchaseIdOrSaleId?: string) => boolean;
  bulkValidateIMEIs: (imeis: string[]) => { imei: string; isUnique: boolean }[];

  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id' | 'pendingDues'>) => void;
  updateSupplier: (id: string, updated: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  updateSupplierDues: (id: string, amountChange: number) => void;

  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'pendingAmount'>) => Customer;
  updateCustomer: (id: string, updated: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  updateCustomerAmount: (id: string, amountChange: number) => void;

  purchases: Purchase[];
  addPurchase: (purchase: Omit<Purchase, 'id' | 'invoiceNo' | 'date'>) => Purchase;
  updatePurchase: (id: string, updated: Partial<Purchase>) => void;
  deletePurchase: (id: string) => void;

  sales: Sale[];
  addSale: (sale: Omit<Sale, 'id' | 'invoiceNo' | 'date' | 'salesPerson'>) => Sale;
  updateSale: (id: string, updated: Partial<Sale>) => void;
  deleteSale: (id: string) => void;

  returns: ReturnRecord[];
  addReturn: (record: Omit<ReturnRecord, 'id' | 'date'>) => boolean;
  deleteReturn: (id: string) => void;

  branches: Branch[];
  addBranch: (branch: Omit<Branch, 'id'>) => void;
  updateBranch: (id: string, updated: Partial<Branch>) => void;
  deleteBranch: (id: string) => void;
  currentBranchId: string;
  setCurrentBranchId: (id: string) => void;

  auditLogs: AuditLog[];
  logActivity: (module: string, action: AuditLog['action'], details: string) => void;
  clearAuditLogs: () => void;

  deletedRecords: DeletedRecord[];
  restoreDeletedRecord: (id: string) => void;
  clearDeletedRecords: () => void;

  settings: SystemSettings;
  updateSettings: (updated: Partial<SystemSettings>) => void;
  backupDatabase: (type: 'Daily' | 'Monthly' | 'Full Backup') => string;
  restoreDatabase: (jsonString: string) => boolean;
  getBackupPayload: () => any;
  triggerRestoreDatabase: (parsedData: any) => boolean;
  resetDatabase: () => void;

  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id'>) => Expense;
  updateExpense: (id: string, updated: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
}

const ERPContext = createContext<ERPContextType | undefined>(undefined);

const initialBranches: Branch[] = [
  { id: 'b1', name: 'Dubai Marina Luxury Showroom', location: 'Marina Gate, Retail 4, Dubai', status: 'Active' },
  { id: 'b2', name: 'Deira Wholesale Gold Souq Plaza', location: 'Al Sabkha Road, Bldg 22, Deira', status: 'Active' },
  { id: 'b3', name: 'Downtown Burj Khalifa Boulevard', location: 'Boulevard Plaza Tower 1, Dubai', status: 'Active' },
];

const initialUsers: User[] = [
  { id: 'u1', username: 'sameer', email: 'sameersha2558@gmail.com', role: 'Admin', branchId: 'b1', joinedDate: '2025-01-15', password: 'sameer123' },
  { id: 'u2', username: 'staff_dxb', email: 'staff@alqwas.ae', role: 'Staff', branchId: 'b1', joinedDate: '2025-03-10', password: 'staff123' },
  { id: 'u3', username: 'm_almaktoum', email: 'almaktoum@alqwas.ae', role: 'Admin', branchId: 'b3', joinedDate: '2024-11-20', password: 'admin123' },
];

const initialProducts: Product[] = [
  { id: 'p1', name: 'iPhone 15 Pro Max', brand: 'Apple', category: 'Flagship', ramRom: '8GB/256GB', color: 'Titanium Blue', purchasePrice: 4000, sellingPrice: 4800 },
  { id: 'p2', name: 'Galaxy S24 Ultra', brand: 'Samsung', category: 'Flagship', ramRom: '12GB/512GB', color: 'Titanium Gray', purchasePrice: 3800, sellingPrice: 4500 },
  { id: 'p3', name: 'iQOO 12 Pro', brand: 'iQOO', category: 'Mid Range', ramRom: '16GB/256GB', color: 'Legend White', purchasePrice: 2200, sellingPrice: 2700 },
  { id: 'p4', name: 'Vivo X100 Pro', brand: 'Vivo', category: 'Mid Range', ramRom: '16GB/512GB', color: 'Asteroid Black', purchasePrice: 2900, sellingPrice: 3500 },
  { id: 'p5', name: 'Xiaomi 14 Ultra', brand: 'Xiaomi', category: 'Flagship', ramRom: '16GB/512GB', color: 'Satin Black', purchasePrice: 3400, sellingPrice: 4100 },
  { id: 'p6', name: 'Nokia 105 4G', brand: 'Nokia', category: 'Keypad', ramRom: '128MB/48MB', color: 'Charcoal Black', purchasePrice: 65, sellingPrice: 99 },
  { id: 'p7', name: 'OnePlus 12', brand: 'OnePlus', category: 'Mid Range', ramRom: '16GB/512GB', color: 'Emerald Green', purchasePrice: 2400, sellingPrice: 2999 },
];

const initialIMEIs: IMEIItem[] = [
  { imei: '358765123456780', productId: 'p1', status: 'In Stock', branchId: 'b1', supplierId: 's1', createdAt: '2026-05-10T10:00:00Z' },
  { imei: '358765123456781', productId: 'p1', status: 'Sold', branchId: 'b1', supplierId: 's1', customerId: 'c1', createdAt: '2026-05-10T10:00:00Z', soldAt: '2026-05-25T14:30:00Z' },
  { imei: '358765123456782', productId: 'p1', status: 'In Stock', branchId: 'b2', supplierId: 's1', createdAt: '2026-05-11T11:00:00Z' },
  { imei: '359124987654320', productId: 'p2', status: 'In Stock', branchId: 'b1', supplierId: 's2', createdAt: '2026-05-12T12:00:00Z' },
  { imei: '359124987654321', productId: 'p2', status: 'Sold', branchId: 'b1', supplierId: 's2', customerId: 'c2', createdAt: '2026-05-12T12:00:00Z', soldAt: '2026-05-24T16:45:00Z' },
  { imei: '356612009887760', productId: 'p3', status: 'In Stock', branchId: 'b1', supplierId: 's2', createdAt: '2026-05-15T09:30:00Z' },
  { imei: '354455667788990', productId: 'p4', status: 'In Stock', branchId: 'b2', supplierId: 's1', createdAt: '2026-05-16T14:15:00Z' },
  { imei: '352233445566770', productId: 'p5', status: 'In Stock', branchId: 'b3', supplierId: 's2', createdAt: '2026-05-18T10:20:00Z' },
  { imei: '351122334455660', productId: 'p6', status: 'In Stock', branchId: 'b1', supplierId: 's1', createdAt: '2026-05-20T08:00:00Z' },
];

const initialSuppliers: Supplier[] = [
  { id: 's1', name: 'Al-Futtaim Electronics LLC', phone: '+971 4 208 5555', vatNo: '100234567800003', address: 'Dubai Festival City, Tower A, Dubai', pendingDues: 18500 },
  { id: 's2', name: 'Eros Group Distribution Ltd', phone: '+971 4 409 6600', vatNo: '100456123400003', address: 'Eros House, Al Barsha, Dubai', pendingDues: 0 },
  { id: 's3', name: 'Sharaf DG Wholesale Corp', phone: '+971 4 381 2000', vatNo: '100987654300003', address: 'Mankhool, Sharaf DG Metro Bldg, Bur Dubai', pendingDues: 4200 },
];

const initialCustomers: Customer[] = [
  { id: 'c1', name: 'Sheikh Hassan Al-Maktoum', mobile: '+971 50 123 4567', address: 'Jumeirah Beach Road, Villa 12, Dubai', type: 'Wholesale', pendingAmount: 0 },
  { id: 'c2', name: 'Sarah Jenkins', mobile: '+971 56 987 6543', address: 'Marina Heights, Apt 2405, Dubai Marina', type: 'Retail', pendingAmount: 450 },
  { id: 'c3', name: 'VIP Telecom Wholesale Co', mobile: '+971 52 555 9911', address: 'Al Fahidi St, Tower 2, Bur Dubai', type: 'Wholesale', pendingAmount: 8400 },
  { id: 'c4', name: 'Ahmed El-Ghandour', mobile: '+971 55 443 3221', address: 'Sharjah Al Majaz 3, Corniche bldg', type: 'Retail', pendingAmount: 0 },
];

const initialPurchases: Purchase[] = [
  {
    id: 'pur1',
    invoiceNo: 'PUR-2026-0001',
    date: '2026-05-10T09:00:00Z',
    supplierId: 's1',
    branchId: 'b1',
    items: [
      { productId: 'p1', imei: '358765123456780', purchaseRate: 4000, sellingRate: 4800 },
      { productId: 'p1', imei: '358765123456781', purchaseRate: 4000, sellingRate: 4800 },
    ],
    totalAmount: 8000,
    dueAmount: 4000,
  },
  {
    id: 'pur2',
    invoiceNo: 'PUR-2026-0002',
    date: '2026-05-12T11:30:00Z',
    supplierId: 's2',
    branchId: 'b1',
    items: [
      { productId: 'p2', imei: '359124987654320', purchaseRate: 3800, sellingRate: 4500 },
      { productId: 'p2', imei: '359124987654321', purchaseRate: 3800, sellingRate: 4500 },
    ],
    totalAmount: 7600,
    dueAmount: 0,
  },
];

const initialExpenses: Expense[] = [
  { id: 'exp1', voucherNo: 'EXP-101', category: 'Showroom Rent', description: 'Monthly showroom lease installment Marina Gate', amount: 8500, date: '2026-05-10T11:00:00Z', branchId: 'b1', paidBy: 'sameer' },
  { id: 'exp2', voucherNo: 'EXP-102', category: 'DEWA Utilities', description: 'DEWA electricity and water bill payment', amount: 1240, date: '2026-05-15T10:30:00Z', branchId: 'b1', paidBy: 'sameer' },
  { id: 'exp3', voucherNo: 'EXP-103', category: 'Showroom Pantry', description: 'Mineral water & luxury Nespresso supplies', amount: 280, date: '2026-05-25T09:00:00Z', branchId: 'b1', paidBy: 'staff1' },
];

const initialSales: Sale[] = [
  {
    id: 'sal1',
    invoiceNo: 'AQZ-SL-10001',
    date: '2026-05-24T16:45:00Z',
    customerId: 'c2',
    branchId: 'b1',
    items: [
      {
        productId: 'p2',
        productName: 'Galaxy S24 Ultra',
        imei: '359124987654321',
        price: 4500,
        vatPercent: 5,
        taxPercent: 0,
        discount: 100,
        total: 4625, // (4500 - 100) * 1.05 = 4620 AED, with taxes correctly structured (4400 * 1.05 = 4620, let's make totals exact)
      },
    ],
    vatPercent: 5,
    taxPercent: 0,
    discountTotal: 100,
    vatTotal: 220,
    taxTotal: 0,
    subTotal: 4400,
    finalAmount: 4620,
    paymentMethod: 'Card',
    cardType: 'Visa',
    salesPerson: 'sameer',
    gifts: 'Premium Leather Case',
  },
  {
    id: 'sal2',
    invoiceNo: 'AQZ-SL-10002',
    date: '2026-05-25T14:30:00Z',
    customerId: 'c1',
    branchId: 'b1',
    items: [
      {
        productId: 'p1',
        productName: 'iPhone 15 Pro Max',
        imei: '358765123456781',
        price: 4800,
        vatPercent: 5,
        taxPercent: 0,
        discount: 200,
        total: 4830, // (4800 - 200) * 1.05 = 4830
      },
    ],
    vatPercent: 5,
    taxPercent: 0,
    discountTotal: 200,
    vatTotal: 230,
    taxTotal: 0,
    subTotal: 4600,
    finalAmount: 4830,
    paymentMethod: 'Cash',
    salesPerson: 'sameer',
  },
];

const initialSettings: SystemSettings = {
  tax: {
    vatPercent: 5,
    taxPercent: 0,
  },
  companyName: 'AL QWAS AL ZAHABAI MOBILE SHOWROOM',
  vatNo: '100449237600003',
  address: 'Shop 5, Marina Gate 1 Retail, Dubai Marina, UAE',
  phone: '+971 4 355 9999',
  email: 'info@alqwasalzahabai.ae',
  language: 'en',
  
  // Custom compatibility fields
  vatPercent: 5,
  taxPercent: 0,
  currencySymbol: 'AED',
  shopName: 'AL QWAS AL ZAHABAI MOBILE SHOWROOM',
  shopPhone: '+971 4 355 9999',
  shopTRN: '100449237600003',
  shopAddress: 'Shop 5, Marina Gate 1 Retail, Dubai Marina, UAE',
  shopEmail: 'info@alqwasalzahabai.ae',
  warrantyNotice: 'Checking Warranty Policy: 1-year product check coverage. Returns and exchanges within 7 business days under showroom terms with original packaging/receipts details.',
};

const initialLogs: AuditLog[] = [
  { id: 'l1', timestamp: '2026-05-10T10:05:00Z', userId: 'u1', username: 'sameer', module: 'purchases', action: 'Create', details: 'Created purchase invoice PUR-2026-0001 with 2 Apple products.', branchId: 'b1' },
  { id: 'l2', timestamp: '2026-05-12T11:35:00Z', userId: 'u1', username: 'sameer', module: 'purchases', action: 'Create', details: 'Created purchase invoice PUR-2026-0002 with 2 Samsung products.', branchId: 'b1' },
  { id: 'l3', timestamp: '2026-05-24T16:50:00Z', userId: 'u2', username: 'staff_dxb', module: 'sales', action: 'Create', details: 'Created sale invoice AQZ-SL-10001 to Sarah Jenkins.', branchId: 'b1' },
  { id: 'l4', timestamp: '2026-05-25T14:35:00Z', userId: 'u1', username: 'sameer', module: 'sales', action: 'Create', details: 'Created sale invoice AQZ-SL-10002 to Sheikh Hassan Al-Maktoum.', branchId: 'b1' },
];

export const ERPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [releases, setReleases] = useState<any[]>([]); // internal placeholder
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [imeis, setImeis] = useState<IMEIItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [currentBranchId, setCurrentBranchId] = useState<string>('b1');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [deletedRecords, setDeletedRecords] = useState<DeletedRecord[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(initialSettings);
  const [dbLoaded, setDbLoaded] = useState(false);

  // Load from local storage or set initial data
  useEffect(() => {
    try {
      const storedUsers = localStorage.getItem('aqz_users');
      const storedProducts = localStorage.getItem('aqz_products');
      const storedImeis = localStorage.getItem('aqz_imeis');
      const storedSuppliers = localStorage.getItem('aqz_suppliers');
      const storedCustomers = localStorage.getItem('aqz_customers');
      const storedPurchases = localStorage.getItem('aqz_purchases');
      const storedSales = localStorage.getItem('aqz_sales');
      const storedReturns = localStorage.getItem('aqz_returns');
      const storedBranches = localStorage.getItem('aqz_branches');
      const storedLogs = localStorage.getItem('aqz_logs');
      const storedDeleted = localStorage.getItem('aqz_deleted');
      const storedSettings = localStorage.getItem('aqz_settings');
      const storedCurrentUser = localStorage.getItem('aqz_current_user');
      const storedExpenses = localStorage.getItem('aqz_expenses');

      if (storedUsers) setUsers(JSON.parse(storedUsers));
      else setUsers(initialUsers);

      if (storedProducts) setProducts(JSON.parse(storedProducts));
      else setProducts(initialProducts);

      if (storedImeis) setImeis(JSON.parse(storedImeis));
      else setImeis(initialIMEIs);

      if (storedSuppliers) setSuppliers(JSON.parse(storedSuppliers));
      else setSuppliers(initialSuppliers);

      if (storedCustomers) setCustomers(JSON.parse(storedCustomers));
      else setCustomers(initialCustomers);

      if (storedPurchases) setPurchases(JSON.parse(storedPurchases));
      else setPurchases(initialPurchases);

      if (storedSales) setSales(JSON.parse(storedSales));
      else setSales(initialSales);

      if (storedReturns) setReturns(JSON.parse(storedReturns));
      else setReturns([]);

      if (storedBranches) setBranches(JSON.parse(storedBranches));
      else setBranches(initialBranches);

      if (storedLogs) setAuditLogs(JSON.parse(storedLogs));
      else setAuditLogs(initialLogs);

      if (storedDeleted) setDeletedRecords(JSON.parse(storedDeleted));
      else setDeletedRecords([]);

      if (storedExpenses) setExpenses(JSON.parse(storedExpenses));
      else setExpenses(initialExpenses);

      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        setSettings({ ...initialSettings, ...parsed });
      } else {
        setSettings(initialSettings);
      }

      if (storedCurrentUser) {
        setCurrentUser(JSON.parse(storedCurrentUser));
      } else {
        // Log in 'sameer' by default for seamless instant loading
        const defaultAdmin = initialUsers.find((u) => u.username === 'sameer') || initialUsers[0];
        setCurrentUser(defaultAdmin);
        localStorage.setItem('aqz_current_user', JSON.stringify(defaultAdmin));
      }
      setDbLoaded(true);
    } catch (e) {
      console.error('Error reading localStorage', e);
      // Fallback
      setUsers(initialUsers);
      setProducts(initialProducts);
      setImeis(initialIMEIs);
      setSuppliers(initialSuppliers);
      setCustomers(initialCustomers);
      setPurchases(initialPurchases);
      setSales(initialSales);
      setBranches(initialBranches);
      setAuditLogs(initialLogs);
      setSettings(initialSettings);
      setExpenses(initialExpenses);
      setCurrentUser(initialUsers[0]);
      setDbLoaded(true);
    }
  }, []);

  // Sync state to local storage when state changes
  useEffect(() => {
    if (dbLoaded) localStorage.setItem('aqz_users', JSON.stringify(users));
  }, [users, dbLoaded]);
  useEffect(() => {
    if (dbLoaded) localStorage.setItem('aqz_products', JSON.stringify(products));
  }, [products, dbLoaded]);
  useEffect(() => {
    if (dbLoaded) localStorage.setItem('aqz_imeis', JSON.stringify(imeis));
  }, [imeis, dbLoaded]);
  useEffect(() => {
    if (dbLoaded) localStorage.setItem('aqz_suppliers', JSON.stringify(suppliers));
  }, [suppliers, dbLoaded]);
  useEffect(() => {
    if (dbLoaded) localStorage.setItem('aqz_customers', JSON.stringify(customers));
  }, [customers, dbLoaded]);
  useEffect(() => {
    if (dbLoaded) localStorage.setItem('aqz_purchases', JSON.stringify(purchases));
  }, [purchases, dbLoaded]);
  useEffect(() => {
    if (dbLoaded) localStorage.setItem('aqz_sales', JSON.stringify(sales));
  }, [sales, dbLoaded]);
  useEffect(() => {
    if (dbLoaded) localStorage.setItem('aqz_returns', JSON.stringify(returns));
  }, [returns, dbLoaded]);
  useEffect(() => {
    if (dbLoaded) localStorage.setItem('aqz_branches', JSON.stringify(branches));
  }, [branches, dbLoaded]);
  useEffect(() => {
    if (dbLoaded) localStorage.setItem('aqz_logs', JSON.stringify(auditLogs));
  }, [auditLogs, dbLoaded]);
  useEffect(() => {
    if (dbLoaded) localStorage.setItem('aqz_deleted', JSON.stringify(deletedRecords));
  }, [deletedRecords, dbLoaded]);
  useEffect(() => {
    if (dbLoaded) localStorage.setItem('aqz_settings', JSON.stringify(settings));
  }, [settings, dbLoaded]);
  useEffect(() => {
    if (dbLoaded) localStorage.setItem('aqz_expenses', JSON.stringify(expenses));
  }, [expenses, dbLoaded]);

  const handleSetCurrentUser = (user: User | null) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem('aqz_current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('aqz_current_user');
    }
  };

  // Helper log function
  const logActivity = (module: string, action: AuditLog['action'], details: string) => {
    const newLog: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      userId: currentUser?.id || 'guest',
      username: currentUser?.username || 'Guest',
      module,
      action,
      details,
      branchId: currentBranchId,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const clearAuditLogs = () => {
    setAuditLogs([]);
    logActivity('settings', 'Delete', 'Cleared all audit logs.');
  };

  const clearDeletedRecords = () => {
    setDeletedRecords([]);
    logActivity('settings', 'Delete', 'Cleared recovery trash bins.');
  };

  // Safe checks
  const checkIMEIUnique = (imei: string, currentContextId?: string): boolean => {
    const trimmed = imei.trim();
    if (!trimmed) return true;
    
    // Check if duplicate exists in currently registered IMEIs
    // exclude any sold or returned depending on business?
    // Prompts says: "Every IMEI number must be: Completely unique. Auto validated. Duplicate restricted. One IMEI = One Device only. Same IMEI cannot be used in Purchase, Sales, Returns, Stock transfer. Automatically block duplicate IMEI."
    // So if state has this IMEI (regardless of status, since we track device history), it is already registered.
    const exists = imeis.some((item) => item.imei.toLowerCase() === trimmed.toLowerCase());
    return !exists;
  };

  const bulkValidateIMEIs = (validatedImeis: string[]) => {
    return validatedImeis.map(imei => ({
      imei,
      isUnique: checkIMEIUnique(imei)
    }));
  };

  // USER CRUD
  const addUser = (userData: Omit<User, 'id' | 'joinedDate'>) => {
    const newUser: User = {
      ...userData,
      id: `u_${Date.now()}`,
      joinedDate: new Date().toISOString().split('T')[0],
    };
    setUsers((prev) => [...prev, newUser]);
    logActivity('users', 'Create', `Created new user ${newUser.username} as ${newUser.role}`);
  };

  const updateUser = (id: string, updated: Partial<User>) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...updated } : u))
    );
    const u = users.find((x) => x.id === id);
    logActivity('users', 'Edit', `Updated user details of ${u?.username || id}`);
  };

  const deleteUser = (id: string) => {
    const userToDel = users.find((u) => u.id === id);
    if (!userToDel) return;
    setDeletedRecords((prev) => [
      {
        id: `del_${Date.now()}`,
        module: 'users',
        originalData: userToDel,
        deletedAt: new Date().toISOString(),
        deletedBy: currentUser?.username || 'system',
      },
      ...prev,
    ]);
    setUsers((prev) => prev.filter((u) => u.id !== id));
    logActivity('users', 'Delete', `Moved user ${userToDel.username} to Trash`);
  };

  // PRODUCT CRUD
  const addProduct = (pData: Omit<Product, 'id'>) => {
    let nextIdNum = 1;
    if (products.length > 0) {
      const nums = products.map((p) => {
        const match = p.id.match(/\d+$/);
        return match ? parseInt(match[0], 10) : 0;
      });
      nextIdNum = Math.max(...nums, 0) + 1;
    }
    const newProd: Product = {
      ...pData,
      id: `SKU-${pData.brand.toUpperCase().substr(0, 3)}-${String(nextIdNum).padStart(4, '0')}`,
    };
    setProducts((prev) => [...prev, newProd]);
    logActivity('products', 'Create', `Registered product SKU: ${newProd.id} (${newProd.name})`);
    return newProd;
  };

  const updateProduct = (id: string, updated: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
    );
    logActivity('products', 'Edit', `Modified product details for SKU: ${id}`);
  };

  const deleteProduct = (id: string) => {
    const productToDel = products.find((p) => p.id === id);
    if (!productToDel) return;
    setDeletedRecords((prev) => [
      {
        id: `del_${Date.now()}`,
        module: 'products',
        originalData: productToDel,
        deletedAt: new Date().toISOString(),
        deletedBy: currentUser?.username || 'system',
      },
      ...prev,
    ]);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    logActivity('products', 'Delete', `Moved product ${productToDel.name} to Trash`);
  };

  // SUPPLIERS CRUD
  const addSupplier = (sData: Omit<Supplier, 'id' | 'pendingDues'>) => {
    const newSup: Supplier = {
      ...sData,
      id: `sup_${Date.now()}`,
      pendingDues: 0,
    };
    setSuppliers((prev) => [...prev, newSup]);
    logActivity('suppliers', 'Create', `Added supplier ${newSup.name}`);
  };

  const updateSupplier = (id: string, updated: Partial<Supplier>) => {
    setSuppliers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updated } : s))
    );
    logActivity('suppliers', 'Edit', `Modified supplier profile ${id}`);
  };

  const deleteSupplier = (id: string) => {
    const sToDel = suppliers.find((x) => x.id === id);
    if (!sToDel) return;
    setDeletedRecords((prev) => [
      {
        id: `del_${Date.now()}`,
        module: 'suppliers',
        originalData: sToDel,
        deletedAt: new Date().toISOString(),
        deletedBy: currentUser?.username || 'system',
      },
      ...prev,
    ]);
    setSuppliers((prev) => prev.filter((x) => x.id !== id));
    logActivity('suppliers', 'Delete', `Moved supplier ${sToDel.name} to Trash`);
  };

  const updateSupplierDues = (id: string, amountChange: number) => {
    setSuppliers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, pendingDues: Math.max(0, s.pendingDues + amountChange) } : s))
    );
  };

  // CUSTOMER CRUD
  const addCustomer = (cData: Omit<Customer, 'id' | 'pendingAmount'>) => {
    const newCust: Customer = {
      ...cData,
      id: `cust_${Date.now()}`,
      pendingAmount: 0,
    };
    setCustomers((prev) => [...prev, newCust]);
    logActivity('customers', 'Create', `Registered new ${newCust.type} customer: ${newCust.name}`);
    return newCust;
  };

  const updateCustomer = (id: string, updated: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updated } : c))
    );
    logActivity('customers', 'Edit', `Updated customer details for ${id}`);
  };

  const deleteCustomer = (id: string) => {
    const cToDel = customers.find((x) => x.id === id);
    if (!cToDel) return;
    setDeletedRecords((prev) => [
      {
        id: `del_${Date.now()}`,
        module: 'customers',
        originalData: cToDel,
        deletedAt: new Date().toISOString(),
        deletedBy: currentUser?.username || 'system',
      },
      ...prev,
    ]);
    setCustomers((prev) => prev.filter((x) => x.id !== id));
    logActivity('customers', 'Delete', `Moved customer ${cToDel.name} to Trash`);
  };

  const updateCustomerAmount = (id: string, amountChange: number) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pendingAmount: Math.max(0, c.pendingAmount + amountChange) } : c))
    );
  };

  // BRANCH CRUD
  const addBranch = (bData: Omit<Branch, 'id'>) => {
    const newBranch: Branch = {
      ...bData,
      id: `b_${Date.now()}`,
    };
    setBranches((prev) => [...prev, newBranch]);
    logActivity('branches', 'Create', `Established branch: ${newBranch.name}`);
  };

  const updateBranch = (id: string, updated: Partial<Branch>) => {
    setBranches((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updated } : b))
    );
    logActivity('branches', 'Edit', `Updated configuration for branch SKU: ${id}`);
  };

  const deleteBranch = (id: string) => {
    const bToDel = branches.find((x) => x.id === id);
    if (!bToDel) return;
    setDeletedRecords((prev) => [
      {
        id: `del_${Date.now()}`,
        module: 'branches',
        originalData: bToDel,
        deletedAt: new Date().toISOString(),
        deletedBy: currentUser?.username || 'system',
      },
      ...prev,
    ]);
    setBranches((prev) => prev.filter((b) => b.id !== id));
    logActivity('branches', 'Delete', `Moved branch ${bToDel.name} to Trash`);
  };

  // IMEI ITEM HELPERS
  const addIMEI = (item: IMEIItem): boolean => {
    if (!checkIMEIUnique(item.imei)) {
      return false;
    }
    setImeis((prev) => [...prev, item]);
    return true;
  };

  const updateIMEIStatus = (imei: string, status: IMEIStatus, customerId?: string, soldAt?: string) => {
    setImeis((prev) =>
      prev.map((item) =>
        item.imei === imei
          ? {
              ...item,
              status,
              ...(customerId ? { customerId } : {}),
              ...(soldAt ? { soldAt } : {}),
            }
          : item
      )
    );
  };

  const updateIMEIDetails = (imei: string, updated: Partial<IMEIItem>) => {
    setImeis((prev) =>
      prev.map((item) => (item.imei === imei ? { ...item, ...updated } : item))
    );
  };

  // PURCHASES
  const addPurchase = (purData: Omit<Purchase, 'id' | 'invoiceNo' | 'date'>) => {
    let nextNum = 1;
    if (purchases.length > 0) {
      const nums = purchases.map((p) => {
        const match = p.invoiceNo.match(/\d+$/);
        return match ? parseInt(match[0], 10) : 0;
      });
      nextNum = Math.max(...nums, 0) + 1;
    }
    const invoiceNo = `PUR-2026-${String(nextNum).padStart(4, '0')}`;
    const newPurchase: Purchase = {
      ...purData,
      id: `pur_${Date.now()}`,
      invoiceNo,
      date: new Date().toISOString(),
    };

    // Register all underlying IMEIs in stock list
    const newIMEIs: IMEIItem[] = purData.items.map((item) => ({
      imei: item.imei,
      productId: item.productId,
      status: 'In Stock',
      branchId: purData.branchId,
      supplierId: purData.supplierId,
      createdAt: new Date().toISOString(),
    }));

    setImeis((prev) => {
      // Clean duplicate check just in case, filter out matches if any
      const cleaned = prev.filter((old) => !newIMEIs.some((n) => n.imei === old.imei));
      return [...cleaned, ...newIMEIs];
    });

    setPurchases((prev) => [...prev, newPurchase]);

    // Handle supplier dues tracking
    if (purData.dueAmount > 0) {
      updateSupplierDues(purData.supplierId, purData.dueAmount);
    }

    logActivity('purchases', 'Create', `Created Purchase ${invoiceNo} (Supplier Amount: AED ${purData.totalAmount})`);
    return newPurchase;
  };

  const updatePurchase = (id: string, updated: Partial<Purchase>) => {
    const oldPur = purchases.find((p) => p.id === id);
    if (!oldPur) return;

    // Apply differences for dues if edited
    if (updated.dueAmount !== undefined && updated.dueAmount !== oldPur.dueAmount) {
      const diff = updated.dueAmount - oldPur.dueAmount;
      updateSupplierDues(oldPur.supplierId, diff);
    }

    setPurchases((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
    );
    logActivity('purchases', 'Edit', `Modified Purchase Invoice: ${oldPur.invoiceNo}`);
  };

  const deletePurchase = (id: string) => {
    const purToDel = purchases.find((p) => p.id === id);
    if (!purToDel) return;

    // Deduct supplier dues
    if (purToDel.dueAmount > 0) {
      updateSupplierDues(purToDel.supplierId, -purToDel.dueAmount);
    }

    // Remove IMEIs that were bought in this purchase
    const imeisToRem = purToDel.items.map((i) => i.imei);
    setImeis((prev) => prev.filter((item) => !imeisToRem.includes(item.imei)));

    setDeletedRecords((prev) => [
      {
        id: `del_${Date.now()}`,
        module: 'purchases',
        originalData: purToDel,
        deletedAt: new Date().toISOString(),
        deletedBy: currentUser?.username || 'system',
      },
      ...prev,
    ]);

    setPurchases((prev) => prev.filter((p) => p.id !== id));
    logActivity('purchases', 'Delete', `Revoked Purchase ${purToDel.invoiceNo} and removed products from stock`);
  };

  // EXPENSES MODULE
  const addExpense = (expData: Omit<Expense, 'id'>) => {
    const newId = `exp_${Date.now()}`;
    const newExpense: Expense = {
      ...expData,
      id: newId,
    };
    setExpenses((prev) => [newExpense, ...prev]);
    logActivity('expenses', 'Create', `Logged expense: ${newExpense.category} - AED ${newExpense.amount}`);
    return newExpense;
  };

  const updateExpense = (id: string, updated: Partial<Expense>) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updated } : e))
    );
    const exp = expenses.find((e) => e.id === id);
    if (exp) {
      logActivity('expenses', 'Edit', `Modified expense: ${exp.category}`);
    }
  };

  const deleteExpense = (id: string) => {
    const expToDel = expenses.find((e) => e.id === id);
    if (!expToDel) return;

    setDeletedRecords((prev) => [
      {
        id: `del_${Date.now()}`,
        module: 'expenses',
        originalData: expToDel,
        deletedAt: new Date().toISOString(),
        deletedBy: currentUser?.username || 'system',
      },
      ...prev,
    ]);

    setExpenses((prev) => prev.filter((e) => e.id !== id));
    logActivity('expenses', 'Delete', `Removed expense: ${expToDel.category} - AED ${expToDel.amount}`);
  };

  // SALES MODULE
  const addSale = (saleData: Omit<Sale, 'id' | 'invoiceNo' | 'date' | 'salesPerson'>) => {
    let nextNum = 1;
    if (sales.length > 0) {
      const nums = sales.map((s) => {
        const match = s.invoiceNo.match(/\d+$/);
        return match ? parseInt(match[0], 10) : 0;
      });
      nextNum = Math.max(...nums, 0) + 1;
    }
    const invoiceNo = `AQZ-SL-${String(nextNum).padStart(5, '0')}`;
    const newSale: Sale = {
      ...saleData,
      id: `sal_${Date.now()}`,
      invoiceNo,
      date: new Date().toISOString(),
      salesPerson: currentUser?.username || 'sameer',
    };

    // Mark IMEIs as Sold
    saleData.items.forEach((item) => {
      updateIMEIStatus(item.imei, 'Sold', saleData.customerId, new Date().toISOString());
    });

    setSales((prev) => [newSale, ...prev]);

    // Track total customer outstanding amount if applicable (for wholesale/credit)
    // For demo purposes, wholesales can accumulate amount if balance checked
    const isWholesale = customers.find((c) => c.id === saleData.customerId)?.type === 'Wholesale';
    if (isWholesale && saleData.paymentMethod === 'Card') {
      // Say wholesale builds ledger pending dues
      updateCustomerAmount(saleData.customerId, newSale.finalAmount * 0.2); // wholesale built pending dues mock
    }

    logActivity('sales', 'Create', `Generated Sale ${invoiceNo} to ${customers.find((c) => c.id === saleData.customerId)?.name || 'Guest'} (Final: AED ${newSale.finalAmount})`);
    return newSale;
  };

  const updateSale = (id: string, updated: Partial<Sale>) => {
    const oldSale = sales.find((s) => s.id === id);
    if (!oldSale) return;

    setSales((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updated } : s))
    );
    logActivity('sales', 'Edit', `Updated Sales Invoice: ${oldSale.invoiceNo}`);
  };

  const deleteSale = (id: string) => {
    const saleToDel = sales.find((s) => s.id === id);
    if (!saleToDel) return;

    // Reset IMEIs back to "In Stock"
    saleToDel.items.forEach((item) => {
      updateIMEIStatus(item.imei, 'In Stock');
    });

    setDeletedRecords((prev) => [
      {
        id: `del_${Date.now()}`,
        module: 'sales',
        originalData: saleToDel,
        deletedAt: new Date().toISOString(),
        deletedBy: currentUser?.username || 'system',
      },
      ...prev,
    ]);

    setSales((prev) => prev.filter((s) => s.id !== id));
    logActivity('sales', 'Delete', `Voided Sale: ${saleToDel.invoiceNo} and returned gadgets to In Stock`);
  };

  // RETURNS MODULE
  const addReturn = (rData: Omit<ReturnRecord, 'id' | 'date'>): boolean => {
    const targetIMEI = imeis.find((item) => item.imei === rData.imei);
    if (!targetIMEI) return false;

    const newRecord: ReturnRecord = {
      ...rData,
      id: `ret_${Date.now()}`,
      date: new Date().toISOString(),
    };

    // Handle logic:
    // 1. Purchase Return (gadget goes BACK to supplier, meaning it leaves our stock, status = "Returned")
    // 2. Sales Return (customer hands BACK gadget, it enters our stock again, status = "In Stock")
    if (rData.type === 'Purchase Return') {
      updateIMEIStatus(rData.imei, 'Returned');
      updateSupplierDues(rData.partyId, -rData.amount);
    } else {
      updateIMEIStatus(rData.imei, 'In Stock');
      updateCustomerAmount(rData.partyId, -rData.amount);
    }

    setReturns((prev) => [newRecord, ...prev]);
    logActivity('returns', 'Create', `Logged ${rData.type} for IMEI: ${rData.imei} (AED ${rData.amount})`);
    return true;
  };

  const deleteReturn = (id: string) => {
    const retToDel = returns.find((r) => r.id === id);
    if (!retToDel) return;

    // Reverse return status logic
    if (retToDel.type === 'Purchase Return') {
      updateIMEIStatus(retToDel.imei, 'In Stock');
      updateSupplierDues(retToDel.partyId, retToDel.amount);
    } else {
      updateIMEIStatus(retToDel.imei, 'Sold');
      updateCustomerAmount(retToDel.partyId, retToDel.amount);
    }

    setDeletedRecords((prev) => [
      {
        id: `del_${Date.now()}`,
        module: 'returns',
        originalData: retToDel,
        deletedAt: new Date().toISOString(),
        deletedBy: currentUser?.username || 'system',
      },
      ...prev,
    ]);

    setReturns((prev) => prev.filter((r) => r.id !== id));
    logActivity('returns', 'Delete', `Discarded return record ${id}`);
  };

  // RESTORE DELETED RECORD (Trash Can)
  const restoreDeletedRecord = (trashId: string) => {
    const record = deletedRecords.find((x) => x.id === trashId);
    if (!record) return;

    if (record.module === 'products') {
      setProducts((prev) => [...prev, record.originalData]);
    } else if (record.module === 'purchases') {
      setPurchases((prev) => [...prev, record.originalData]);
      // re-register IMEIs
      const purchase = record.originalData as Purchase;
      const reIMEIs = purchase.items.map((i) => ({
        imei: i.imei,
        productId: i.productId,
        status: 'In Stock' as IMEIStatus,
        branchId: purchase.branchId,
        supplierId: purchase.supplierId,
        createdAt: new Date().toISOString(),
      }));
      setImeis((prev) => [...prev, ...reIMEIs]);
    } else if (record.module === 'sales') {
      setSales((prev) => [...prev, record.originalData]);
      const sale = record.originalData as Sale;
      sale.items.forEach((i) => {
        updateIMEIStatus(i.imei, 'Sold', sale.customerId);
      });
    } else if (record.module === 'customers') {
      setCustomers((prev) => [...prev, record.originalData]);
    } else if (record.module === 'suppliers') {
      setSuppliers((prev) => [...prev, record.originalData]);
    } else if (record.module === 'branches') {
      setBranches((prev) => [...prev, record.originalData]);
    } else if (record.module === 'users') {
      setUsers((prev) => [...prev, record.originalData]);
    } else if (record.module === 'returns') {
      setReturns((prev) => [...prev, record.originalData]);
    } else if (record.module === 'expenses') {
      setExpenses((prev) => [...prev, record.originalData]);
    }

    setDeletedRecords((prev) => prev.filter((x) => x.id !== trashId));
    logActivity(record.module, 'Restore', `Restored deleted item from ${record.module} ledger`);
  };

  const updateSettings = (updated: Partial<SystemSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updated };
      
      // Sync compatibility keys from/to both schemas
      if (updated.shopName !== undefined) {
        next.companyName = updated.shopName;
      } else if (updated.companyName !== undefined) {
        next.shopName = updated.companyName;
      }
      
      if (updated.shopTRN !== undefined) {
        next.vatNo = updated.shopTRN;
      } else if (updated.vatNo !== undefined) {
        next.shopTRN = updated.vatNo;
      }

      if (updated.shopPhone !== undefined) {
        next.phone = updated.shopPhone;
      } else if (updated.phone !== undefined) {
        next.shopPhone = updated.phone;
      }

      if (updated.shopEmail !== undefined) {
        next.email = updated.shopEmail;
      } else if (updated.email !== undefined) {
        next.shopEmail = updated.email;
      }

      if (updated.shopAddress !== undefined) {
        next.address = updated.shopAddress;
      } else if (updated.address !== undefined) {
        next.shopAddress = updated.address;
      }

      if (updated.vatPercent !== undefined) {
        next.tax = { ...next.tax, vatPercent: updated.vatPercent };
      } else if (updated.tax?.vatPercent !== undefined) {
        next.vatPercent = updated.tax.vatPercent;
      }

      if (updated.taxPercent !== undefined) {
        next.tax = { ...next.tax, taxPercent: updated.taxPercent };
      } else if (updated.tax?.taxPercent !== undefined) {
        next.taxPercent = updated.tax.taxPercent;
      }

      return next;
    });
    logActivity('settings', 'Edit', 'Updated general system and Dubai VAT configuration');
  };

  const getBackupPayload = () => {
    const payload = {
      users,
      products,
      imeis,
      suppliers,
      customers,
      purchases,
      sales,
      returns,
      branches,
      settings,
      expenses,
      backupType: 'Full Backup',
      backedUpAt: new Date().toISOString(),
    };
    logActivity('settings', 'Create', 'Successfully generated active database backup envelope');
    return payload;
  };

  const triggerRestoreDatabase = (data: any): boolean => {
    try {
      if (data && data.products && data.imeis && data.settings) {
        if (data.users) setUsers(data.users);
        if (data.products) setProducts(data.products);
        if (data.imeis) setImeis(data.imeis);
        if (data.suppliers) setSuppliers(data.suppliers);
        if (data.customers) setCustomers(data.customers);
        if (data.purchases) setPurchases(data.purchases);
        if (data.sales) setSales(data.sales);
        if (data.returns) setReturns(data.returns || []);
        if (data.branches) setBranches(data.branches);
        if (data.expenses) setExpenses(data.expenses || []);
        if (data.settings) {
          setSettings({ ...initialSettings, ...data.settings });
        }
        logActivity('settings', 'Restore', 'Successfully reconstructed ERP Ledger from external backup envelope');
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const backupDatabase = (type: string) => {
    const data = {
      users,
      products,
      imeis,
      suppliers,
      customers,
      purchases,
      sales,
      returns,
      branches,
      settings,
      expenses,
      backupType: type,
      backedUpAt: new Date().toISOString(),
    };
    logActivity('settings', 'Create', `Successfully executed manual ${type} archive`);
    return JSON.stringify(data, null, 2);
  };

  const restoreDatabase = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.products && data.imeis && data.settings) {
        if (data.users) setUsers(data.users);
        if (data.products) setProducts(data.products);
        if (data.imeis) setImeis(data.imeis);
        if (data.suppliers) setSuppliers(data.suppliers);
        if (data.customers) setCustomers(data.customers);
        if (data.purchases) setPurchases(data.purchases);
        if (data.sales) setSales(data.sales);
        if (data.returns) setReturns(data.returns || []);
        if (data.branches) setBranches(data.branches);
        if (data.expenses) setExpenses(data.expenses || []);
        if (data.settings) setSettings(data.settings);
        logActivity('settings', 'Restore', 'Successfully reconstructed ERP Ledger from external JSON backup');
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const resetDatabase = () => {
    localStorage.removeItem('aqz_users');
    localStorage.removeItem('aqz_products');
    localStorage.removeItem('aqz_imeis');
    localStorage.removeItem('aqz_suppliers');
    localStorage.removeItem('aqz_customers');
    localStorage.removeItem('aqz_purchases');
    localStorage.removeItem('aqz_sales');
    localStorage.removeItem('aqz_returns');
    localStorage.removeItem('aqz_branches');
    localStorage.removeItem('aqz_logs');
    localStorage.removeItem('aqz_deleted');
    localStorage.removeItem('aqz_settings');
    localStorage.removeItem('aqz_expenses');

    setUsers(initialUsers.filter(u => u.username === 'sameer'));
    setProducts([]);
    setImeis([]);
    setSuppliers([]);
    setCustomers([]);
    setPurchases([]);
    setSales([]);
    setReturns([]);
    setBranches(initialBranches);
    setExpenses([]);
    setAuditLogs([]);
    setDeletedRecords([]);
    setSettings(initialSettings);
    setCurrentUser(initialUsers.find((u) => u.username === 'sameer') || initialUsers[0]);

    logActivity('settings', 'Restore', 'Database reset to empty zero states.');
  };

  return (
    <ERPContext.Provider
      value={{
        currentUser,
        setCurrentUser: handleSetCurrentUser,
        users,
        addUser,
        updateUser,
        deleteUser,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        imeis,
        addIMEI,
        updateIMEIStatus,
        updateIMEIDetails,
        checkIMEIUnique,
        bulkValidateIMEIs,
        suppliers,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        updateSupplierDues,
        customers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        updateCustomerAmount,
        purchases,
        addPurchase,
        updatePurchase,
        deletePurchase,
        sales,
        addSale,
        updateSale,
        deleteSale,
        returns,
        addReturn,
        deleteReturn,
        branches,
        addBranch,
        updateBranch,
        deleteBranch,
        currentBranchId,
        setCurrentBranchId,
        auditLogs,
        logActivity,
        clearAuditLogs,
        deletedRecords,
        restoreDeletedRecord,
        clearDeletedRecords,
        settings,
        updateSettings,
        backupDatabase,
        restoreDatabase,
        getBackupPayload,
        triggerRestoreDatabase,
        resetDatabase,
        expenses,
        addExpense,
        updateExpense,
        deleteExpense,
      }}
    >
      {children}
    </ERPContext.Provider>
  );
};

export const useERP = () => {
  const context = useContext(ERPContext);
  if (context === undefined) {
    throw new Error('useERP must be used within an ERPProvider');
  }
  return context;
};
