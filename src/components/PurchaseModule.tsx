/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useERP } from '../context/ERPContext';
import { PurchaseItem, Supplier, Product } from '../types';
import { Plus, Trash2, Search, HelpCircle, ShieldAlert, Check, X, FileText, ArrowRight } from 'lucide-react';

export const PurchaseModule: React.FC = () => {
  const { 
    purchases, 
    addPurchase, 
    updatePurchase,
    deletePurchase, 
    suppliers, 
    addSupplier,
    products, 
    checkIMEIUnique, 
    branches, 
    currentUser 
  } = useERP();

  const [searchTerm, setSearchTerm] = useState('');

  // Purchase Creator Flow Toggle
  const [isCreating, setIsCreating] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('b1');
  const [purchaseItems, setPurchaseItems] = useState<Omit<PurchaseItem, 'productName'>[]>([]);
  const [dueAmount, setDueAmount] = useState<number>(0);

  // Pay Outstanding Dues State
  const [payingPurchase, setPayingPurchase] = useState<any>(null);
  const [payAmount, setPayAmount] = useState<number>(0);

  // Quick Supplier Creator Form
  const [isAddingSupplier, setIsAddingSupplier] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  const [newSupplierVat, setNewSupplierVat] = useState('');
  const [newSupplierAddress, setNewSupplierAddress] = useState('');

  // Search purchases list
  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => {
      const sup = suppliers.find(s => s.id === p.supplierId);
      const searchStr = `${p.invoiceNo} ${sup?.name || ''}`.toLowerCase();
      return searchStr.includes(searchTerm.toLowerCase());
    });
  }, [purchases, suppliers, searchTerm]);

  // Grand Total calculation
  const totalAmount = useMemo(() => {
    return purchaseItems.reduce((sum, item) => sum + item.purchaseRate, 0);
  }, [purchaseItems]);

  const handleAddSupplierShortcut = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplierName || !newSupplierPhone) return;
    addSupplier({
      name: newSupplierName,
      phone: newSupplierPhone,
      vatNo: newSupplierVat || undefined,
      address: newSupplierAddress || undefined,
    });
    // Reset and select newly created supplier if matching list
    setNewSupplierName('');
    setNewSupplierPhone('');
    setNewSupplierVat('');
    setNewSupplierAddress('');
    setIsAddingSupplier(false);
  };

  const handleAddRow = () => {
    setPurchaseItems(prev => [
      ...prev,
      { productId: products[0]?.id || '', imei: '', purchaseRate: 0, sellingRate: 0 }
    ]);
  };

  const handleRemoveRow = (idx: number) => {
    setPurchaseItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleRowChange = (idx: number, field: string, val: any) => {
    setPurchaseItems(prev => prev.map((item, i) => {
      if (idx !== i) return item;
      
      const updated = { ...item, [field]: val };
      
      // Auto populate rate from product template defaults if product changed
      if (field === 'productId') {
        const prod = products.find(p => p.id === val);
        if (prod) {
          updated.purchaseRate = prod.purchasePrice;
          updated.sellingRate = prod.sellingPrice;
        }
      }
      return updated;
    }));
  };

  // Check if there are any duplicate IMEIs in this purchase or in the system database
  const imeiValidationErrors = useMemo(() => {
    const errors: Record<number, string> = {};
    const seenInForm: Set<string> = new Set();

    purchaseItems.forEach((item, idx) => {
      const imei = item.imei.trim();
      if (!imei) return;

      // 1. Minimum IMEI digits standard
      if (imei.length < 14 || imei.length > 16) {
        errors[idx] = 'IMEI length error (standard 15 digits)';
        return;
      }

      // 2. Form duplicate check
      if (seenInForm.has(imei.toLowerCase())) {
        errors[idx] = 'Duplicate IMEI detected on this invoice form';
        return;
      }
      seenInForm.add(imei.toLowerCase());

      // 3. Database lookup duplicate check
      const isDbUnique = checkIMEIUnique(imei);
      if (!isDbUnique) {
        errors[idx] = 'IMEI already exists — duplicate IMEI not allowed.';
      }
    });

    return errors;
  }, [purchaseItems, checkIMEIUnique]);

  const hasErrors = Object.keys(imeiValidationErrors).length > 0;

  const handleSavePurchase = () => {
    if (!selectedSupplierId) {
      alert('Must designate supply distributor.');
      return;
    }
    if (purchaseItems.length === 0) {
      alert('Add at least one device SKU to log.');
      return;
    }
    if (hasErrors) {
      alert('Security violation: Contains duplicate or invalid IMEI records. Correct Neon Red fields.');
      return;
    }

    // Check custom blank check
    const isBlanks = purchaseItems.some(i => !i.imei.trim() || i.purchaseRate <= 0);
    if (isBlanks) {
      alert('Purchase items must possess valid rates and distinct keys.');
      return;
    }

    addPurchase({
      supplierId: selectedSupplierId,
      branchId: selectedBranchId,
      items: purchaseItems,
      totalAmount,
      dueAmount: Math.min(totalAmount, dueAmount),
    });

    // Reset Form
    setPurchaseItems([]);
    setSelectedSupplierId('');
    setDueAmount(0);
    setIsCreating(false);
  };

  const handleDeletePurchase = (id: string, code: string) => {
    if (currentUser?.role === 'Staff') {
      alert('Invalid Permissions: Operations limited to CEO Admin level.');
      return;
    }
    if (window.confirm(`Are you sure you want to void purchase invoice ${code}? Associated IMEI stocked items will be immediately evacuated.`)) {
      deletePurchase(id);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Add button */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/60 pb-5">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">STOCK INWARD LEDGER</h2>
          <p className="text-xs text-slate-400 font-medium">Verify incoming goods & trace supplying invoices</p>
        </div>

        {!isCreating && (
          <button
            onClick={() => {
              setIsCreating(true);
              handleAddRow(); // starts with 1 item row
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition shadow-[0_0_15px_rgba(239,68,68,0.25)] cursor-pointer text-xs uppercase"
          >
            <Plus size={14} />
            <span>Create purchase docket</span>
          </button>
        )}
      </div>

      {isCreating ? (
        /* Create Purchase Form View */
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-slate-900/60 max-w-5xl mx-auto rounded-2xl border border-slate-800/80 p-5 md:p-8 space-y-6">
            
            {/* Form Top Section: Supplier / Branch */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Supplier Selector */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-400 uppercase block">Supplier Distributor</label>
                  <button
                    onClick={() => setIsAddingSupplier(true)}
                    className="text-[10px] text-red-400 hover:text-red-300 transition-colors font-bold uppercase"
                  >
                    + Add New Supplier
                  </button>
                </div>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => {
                    setSelectedSupplierId(e.target.value);
                    const sup = suppliers.find(s => s.id === e.target.value);
                  }}
                  className="w-full bg-slate-950/80 border border-slate-800 text-sm focus:border-red-500/50 rounded-xl py-2 px-3 text-slate-200 focus:outline-none"
                >
                  <option value="">-- Choose Distributor --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} (TRN {s.vatNo || 'NA'})</option>
                  ))}
                </select>
              </div>

              {/* Destination Branch */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase block">Inward Destination Branch</label>
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 text-sm focus:border-red-500/50 rounded-xl py-2 px-3 text-slate-200 focus:outline-none"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* Supplier Due Tracking */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase block font-sans tracking-wide">Supplier Settlement Terms</label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1 flex flex-col justify-center">
                    <span className="text-[8px] text-slate-500 block uppercase font-bold">Total Bill</span>
                    <span className="text-xs font-black text-white font-mono">{totalAmount.toLocaleString()} AED</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] font-bold text-slate-500 uppercase block">Amount Paid Today</span>
                    <input
                      type="number"
                      min="0"
                      max={totalAmount}
                      placeholder="e.g. 5000"
                      onChange={(e) => {
                        const paid = parseFloat(e.target.value) || 0;
                        setDueAmount(Math.max(0, totalAmount - paid));
                      }}
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl py-1 px-2 focus:outline-none focus:border-emerald-500/50 text-center font-mono placeholder-slate-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] font-bold text-red-400 uppercase block">Outstanding Dues</span>
                    <input
                      type="number"
                      min="0"
                      max={totalAmount}
                      placeholder="Outstanding"
                      value={dueAmount === 0 && totalAmount > 0 ? '0' : (dueAmount || '')}
                      onChange={(e) => setDueAmount(Math.min(totalAmount, parseFloat(e.target.value) || 0))}
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-red-400 font-bold rounded-xl py-1 px-2 focus:outline-none focus:border-yellow-500/50 text-center font-mono placeholder-slate-700"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Form Middle Section: Multi Products Table */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
                <span>DOCKET GADGET LIST (أصناف الفاتورة)</span>
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-slate-600 px-2.5 py-1 rounded"
                >
                  + Add line item row
                </button>
              </h3>

              <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/20">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead>
                    <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 text-[10px] font-bold uppercase">
                      <th className="p-3">Select Model Configuration</th>
                      <th className="p-3">Device unique IMEI Number</th>
                      <th className="p-3 w-32">Buying Rate (AED)</th>
                      <th className="p-3 w-32">Default Sale Rate</th>
                      <th className="p-3 w-12 text-center">X</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {purchaseItems.map((item, idx) => {
                      const hasErr = imeiValidationErrors[idx];

                      return (
                        <tr key={idx} className={`hover:bg-slate-900/10 ${hasErr ? 'bg-red-500/5' : ''}`}>
                          {/* Product selection */}
                          <td className="p-3">
                            <select
                              value={item.productId}
                              onChange={(e) => handleRowChange(idx, 'productId', e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-2 text-xs focus:outline-none"
                            >
                              {products.map(p => (
                                <option key={p.id} value={p.id}>{p.brand} {p.name} ({p.ramRom})</option>
                              ))}
                            </select>
                          </td>

                          {/* IMEI field */}
                          <td className="p-3 relative">
                            <input
                              type="text"
                              maxLength={16}
                              placeholder="Type IMEI (15 digit code)"
                              value={item.imei}
                              onChange={(e) => handleRowChange(idx, 'imei', e.target.value.replace(/\D/g, ''))} // numeric only
                              className={`w-full bg-slate-950 border rounded-lg py-1.5 px-3 text-xs font-mono tracking-wider focus:outline-none ${
                                hasErr 
                                  ? 'border-red-500 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)] animate-pulse' 
                                  : 'border-slate-800 focus:border-red-500/40'
                              }`}
                            />
                            {hasErr && (
                              <p className="absolute bottom-[-15px] left-3 transform translate-y-2 text-[9px] font-bold text-red-400 flex items-center gap-1">
                                <ShieldAlert size={10} className="text-red-500" />
                                <span>{hasErr}</span>
                              </p>
                            )}
                          </td>

                          {/* Purchase price */}
                          <td className="p-3">
                            <input
                              type="number"
                              min="0"
                              value={item.purchaseRate || ''}
                              onChange={(e) => handleRowChange(idx, 'purchaseRate', parseFloat(e.target.value) || 0)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-2 text-xs text-white"
                            />
                          </td>

                          {/* Store price */}
                          <td className="p-3">
                            <input
                              type="number"
                              min="0"
                              value={item.sellingRate || ''}
                              onChange={(e) => handleRowChange(idx, 'sellingRate', parseFloat(e.target.value) || 0)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-2 text-xs text-white"
                            />
                          </td>

                          {/* Delete row */}
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(idx)}
                              className="text-slate-500 hover:text-red-500 transition"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Back & Save Button row */}
            <div className="flex justify-between items-center gap-4 pt-6 mt-4 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  setPurchaseItems([]);
                  setIsCreating(false);
                }}
                className="px-4 py-2 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Back to Docket Ledger
              </button>

              <button
                type="button"
                disabled={hasErrors || purchaseItems.length === 0}
                onClick={handleSavePurchase}
                className={`flex items-center gap-1 px-5 py-2.5 rounded-xl font-bold transition shadow-lg text-xs uppercase cursor-pointer ${
                  hasErrors || purchaseItems.length === 0
                    ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.25)]'
                }`}
              >
                <span>Commit inward docket</span>
                <ArrowRight size={13} />
              </button>
            </div>

          </div>
        </div>
      ) : (
        /* Purchase Invoice Lists */
        <div className="space-y-4">
          
          {/* Lookup Input filter */}
          <div className="md:col-span-6 relative bg-slate-900/40 p-3 rounded-2xl border border-slate-800">
            <span className="absolute inset-y-0 left-3 pl-3.5 flex items-center text-slate-500 pointer-events-none">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search incoming purchases by Invoice Code, Supplying entity..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 text-sm focus:border-red-500/50 rounded-xl py-2 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none"
            />
          </div>

          {/* purchases list layout table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/20 animate-fadeIn">
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 text-[10px] font-bold uppercase select-none">
                  <th className="p-3">Ref Invoice No</th>
                  <th className="p-3">Replenishment Date</th>
                  <th className="p-3">Supplying Distributor</th>
                  <th className="p-3 text-center">No Items</th>
                  <th className="p-3 text-right">Sum Value (AED)</th>
                  <th className="p-3 text-right">Paid Amount</th>
                  <th className="p-3 text-right">Outstanding Bal</th>
                  <th className="p-3 text-center">Pay Installment</th>
                  <th className="p-3 text-center">Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500 font-bold">No registered inward dockets matching.</td>
                  </tr>
                ) : (
                  filteredPurchases.map((p) => {
                    const supName = suppliers.find(s => s.id === p.supplierId)?.name || 'Bulk Distributor';
                    const paidAmount = p.totalAmount - p.dueAmount;
                    return (
                      <tr key={p.id} className="hover:bg-slate-900/10 transition-colors">
                        <td className="p-3 select-all font-mono font-bold text-white tracking-wider">{p.invoiceNo}</td>
                        <td className="p-3">{p.date.split('T')[0]}</td>
                        <td className="p-3 text-slate-100 font-semibold">{supName}</td>
                        <td className="p-3 text-center font-bold text-slate-400">{p.items.length} units</td>
                        <td className="p-3 text-right font-black text-white">{p.totalAmount.toLocaleString()} AED</td>
                        <td className="p-3 text-right font-semibold text-emerald-400">{paidAmount.toLocaleString()} AED</td>
                        <td className="p-3 text-right font-mono font-bold animate-fadeIn">
                          {p.dueAmount > 0 ? (
                            <span className="text-yellow-500 bg-yellow-550/10 border border-yellow-500/20 px-2.5 py-0.5 rounded text-[11px]">
                              {p.dueAmount.toLocaleString()} AED
                            </span>
                          ) : (
                            <span className="text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20 text-[11px]">Settled</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {p.dueAmount > 0 ? (
                            <button
                              onClick={() => {
                                setPayingPurchase(p);
                                setPayAmount(p.dueAmount);
                              }}
                              className="px-3 py-1 text-[10.5px] bg-red-600 hover:bg-red-500 text-white font-extrabold rounded-lg transition-all shadow-[0_0_10px_rgba(239,68,68,0.15)] cursor-pointer hover:scale-105 active:scale-95 whitespace-nowrap"
                            >
                              Pay Dues (تسديد)
                            </button>
                          ) : (
                            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/5 border border-emerald-500/10 py-1 px-2.5 rounded-lg select-none">
                              Completed ✓
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {currentUser?.role === 'Admin' && (
                            <button
                              onClick={() => handleDeletePurchase(p.id, p.invoiceNo)}
                              className="p-1 px-2 text-[10px] bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 text-red-400 font-bold rounded-lg transition"
                            >
                              Void Invoice
                            </button>
                          )}
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

      {/* QUICK SUPPLIER CREATOR MODAL PORTAL */}
      {isAddingSupplier && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 max-w-sm w-full p-6 rounded-2xl relative">
            <button
              onClick={() => setIsAddingSupplier(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X size={18} />
            </button>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Add New Supplier Profile</h3>
            
            <form onSubmit={handleAddSupplierShortcut} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Distributor Name</label>
                <input
                  type="text"
                  required
                  value={newSupplierName}
                  onChange={(e) => setNewSupplierName(e.target.value)}
                  placeholder="e.g. Al-Futtaim Tech UAE"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-3 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</label>
                <input
                  type="text"
                  required
                  value={newSupplierPhone}
                  onChange={(e) => setNewSupplierPhone(e.target.value)}
                  placeholder="+971 XX XXX XXXX"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-3 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">VAT/GST TRN Code (Optional)</label>
                <input
                  type="text"
                  value={newSupplierVat}
                  onChange={(e) => setNewSupplierVat(e.target.value)}
                  placeholder="15-digit Tax Account"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-3 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Address Location (Optional)</label>
                <input
                  type="text"
                  value={newSupplierAddress}
                  onChange={(e) => setNewSupplierAddress(e.target.value)}
                  placeholder="e.g. Abu Dhabi Mall Area"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-3 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingSupplier(false)}
                  className="px-3 py-1.5 border border-slate-800 text-slate-400 text-[11px] rounded transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold rounded"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAY OUTSTANDING DUES MODAL DIALOG */}
      {payingPurchase && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 max-w-sm w-full p-6 rounded-2xl relative shadow-2xl">
            <button
              onClick={() => {
                setPayingPurchase(null);
                setPayAmount(0);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X size={18} />
            </button>
            
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 border-b border-slate-800 pb-2 flex items-center gap-1">
              <span>REGISTER SUPPLY PAYMENT</span>
            </h3>
            
            <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider mb-4">
              Invoice Code: <span className="text-red-400">{payingPurchase.invoiceNo}</span>
            </p>

            <div className="space-y-4 font-sans">
              <div className="p-3 bg-black/40 border border-slate-800 rounded-xl text-xs space-y-1.5 ">
                <div className="flex justify-between">
                  <span className="text-slate-400">Distributor:</span>
                  <span className="text-white font-bold">
                    {suppliers.find(s => s.id === payingPurchase.supplierId)?.name || 'Bulk Distributor'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Purchase Value:</span>
                  <span className="text-white font-mono">{payingPurchase.totalAmount.toLocaleString()} AED</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Outstanding Owed:</span>
                  <span className="text-red-400 font-black font-mono">{payingPurchase.dueAmount.toLocaleString()} AED</span>
                </div>
              </div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (payAmount <= 0) return;
                  if (payAmount > payingPurchase.dueAmount) {
                    alert(`Error: Payment limits exceeded. Max allowed payload is ${payingPurchase.dueAmount} AED.`);
                    return;
                  }
                  const nextDue = Math.max(0, payingPurchase.dueAmount - payAmount);
                  updatePurchase(payingPurchase.id, { dueAmount: nextDue });
                  setPayingPurchase(null);
                  setPayAmount(0);
                }} 
                className="space-y-4"
              >
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Settlement Installment (AED)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={payingPurchase.dueAmount}
                    value={payAmount || ''}
                    onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                    placeholder="e.g. 1000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white focus:outline-none text-center font-mono focus:border-red-500/50"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 px-1 pt-1 font-mono">
                    <span>Remaining Post Payment:</span>
                    <span className="font-bold text-emerald-400 flex items-center">
                      {Math.max(0, payingPurchase.dueAmount - payAmount).toLocaleString()} AED
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800/60">
                  <button
                    type="button"
                    onClick={() => {
                      setPayingPurchase(null);
                      setPayAmount(0);
                    }}
                    className="px-3 py-1.5 border border-slate-800 text-slate-400 text-[11px] rounded transition-all hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white text-[11px] font-black rounded-lg uppercase tracking-wide cursor-pointer transition shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse"
                  >
                    Commit AED Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
