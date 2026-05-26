/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useERP } from '../context/ERPContext';
import { Customer, Supplier } from '../types';
import { Plus, Edit2, Trash2, Search, Filter, HelpCircle, X, ShieldAlert, BookOpen } from 'lucide-react';

export const CustomersSuppliers: React.FC = () => {
  const { 
    customers, 
    addCustomer, 
    updateCustomer, 
    deleteCustomer, 
    suppliers, 
    addSupplier, 
    updateSupplier, 
    deleteSupplier,
    currentUser,
    sales,
    purchases 
  } = useERP();

  const [activeTab, setActiveTab] = useState<'Customers' | 'Suppliers'>('Customers');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Retail' | 'Wholesale'>('All');

  // Modal Fields
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'Customer' | 'Supplier'>('Customer');
  const [modalMode, setModalMode] = useState<'Create' | 'Edit'>('Create');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [type, setType] = useState<'Retail' | 'Wholesale'>('Retail');
  const [address, setAddress] = useState('');
  const [vatNo, setVatNo] = useState('');

  // Client sales history tracing modal state
  const [viewedHistoryParty, setViewedHistoryParty] = useState<{ id: string; name: string; type: 'Customer' | 'Supplier' } | null>(null);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.mobile.includes(searchTerm);
      const matchType = categoryFilter === 'All' || c.type === categoryFilter;
      return matchSearch && matchType;
    });
  }, [customers, searchTerm, categoryFilter]);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => {
      return s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.phone.includes(searchTerm);
    });
  }, [suppliers, searchTerm]);

  const openCreateModal = (target: 'Customer' | 'Supplier') => {
    setModalType(target);
    setModalMode('Create');
    setName('');
    setMobile('');
    setType('Retail');
    setAddress('');
    setVatNo('');
    setIsModalOpen(true);
  };

  const openEditModal = (target: 'Customer' | 'Supplier', item: any) => {
    if (currentUser?.role === 'Staff') {
      alert('Action Blocked: Profile modifications limited to CEOs.');
      return;
    }
    setModalType(target);
    setModalMode('Edit');
    setEditingId(item.id);
    setName(item.name);
    setAddress(item.address || '');
    
    if (target === 'Customer') {
      const c = item as Customer;
      setMobile(c.mobile);
      setType(c.type);
    } else {
      const s = item as Supplier;
      setMobile(s.phone);
      setVatNo(s.vatNo || '');
    }
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !mobile) {
      alert('Parameters verified mismatch.');
      return;
    }

    if (modalType === 'Customer') {
      if (modalMode === 'Create') {
        addCustomer({
          name,
          mobile,
          type,
          address: address || undefined,
        });
      } else if (editingId) {
        updateCustomer(editingId, {
          name,
          mobile,
          type,
          address: address || undefined,
        });
      }
    } else {
      // Supplier
      if (modalMode === 'Create') {
        addSupplier({
          name,
          phone: mobile,
          vatNo: vatNo || undefined,
          address: address || undefined,
        });
      } else if (editingId) {
        updateSupplier(editingId, {
          name,
          phone: mobile,
          vatNo: vatNo || undefined,
          address: address || undefined,
        });
      }
    }
    setIsModalOpen(false);
  };

  const handleDelete = (target: 'Customer' | 'Supplier', id: string, label: string) => {
    if (currentUser?.role === 'Staff') {
      alert('Insufficient credentials: Staff cannot erase profiles.');
      return;
    }
    if (window.confirm(`Are you sure you want to remove ${target} ${label}? Account history log will be archived.`)) {
      if (target === 'Customer') deleteCustomer(id);
      else deleteSupplier(id);
    }
  };

  // Compute transactional logs for viewed party
  const targetedHistoryItems = useMemo(() => {
    if (!viewedHistoryParty) return [];
    const { id, type } = viewedHistoryParty;

    if (type === 'Customer') {
      return sales
        .filter(s => s.customerId === id)
        .map(s => ({
          code: s.invoiceNo,
          date: s.date.split('T')[0],
          details: `${s.items.length} device(s) sold via ${s.paymentMethod}`,
          amount: s.finalAmount,
          isProfit: true,
        }));
    } else {
      return purchases
        .filter(p => p.supplierId === id)
        .map(p => ({
          code: p.invoiceNo,
          date: p.date.split('T')[0],
          details: `Inward replenishment with ${p.items.length} system stock items.`,
          amount: p.totalAmount,
          isProfit: false,
        }));
    }
  }, [viewedHistoryParty, sales, purchases]);

  return (
    <div className="space-y-6">
      
      {/* Header Tabs */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/60 pb-5">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">CRM & PARTNER DIRECTORY</h2>
          <p className="text-xs text-slate-400 font-medium font-sans">Corporate wholesalers, retail patrons & manufacturing suppliers</p>
        </div>

        <div className="flex bg-slate-905 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => {
              setActiveTab('Customers');
              setSearchTerm('');
            }}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'Customers' 
                ? 'bg-red-600 text-white font-extrabold shadow' 
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Showroom Customers
          </button>
          <button
            onClick={() => {
              setActiveTab('Suppliers');
              setSearchTerm('');
            }}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'Suppliers' 
                ? 'bg-red-600 text-white font-extrabold shadow' 
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Wholesale Suppliers
          </button>
        </div>
      </div>

      {/* Inputs controls */}
      <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/80 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          
          {/* Search bar */}
          <div className="md:col-span-5 relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder={activeTab === 'Customers' ? "Search client directory by name, mobile..." : "Search corporate suppliers..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 text-xs focus:border-red-500/50 rounded-xl py-1.5 pl-9 pr-3 text-white placeholder-slate-600 focus:outline-none"
            />
          </div>

          {/* Special Wholesale filter (Only visible in Customer directory tab) */}
          <div className="md:col-span-3">
            {activeTab === 'Customers' ? (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-2 text-xs text-slate-300 focus:outline-none"
              >
                <option value="All">All Billing Accounts</option>
                <option value="Retail">Retail Accounts Only</option>
                <option value="Wholesale">Wholesale Accounts Only</option>
              </select>
            ) : <div className="hidden md:block"></div>}
          </div>

          <div className="md:col-span-4 flex justify-end">
            <button
              onClick={() => openCreateModal(activeTab === 'Customers' ? 'Customer' : 'Supplier')}
              className="w-full sm:w-auto flex items-center justify-center gap-1 px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs uppercase cursor-pointer"
            >
              <span>+ Add {activeTab === 'Customers' ? 'Patron' : 'Supplier'}</span>
            </button>
          </div>

        </div>
      </div>

      {/* Main Table Directory */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/20">
        <table className="w-full text-left text-xs text-slate-300">
          <thead>
            {activeTab === 'Customers' ? (
              /* Customers Table Headers */
              <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 text-[10px] font-bold uppercase select-none">
                <th className="p-3">Client Name</th>
                <th className="p-3">Mobile Contact</th>
                <th className="p-3">Mailing Address</th>
                <th className="p-3 text-center">Patron Class</th>
                <th className="p-3 text-right">Pending Debt Dues</th>
                <th className="p-3 text-center">Ledger Controls</th>
              </tr>
            ) : (
              /* Suppliers Table Headers */
              <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 text-[10px] font-bold uppercase select-none">
                <th className="p-3">Supplier Name</th>
                <th className="p-3">Corporate Phone</th>
                <th className="p-3">Corporate Address</th>
                <th className="p-3 text-center">Distribution License TRN</th>
                <th className="p-3 text-right">Outstanding Accounts Dues</th>
                <th className="p-3 text-center">Ledger Controls</th>
              </tr>
            )}
          </thead>
          <tbody className="divide-y divide-slate-800/50 font-medium">
            {activeTab === 'Customers' ? (
              /* Customers Tab lists */
              filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-bold">No registered patrons match criteria.</td>
                </tr>
              ) : (
                filteredCustomers.map(c => (
                  <tr key={c.id} className="hover:bg-slate-900/10">
                    <td className="p-3 text-white font-extrabold select-all">{c.name}</td>
                    <td className="p-3 select-all font-mono text-slate-400">{c.mobile}</td>
                    <td className="p-3 text-slate-400">{c.address || 'N/A'}</td>
                    <td className="p-3 text-center">
                      <span className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded ${
                        c.type === 'Wholesale' 
                          ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-500' 
                          : 'bg-indigo-505/10 border border-indigo-505/20 text-indigo-400'
                      }`}>
                        {c.type}
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold text-white">
                      {c.pendingAmount > 0 ? (
                        <span className="text-yellow-500 font-mono font-extrabold">{c.pendingAmount.toLocaleString()} AED</span>
                      ) : <span className="text-slate-500">None</span>}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setViewedHistoryParty({ id: c.id, name: c.name, type: 'Customer' })}
                          title="View Invoices Log"
                          className="p-1 px-2 text-[10px] bg-slate-800 text-slate-300 rounded hover:bg-slate-705 transition cursor-pointer"
                        >
                          Show Ledger
                        </button>
                        <button
                          onClick={() => openEditModal('Customer', c)}
                          className="p-1 text-slate-400 hover:text-white transition"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete('Customer', c.id, c.name)}
                          className="p-1 text-slate-500 hover:text-red-500 transition"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )
            ) : (
              /* Suppliers Tab lists */
              filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-bold">No registered suppliers match criteria.</td>
                </tr>
              ) : (
                filteredSuppliers.map(s => (
                  <tr key={s.id} className="hover:bg-slate-900/10 animate-fadeIn">
                    <td className="p-3 text-white font-extrabold select-all">{s.name}</td>
                    <td className="p-3 select-all font-mono text-slate-400">{s.phone}</td>
                    <td className="p-3 text-slate-400">{s.address || 'N/A'}</td>
                    <td className="p-3 text-center text-slate-300 select-all font-mono uppercase">
                      {s.vatNo || <span className="text-slate-500">N/A</span>}
                    </td>
                    <td className="p-3 text-right font-bold text-white">
                      {s.pendingDues > 0 ? (
                        <span className="text-orange-400 font-mono font-extrabold">{s.pendingDues.toLocaleString()} AED</span>
                      ) : <span className="text-slate-500">Clean</span>}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setViewedHistoryParty({ id: s.id, name: s.name, type: 'Supplier' })}
                          title="View purchase history"
                          className="p-1 px-2 text-[10px] bg-slate-800 text-slate-300 rounded hover:bg-slate-705 cursor-pointer"
                        >
                          Show Inward Log
                        </button>
                        <button
                          onClick={() => openEditModal('Supplier', s)}
                          className="p-1 text-slate-400 hover:text-white transition"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete('Supplier', s.id, s.name)}
                          className="p-1 text-slate-505 hover:text-red-500 transition"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )
            )}
          </tbody>
        </table>
      </div>

      {/* VIEW PARTY TRANSACTION LEDGER HISTORY MODAL */}
      {viewedHistoryParty && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 max-w-lg w-full p-6 rounded-2xl relative">
            <button
              onClick={() => setViewedHistoryParty(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X size={18} />
            </button>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <BookOpen size={15} className="text-red-500" />
              <span>Statement Account Ledger</span>
            </h3>
            <p className="text-xs text-slate-400 font-bold mb-4">{viewedHistoryParty.name} ({viewedHistoryParty.type})</p>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {targetedHistoryItems.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8 font-semibold">No transactional footprints found under this profile.</p>
              ) : (
                targetedHistoryItems.map((item, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-950/40 border border-slate-800/60 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-red-400">{item.code}</span>
                        <span className="text-[10px] text-zinc-500">{item.date}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.details}</p>
                    </div>
                    <span className={`font-mono font-bold ${item.isProfit ? 'text-emerald-400' : 'text-slate-300'}`}>
                      {item.isProfit ? '+' : '-'}{item.amount.toLocaleString()} AED
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setViewedHistoryParty(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg"
              >
                Close Statement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PATRON/SUPPLIER GENERAL ADD-EDIT MODAL FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 max-w-sm w-full p-6 rounded-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
            >
              <X size={18} />
            </button>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
              {modalMode === 'Create' ? 'Create new profile file' : 'Rewrite profile details'}
            </h3>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-slate-300">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Profile Entity Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Hassan Al-Futtaim"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-3 text-xs text-white focus:outline-none focus:border-red-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  {modalType === 'Customer' ? 'Mobile Digits' : 'Corporate Phone Number'}
                </label>
                <input
                  type="text"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="+971 XX XXX XXXX"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-3 text-xs text-white focus:outline-none"
                />
              </div>

              {modalType === 'Customer' ? (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Invoicing Account Category</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-2 text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="Retail">Retail Client</option>
                    <option value="Wholesale">Wholesale Broker</option>
                  </select>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">VAT/GST Tax TRN number</label>
                  <input
                    type="text"
                    value={vatNo}
                    onChange={(e) => setVatNo(e.target.value)}
                    placeholder="15 digit unique TRN"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-3 text-xs text-white focus:outline-none"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Address location</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Business Bay, Tower 1, Dubai"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-3 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-800 text-slate-400 text-[11px] rounded transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold rounded"
                >
                  Apply profile logs
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
