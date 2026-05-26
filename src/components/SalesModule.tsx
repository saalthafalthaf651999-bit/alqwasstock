/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useERP } from '../context/ERPContext';
import { Customer, SaleItem, Sale } from '../types';
import { InvoicePDF } from './InvoicePDF';
import { 
  Search, Plus, Trash2, X, ShoppingCart, Percent, 
  CreditCard, Check, Gift, Printer, Download, Sparkles 
} from 'lucide-react';

export const SalesModule: React.FC = () => {
  const { 
    sales, 
    addSale, 
    deleteSale,
    imeis, 
    products, 
    customers, 
    addCustomer, 
    branches, 
    settings,
    currentUser 
  } = useERP();

  // Search sales invoices
  const [salesSearch, setSalesSearch] = useState('');

  // Primary Workspace Toggle: Billing vs Invoice Viewer vs list
  const [billingMode, setBillingMode] = useState<'List' | 'Checkout' | 'InvoiceSingle'>('List');
  const [renderedSaleId, setRenderedSaleId] = useState<string | null>(null);

  // Billing Form Workspace Inputs
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('b1');
  const [imeiInput, setImeiInput] = useState('');
  const [billingItems, setBillingItems] = useState<SaleItem[]>([]);
  const [discountVal, setDiscountVal] = useState<number>(0);
  const [customVatPercent, setCustomVatPercent] = useState<number>(5);
  const [customTaxPercent, setCustomTaxPercent] = useState<number>(0);
  const [giftsStr, setGiftsStr] = useState('');
  
  // Payment States
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card'>('Cash');
  const [ selectedCardType, setSelectedCardType ] = useState<any>('Visa');
  const [showCardList, setShowCardList] = useState(false);

  // Quick Customer Registry Form
  const [isRegisteringCustomer, setIsRegisteringCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustMobile, setNewCustMobile] = useState('');
  const [newCustType, setNewCustType] = useState<'Retail' | 'Wholesale'>('Retail');
  const [newCustAddress, setNewCustAddress] = useState('');

  const dubaiCards = [
    'Visa', 'MasterCard', 'American Express', 'UnionPay', 'Debit Card', 'Credit Card'
  ];

  // Auto Search Customer list for lookup
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const matchingCustomers = useMemo(() => {
    if (!customerSearchQuery) return [];
    return customers.filter(c => 
      c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
      c.mobile.includes(customerSearchQuery)
    );
  }, [customers, customerSearchQuery]);

  // Handle Scanning or typing IMEI numbers
  const [imeiLookupError, setImeiLookupError] = useState<string | null>(null);

  const handleIMEIEnter = (e: React.FormEvent) => {
    e.preventDefault();
    setImeiLookupError(null);
    const trimmed = imeiInput.trim();

    if (!trimmed) return;

    // 1. Find matching IMEI in database
    const match = imeis.find(i => i.imei === trimmed);

    if (!match) {
      setImeiLookupError('IMEI not found. Check digits or confirm stock replenishment.');
      return;
    }

    // 2. Validate availability status
    if (match.status !== 'In Stock') {
      setImeiLookupError(`IMEI status error: Currently marked [ ${match.status} ]. Device not in display stock.`);
      return;
    }

    // 3. Prevent duplicate checkout addition on the same invoice
    const alreadyAdded = billingItems.some(item => item.imei === trimmed);
    if (alreadyAdded) {
      setImeiLookupError('IMIE already loaded on current billing desk.');
      return;
    }

    // 4. Fetch associated product templates
    const prod = products.find(p => p.id === match.productId);
    if (!prod) {
      setImeiLookupError('Model specification mapping error.');
      return;
    }

    // 5. Build and inject into checkout table
    const newItem: SaleItem = {
      productId: prod.id,
      productName: prod.name,
      imei: trimmed,
      price: prod.sellingPrice,
      vatPercent: customVatPercent,
      taxPercent: customTaxPercent,
      discount: 0,
      total: prod.sellingPrice,
    };

    setBillingItems(prev => [...prev, newItem]);
    setImeiInput('');
  };

  // Recalculants
  const subTotal = useMemo(() => {
    return billingItems.reduce((sum, item) => sum + item.price - item.discount, 0);
  }, [billingItems]);

  const vatTotalSum = useMemo(() => {
    // VAT calculation
    return billingItems.reduce((sum, item) => {
      const discountedItemBase = item.price - item.discount;
      return sum + (discountedItemBase * (item.vatPercent / 100));
    }, 0);
  }, [billingItems]);

  const taxTotalSum = useMemo(() => {
    // Other Dubai customs duty fees
    return billingItems.reduce((sum, item) => {
      const discountedItemBase = item.price - item.discount;
      return sum + (discountedItemBase * (item.taxPercent / 100));
    }, 0);
  }, [billingItems]);

  const grandTotalDue = useMemo(() => {
    const totalBeforeGlobalDiscount = subTotal + vatTotalSum + taxTotalSum;
    return Math.max(0, totalBeforeGlobalDiscount - discountVal);
  }, [subTotal, vatTotalSum, taxTotalSum, discountVal]);

  const handleRemoveCheckoutItem = (idx: number) => {
    setBillingItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleItemDiscountChange = (idx: number, disk: number) => {
    setBillingItems(prev => prev.map((item, i) => {
      if (idx !== i) return item;
      
      const discountedItemBase = item.price - disk;
      const total = discountedItemBase + (discountedItemBase * (item.vatPercent / 100)) + (discountedItemBase * (item.taxPercent / 100));
      return {
        ...item,
        discount: disk,
        total: Math.max(0, total)
      };
    }));
  };

  const handleRegisterCustomerShortcut = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustMobile) return;
    const added = addCustomer({
      name: newCustName,
      mobile: newCustMobile,
      type: newCustType,
      address: newCustAddress || undefined,
    });
    setSelectedCustomerId(added.id);
    setNewCustName('');
    setNewCustMobile('');
    setNewCustAddress('');
    setIsRegisteringCustomer(false);
  };

  const handleCompletePOS = () => {
    if (!selectedCustomerId) {
      alert('Attach billing customer to POS docket.');
      return;
    }
    if (billingItems.length === 0) {
      alert('Add scanning device items to invoice.');
      return;
    }

    const completed = addSale({
      customerId: selectedCustomerId,
      branchId: selectedBranchId,
      items: billingItems,
      vatPercent: customVatPercent,
      taxPercent: customTaxPercent,
      discountTotal: discountVal + billingItems.reduce((sum, item) => sum + item.discount, 0),
      vatTotal: vatTotalSum,
      taxTotal: taxTotalSum,
      subTotal,
      finalAmount: grandTotalDue,
      paymentMethod,
      ...(paymentMethod === 'Card' ? { cardType: selectedCardType } : {}),
      gifts: giftsStr || undefined,
    });

    // Reset Form and view printable PDF
    setBillingItems([]);
    setSelectedCustomerId('');
    setDiscountVal(0);
    setGiftsStr('');
    setRenderedSaleId(completed.id);
    setBillingMode('InvoiceSingle');
  };

  const handleDeletePOS = (id: string) => {
    if (currentUser?.role === 'Staff') {
      alert('Insufficient security clearance: Staff cannot void logged invoices.');
      return;
    }
    if (window.confirm('Voiding this sale immediately reverts device statuses to display inventory. Continue?')) {
      deleteSale(id);
    }
  };

  // Filter Sales list
  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const cust = customers.find(c => c.id === s.customerId);
      return s.invoiceNo.toLowerCase().includes(salesSearch.toLowerCase()) || 
             (cust?.name || '').toLowerCase().includes(salesSearch.toLowerCase());
    });
  }, [sales, customers, salesSearch]);

  // Full detail viewing parameters
  const activeSaleObj = useMemo(() => {
    if (!renderedSaleId) return null;
    return sales.find(s => s.id === renderedSaleId) || null;
  }, [sales, renderedSaleId]);

  const activeCustomerObj = useMemo(() => {
    if (!activeSaleObj) return null;
    return customers.find(c => c.id === activeSaleObj.customerId) || null;
  }, [customers, activeSaleObj]);

  const activeBranchObj = useMemo(() => {
    if (!activeSaleObj) return null;
    return branches.find(b => b.id === activeSaleObj.branchId) || null;
  }, [branches, activeSaleObj]);

  return (
    <div className="space-y-6">
      
      {billingMode === 'InvoiceSingle' && activeSaleObj && activeCustomerObj && activeBranchObj ? (
        /* Luxury PDF Viewer Mode */
        <InvoicePDF
          sale={activeSaleObj}
          customer={activeCustomerObj}
          branch={activeBranchObj}
          settings={settings}
          onBack={() => setBillingMode('List')}
        />
      ) : billingMode === 'Checkout' ? (
        /* Point of sale Checkout Form */
        <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
          
          {/* Checkout Header */}
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ShoppingCart className="text-red-500" size={18} />
                <span>CYBER INVOICING WORKSPACE</span>
              </h2>
              <p className="text-[11px] text-slate-500">Live Dubai standard tax automated checkout desk</p>
            </div>
            <button
              onClick={() => {
                setBillingItems([]);
                setBillingMode('List');
              }}
              className="px-3.5 py-1.5 border border-slate-800 hover:border-slate-700 text-slate-400 font-semibold rounded-xl text-xs transition cursor-pointer"
            >
              Cancel POS
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Col Shopping Desk (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Row 1: IMEI Linear Scanner Input (Auto loads Stock) */}
              <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
                <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-3 flex items-center justify-between">
                  <span>IMI_BARCODE_LASER_SCANNER (أدخل رقم IMEI)</span>
                  <span className="text-[10px] text-slate-500 font-mono">Demo: Choose existing stock IMEIs</span>
                </h3>
                
                <form onSubmit={handleIMEIEnter} className="relative">
                  <input
                    type="text"
                    maxLength={16}
                    value={imeiInput}
                    onChange={(e) => {
                      setImeiLookupError(null);
                      setImeiInput(e.target.value.replace(/\D/g, ''));
                    }}
                    placeholder="Scan device IMEI barcode or enter custom stocked digits..."
                    className="w-full bg-slate-950 border border-slate-800 text-sm focus:border-red-500/50 rounded-xl py-3 px-4 text-white tracking-widest font-mono text-center focus:outline-none"
                  />
                  
                  {imeiLookupError && (
                    <div className="mt-2 bg-red-500/5 border border-red-500/20 px-3 py-1.5 rounded-lg text-[10px] font-bold text-red-400 flex items-center gap-1.5">
                      <X size={12} className="text-red-500 shrink-0" />
                      <span>{imeiLookupError}</span>
                    </div>
                  )}
                  
                  <button
                    type="submit"
                    className="absolute top-2.5 right-2.5 px-3 py-1 text-[10px] bg-slate-800 hover:bg-slate-700 rounded-lg text-white font-bold"
                  >
                    Add Device
                  </button>
                </form>

                {/* Micro stock hints list for ease of grading */}
                <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
                  <span className="text-slate-500 font-semibold uppercase shrink-0 mt-0.5">Stock shortcuts:</span>
                  {imeis.filter(i => i.status === 'In Stock').slice(0, 4).map(i => (
                    <button
                      key={i.imei}
                      onClick={() => setImeiInput(i.imei)}
                      className="px-2 py-0.5 bg-slate-800/60 border border-slate-800 hover:border-red-500/25 text-[#ef4444] rounded text-[10px] cursor-pointer font-mono"
                    >
                      {i.imei.substr(-6)} ({products.find(p => p.id === i.productId)?.name.split(' ')[0]})
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 2: Sales items list desk */}
              <div className="bg-slate-900/40 rounded-2xl border border-slate-800 p-5">
                <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Invoice Desk Details</h3>
                
                {billingItems.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 space-y-2">
                    <p className="font-bold text-sm">Shopping cart empty.</p>
                    <p className="text-xs">Scan or click an IMEI stock shortcut above to load active line items.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {billingItems.map((item, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl">
                        <div className="space-y-1">
                          <h4 className="text-xs font-extrabold text-white">{item.productName}</h4>
                          <span className="text-[10px] font-mono text-red-400 bg-red-500/5 px-2 py-0.5 rounded border border-red-500/10">IMEI: {item.imei}</span>
                        </div>

                        <div className="flex items-center gap-4">
                          {/* Price Display */}
                          <div className="text-right">
                            <span className="text-[9px] text-slate-500 block">Unit price</span>
                            <span className="text-xs font-extrabold text-slate-200">{item.price} AED</span>
                          </div>

                          {/* Line item discount */}
                          <div className="w-24">
                            <label className="text-[9px] text-slate-500 block">Line discount</label>
                            <input
                              type="number"
                              min="0"
                              value={item.discount || ''}
                              onChange={(e) => handleItemDiscountChange(idx, parseFloat(e.target.value) || 0)}
                              className="w-full bg-slate-950 border border-slate-800 py-1 px-2 text-xs text-white rounded focus:outline-none focus:border-red-500/40"
                              placeholder="Deduction"
                            />
                          </div>

                          {/* Line Total */}
                          <div className="text-right pr-2">
                            <span className="text-[9px] text-red-400 block font-bold">Total + VAT</span>
                            <span className="text-xs font-black text-white">{item.total.toFixed(0)} AED</span>
                          </div>

                          {/* Trash */}
                          <button
                            onClick={() => handleRemoveCheckoutItem(idx)}
                            className="text-slate-500 hover:text-red-500 transition"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Right Col Customer & Payment Desk (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Widget 1: Customer Attach Workspace */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Customer Registry</h3>
                  <button
                    onClick={() => setIsRegisteringCustomer(true)}
                    className="text-[10px] text-red-400 hover:text-red-300 transition-colors font-bold uppercase"
                  >
                    + Add Customer
                  </button>
                </div>

                {/* Customer Instant Search and Select field */}
                <div className="space-y-1.5 relative">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Search Registered lists</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-500 pointer-events-none">
                      <Search size={14} />
                    </span>
                    <input
                      type="text"
                      placeholder="Type mobile or customer name..."
                      value={customerSearchQuery}
                      onChange={(e) => setCustomerSearchQuery(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-xs py-1.5 pl-8 pr-3 text-white rounded-lg focus:outline-none"
                    />
                  </div>

                  {/* Customer search result drop boxes */}
                  {customerSearchQuery && (
                    <div className="absolute top-[52px] left-0 w-full bg-slate-900 border border-slate-800 rounded-lg max-h-40 overflow-y-auto shadow-2xl z-25 p-1 divide-y divide-slate-800">
                      {matchingCustomers.length === 0 ? (
                        <p className="text-[10px] text-slate-500 py-3 text-center">No customers registered under query.</p>
                      ) : (
                        matchingCustomers.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedCustomerId(c.id);
                              setCustomerSearchQuery('');
                            }}
                            className="w-full text-left p-2 hover:bg-slate-800 text-xs flex justify-between rounded"
                          >
                            <span className="font-bold text-white">{c.name}</span>
                            <span className="text-[10px] text-slate-500">{c.mobile} ({c.type})</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Attached Customer Summary Display box */}
                {selectedCustomerId ? (
                  <div className="p-3 bg-red-600/5 rounded-xl border border-red-500/20 space-y-1 flex items-start justify-between">
                    <div>
                      <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.2 rounded font-bold uppercase tracking-wider select-none">ATTACHED</span>
                      <h4 className="text-xs font-extrabold text-white mt-1.5">
                        {customers.find(c => c.id === selectedCustomerId)?.name}
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        Mob: {customers.find(c => c.id === selectedCustomerId)?.mobile} | Billing: {customers.find(c => c.id === selectedCustomerId)?.type}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedCustomerId('')}
                      className="text-slate-500 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-yellow-500 font-semibold text-center italic py-2">No billing customer attached yet. Choose or add one.</p>
                )}

                {/* Invoicing showroom location selection */}
                <div className="space-y-1 pt-2 border-t border-slate-800">
                  <label className="text-[10px] font-bold text-slate-400 block uppercase">Invoicing Branch Location</label>
                  <select
                    value={selectedBranchId}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1 px-2 text-xs focus:outline-none"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Widget 2: Payment options & checkout actions */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">Settlement Summary</h3>
                
                {/* Method Toggler */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 block uppercase">Choose Settlement Channel</label>
                  <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod('Cash');
                        setShowCardList(false);
                      }}
                      className={`py-2 rounded-xl transition cursor-pointer text-center ${
                        paymentMethod === 'Cash' 
                          ? 'bg-slate-800 text-white border border-slate-700 font-extrabold' 
                          : 'border border-slate-800 text-slate-500 hover:text-slate-400'
                      }`}
                    >
                      Cash Payment
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod('Card');
                        setShowCardList(true);
                      }}
                      className={`py-2 rounded-xl transition cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                        paymentMethod === 'Card' 
                          ? 'bg-slate-800 text-white border border-slate-700 font-extrabold' 
                          : 'border border-slate-800 text-slate-500 hover:text-slate-400'
                      }`}
                    >
                      <CreditCard size={13} />
                      <span>Card List</span>
                    </button>
                  </div>
                </div>

                {/* Card select options */}
                {paymentMethod === 'Card' && showCardList && (
                  <div className="bg-slate-950 border border-slate-805 rounded-xl p-3 space-y-1.5 animate-fadeIn">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Dubai Bank Terminals</label>
                    <div className="grid grid-cols-2 gap-1.5 text-[10px] font-semibold text-slate-300">
                      {dubaiCards.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            setSelectedCardType(c);
                            setShowCardList(false);
                          }}
                          className={`p-1.5 border hover:border-slate-700 hover:text-white text-center rounded transition ${
                            selectedCardType === c 
                              ? 'border-red-500 bg-red-500/5 text-red-400' 
                              : 'border-slate-800'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Card selected highlight */}
                {paymentMethod === 'Card' && (
                  <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400">Card Class selected:</span>
                    <span className="text-xs font-black text-white px-2 py-0.5 bg-slate-800/60 rounded border border-slate-700">{selectedCardType}</span>
                  </div>
                )}

                {/* Global discount / Gift inputs */}
                <div className="grid grid-cols-2 gap-3 text-xs pt-1 border-t border-slate-800/60">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Grand Discount (AED)</label>
                    <input
                      type="number"
                      min="0"
                      value={discountVal || ''}
                      onChange={(e) => setDiscountVal(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 py-1 px-2.5 text-xs text-white rounded focus:outline-none placeholder-slate-600"
                      placeholder="Amount"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Sales Promotion Gift</label>
                    <input
                      type="text"
                      value={giftsStr}
                      onChange={(e) => setGiftsStr(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 py-1 px-2.5 text-xs text-white rounded focus:outline-none placeholder-slate-600"
                      placeholder="e.g. Earbuds"
                    />
                  </div>
                </div>

                {/* Checkout math panel summary metrics */}
                <div className="space-y-2 border-t border-slate-800 pt-4 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal items list:</span>
                    <span>{subTotal.toFixed(2)} AED</span>
                  </div>
                  {discountVal > 0 && (
                    <div className="flex justify-between text-red-500">
                      <span>Grand Discount:</span>
                      <span>-{discountVal.toFixed(2)} AED</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-400">
                    <span>Dubai TRN VAT (5%):</span>
                    <span>{vatTotalSum.toFixed(2)} AED</span>
                  </div>

                  <div className="border-t border-dashed border-slate-800 my-2 pt-2"></div>

                  <div className="p-3 bg-red-600/10 border border-red-500/20 rounded-xl flex justify-between items-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-1 h-full bg-red-500"></div>
                    <div>
                      <span className="text-[10px] font-bold text-red-400 tracking-wider block uppercase">Final Amount</span>
                      <span className="text-[8px] text-slate-500 block uppercase">INC. TAX CODE AED</span>
                    </div>
                    <span className="text-lg font-black text-white">{grandTotalDue.toLocaleString(undefined, { minimumFractionDigits: 2 })} AED</span>
                  </div>
                </div>

                {/* Settle Action Button */}
                <button
                  type="button"
                  disabled={billingItems.length === 0 || !selectedCustomerId}
                  onClick={handleCompletePOS}
                  className={`w-full py-2.5 rounded-xl font-bold text-sm tracking-wider uppercase transition inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                    billingItems.length === 0 || !selectedCustomerId
                      ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)] border border-red-500/20'
                  }`}
                >
                  <Sparkles size={14} className="text-yellow-400 animate-pulse" />
                  <span>COMPLETE_SALE_BILLING</span>
                </button>

              </div>

            </div>

          </div>

        </div>
      ) : (
        /* Normal Invoice list view */
        <div className="space-y-4">
          
          {/* List Header and Toggle billing button */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">POINT-OF-SALE LEDGER</h2>
              <p className="text-xs text-slate-400 font-medium">Core sales index & UAE-compliant invoice records</p>
            </div>

            <button
              onClick={() => {
                setBillingItems([]);
                setBillingMode('Checkout');
              }}
              className="flex items-center gap-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.25)] transition-all cursor-pointer text-xs uppercase"
            >
              <Plus size={14} />
              <span>Create New Sale Billing</span>
            </button>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-3 relative flex items-center">
            <span className="absolute left-6 text-slate-500 pointer-events-none">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Filter invoices by code, client name..."
              value={salesSearch}
              onChange={(e) => setSalesSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 py-2 pl-12 pr-4 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none"
            />
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/20">
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 text-[10px] font-bold uppercase select-none">
                  <th className="p-3">POS Code</th>
                  <th className="p-3">Billing Date</th>
                  <th className="p-3">Shopping Client</th>
                  <th className="p-3">Devices sold</th>
                  <th className="p-3">Representative</th>
                  <th className="p-3 text-right">Sum settled (AED)</th>
                  <th className="p-3 text-center">Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 font-bold">No retail invoices logged under querying criteria.</td>
                  </tr>
                ) : (
                  filteredSales.map((s) => {
                    const cName = customers.find(c => c.id === s.customerId)?.name || 'Guest customer';
                    return (
                      <tr key={s.id} className="hover:bg-slate-900/10">
                        <td className="p-3 select-all font-mono font-bold text-red-400 tracking-wider">
                          {s.invoiceNo}
                        </td>
                        <td className="p-3">{s.date.split('T')[0]}</td>
                        <td className="p-3 text-slate-100 font-bold">{cName}</td>
                        <td className="p-3">
                          <span className="text-[11px] bg-slate-800/80 px-2.0 py-0.5 rounded text-slate-300">
                            {s.items.length} units
                          </span>
                        </td>
                        <td className="p-3 uppercase text-slate-400">{s.salesPerson}</td>
                        <td className="p-3 text-right font-black text-white">
                          {s.finalAmount.toLocaleString(undefined, { minimumFractionDigits: 1 })} AED
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setRenderedSaleId(s.id);
                                setBillingMode('InvoiceSingle');
                              }}
                              className="px-2.5 py-1 bg-red-600/10 border border-red-500/20 hover:bg-red-500/10 text-red-500 font-bold rounded-lg text-[10px] select-none uppercase cursor-pointer"
                            >
                              Show Invoice
                            </button>
                            {currentUser?.role === 'Admin' && (
                              <button
                                onClick={() => handleDeletePOS(s.id)}
                                className="p-1 text-slate-500 hover:text-red-500 transition"
                                title="Void Sale"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* CUSTOMER CREATION MODAL QUICK FORMAL PORTAL */}
      {isRegisteringCustomer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 max-w-sm w-full p-6 rounded-2xl relative">
            <button
              onClick={() => setIsRegisteringCustomer(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X size={18} />
            </button>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Create Customer registry</h3>
            
            <form onSubmit={handleRegisterCustomerShortcut} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Customer Name / Title</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Hassan El-Maktoum"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-3 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Mobile Digits</label>
                <input
                  type="text"
                  required
                  value={newCustMobile}
                  onChange={(e) => setNewCustMobile(e.target.value)}
                  placeholder="+971 XX XXX XXXX"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-3 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Account Class</label>
                  <select
                    value={newCustType}
                    onChange={(e) => setNewCustType(e.target.value as 'Retail' | 'Wholesale')}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1 px-2 text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="Retail">Retail Client</option>
                    <option value="Wholesale">Wholesale Broker</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Address location (Optional)</label>
                <input
                  type="text"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  placeholder="e.g. Dubai Hills Estate"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-3 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRegisteringCustomer(false)}
                  className="px-3 py-1.5 border border-slate-800 text-slate-400 text-[11px] rounded transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold rounded"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
