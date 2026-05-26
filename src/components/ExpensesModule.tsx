/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useERP } from '../context/ERPContext';
import { Expense } from '../types';
import { Search, Plus, Edit2, Trash2, X, Check, Landmark, Calendar, User, FileText, ArrowUpRight, DollarSign } from 'lucide-react';

export const ExpensesModule: React.FC = () => {
  const { 
    expenses, 
    addExpense, 
    updateExpense, 
    deleteExpense,
    currentUser,
    branches
  } = useERP();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedBranch, setSelectedBranch] = useState<string>('All');

  // Manual input form columns state
  const [showAddColumns, setShowAddColumns] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [voucherNo, setVoucherNo] = useState('');
  const [category, setCategory] = useState('DEWA Utilities');
  const [customCategory, setCustomCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [branchId, setBranchId] = useState(currentUser?.branchId || 'b1');
  const [paidBy, setPaidBy] = useState(currentUser?.username || 'sameer');

  // Categories list
  const categoryPresets = [
    'Showroom Rent',
    'DEWA Utilities',
    'Showroom Pantry',
    'Staff Salary',
    'Office Stationery',
    'Marketing & Ads',
    'Government & License Fees',
    'Fuel & Transport',
    'Other Expenses'
  ];

  // Helper clear form
  const resetForm = () => {
    setVoucherNo(`EXP-${String(expenses.length + 104).padStart(3, '0')}`);
    setCategory('DEWA Utilities');
    setCustomCategory('');
    setDescription('');
    setAmount(0);
    setDate(new Date().toISOString().slice(0, 10));
    setBranchId(currentUser?.branchId || 'b1');
    setPaidBy(currentUser?.username || 'sameer');
    setEditingId(null);
  };

  // Turn on manual creation mode
  const initAddExpense = () => {
    resetForm();
    setShowAddColumns(true);
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert('Error: Expense amount must be a positive number.');
      return;
    }

    const finalCategory = category === 'Custom' ? (customCategory || 'Other Expenses') : category;
    const expensePayload = {
      voucherNo: voucherNo || `EXP-${String(expenses.length + 104).padStart(3, '0')}`,
      category: finalCategory,
      description: description || 'No Description',
      amount,
      date: new Date(date).toISOString(),
      branchId,
      paidBy: paidBy || currentUser?.username || 'Admin'
    };

    if (editingId) {
      updateExpense(editingId, expensePayload);
    } else {
      addExpense(expensePayload);
    }

    setShowAddColumns(false);
    resetForm();
  };

  const handleEdit = (exp: Expense) => {
    setEditingId(exp.id);
    setVoucherNo(exp.voucherNo);
    
    if (categoryPresets.includes(exp.category)) {
      setCategory(exp.category);
      setCustomCategory('');
    } else {
      setCategory('Custom');
      setCustomCategory(exp.category);
    }

    setDescription(exp.description);
    setAmount(exp.amount);
    setDate(exp.date.slice(0, 10));
    setBranchId(exp.branchId);
    setPaidBy(exp.paidBy);
    setShowAddColumns(true);
  };

  // Filters
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchSearch = e.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          e.voucherNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          e.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          e.paidBy.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchCategory = selectedCategory === 'All' || e.category === selectedCategory;
      const matchBranch = selectedBranch === 'All' || e.branchId === selectedBranch;

      return matchSearch && matchCategory && matchBranch;
    });
  }, [expenses, searchTerm, selectedCategory, selectedBranch]);

  // Total Summary values derived instantly
  const totalExpensesSum = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  const todayExpensesSum = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return expenses
      .filter((e) => e.date.slice(0, 10) === todayStr)
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  return (
    <div className="space-y-6" id="expenses-module-root">
      
      {/* Header Dashboard section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900/40 p-4 rounded-3xl border border-slate-800/80">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight uppercase flex items-center gap-2">
            <span className="p-2 bg-red-600/10 rounded-xl text-red-500 border border-red-500/10">
              <Landmark size={20} />
            </span>
            <span>Showroom Expenses Ledger</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 uppercase font-semibold">
            Track custom operational expenditures, utility bills, rent, and overheads manually.
          </p>
        </div>

        <button
          onClick={initAddExpense}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs rounded-xl uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(220,38,38,0.25)] hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Plus size={14} />
          <span>Type Expense (تسجيل مصاريف)</span>
        </button>
      </div>

      {/* Grid of aggregate KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="bg-gradient-to-br from-slate-900 to-black/80 border border-slate-800 p-5 rounded-2xl flex items-center justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 rounded-full blur-xl group-hover:bg-red-600/10 transition"></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Today Expenses</p>
            <span className="text-2xl font-black text-white font-mono mt-1 block">
              {todayExpensesSum.toLocaleString()} <span className="text-red-500 text-xs">AED</span>
            </span>
            <p className="text-[9px] text-slate-500 mt-1">Directly generated on standard calendar day</p>
          </div>
          <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl text-red-400">
            <Calendar size={18} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-black/80 border border-slate-800 p-5 rounded-2xl flex items-center justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-full blur-xl group-hover:bg-yellow-500/10 transition"></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Accumulated Ledger Total</p>
            <span className="text-2xl font-black text-white font-mono mt-1 block">
              {totalExpensesSum.toLocaleString()} <span className="text-yellow-500 text-xs">AED</span>
            </span>
            <p className="text-[9px] text-slate-500 mt-1">Based on actively selected filter parameters</p>
          </div>
          <div className="p-3 bg-yellow-500/5 border border-yellow-500/10 rounded-xl text-yellow-400">
            <Landmark size={18} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-black/80 border border-slate-800 p-5 rounded-2xl flex items-center justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition"></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Transaction Count</p>
            <span className="text-2xl font-black text-white font-mono mt-1 block">
              {filteredExpenses.length} <span className="text-blue-500 text-xs text-[10px]">Records</span>
            </span>
            <p className="text-[9px] text-slate-500 mt-1">Approved ledger entries in database</p>
          </div>
          <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl text-blue-400">
            <FileText size={18} />
          </div>
        </div>

      </div>

      {/* Manual Column-based input form shown when "+ Type Expense" clicked */}
      {showAddColumns && (
        <form onSubmit={handleSaveExpense} className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-4 animate-fadeIn relative">
          <button
            type="button"
            onClick={() => { setShowAddColumns(false); setEditingId(null); }}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X size={18} />
          </button>

          <h3 className="text-xs font-bold text-white uppercase tracking-widest border-b border-slate-800 pb-2 mb-4 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
            <span>{editingId ? 'Edit Manual Expense' : 'Type Manual Expense Columns'}</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Voucher # column */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Voucher/Receipt #</label>
              <input
                type="text"
                required
                placeholder="e.g. EXP-104"
                value={voucherNo}
                onChange={(e) => setVoucherNo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-red-500/50 uppercase font-mono"
              />
            </div>

            {/* Category selection column */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Expense Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-red-500/50"
              >
                {categoryPresets.map((preset) => (
                  <option key={preset} value={preset}>{preset}</option>
                ))}
                <option value="Custom">- Type Custom Category -</option>
              </select>
            </div>

            {/* Custom Category Input if selected, or default Amount */}
            {category === 'Custom' ? (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Custom Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="Type category manually"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-red-500/50"
                />
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Amount (AED)</label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    placeholder="e.g. 1500"
                    value={amount || ''}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-3 pr-10 text-xs text-white font-mono font-bold focus:outline-none focus:border-red-500/50"
                  />
                  <span className="absolute top-2 right-3 text-[10px] text-slate-500 font-bold font-mono">AED</span>
                </div>
              </div>
            )}

            {/* Staff / rep Column */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Spent/Paid By</label>
              <input
                type="text"
                required
                placeholder="Staff username"
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-red-500/50 font-semibold"
              />
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center pt-2">
            
            {/* If Custom active, show Amount here so alignment persists */}
            {category === 'Custom' && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Amount (AED)</label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    placeholder="e.g. 1500"
                    value={amount || ''}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-3 pr-10 text-xs text-white font-mono font-bold focus:outline-none focus:border-red-500/50"
                  />
                  <span className="absolute top-2 right-3 text-[10px] text-slate-500 font-bold font-mono">AED</span>
                </div>
              </div>
            )}

            {/* Date column input */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Voucher Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-red-500/50 font-mono"
              />
            </div>

            {/* Outlet selection */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Allocated Outlet</label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-red-500/50"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Description/Note column */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Details & Description</label>
              <input
                type="text"
                required
                placeholder="Give transaction summary particulars..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-red-500/50"
              />
            </div>

          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800/60">
            <button
              type="button"
              onClick={() => { setShowAddColumns(false); setEditingId(null); }}
              className="px-4 py-2 border border-slate-805 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition shadow-[0_0_15px_rgba(16,185,129,0.2)] cursor-pointer"
            >
              {editingId ? 'Save (حفظ التعديل)' : 'Save Expense (إضافة المصروف)'}
            </button>
          </div>
        </form>
      )}

      {/* FILTER CONTROLS BAR */}
      <div className="bg-[#0e1219] border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row gap-3 items-center justify-between">
        
        {/* Search bar */}
        <div className="relative w-full md:max-w-xs">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 pointer-events-none">
            <Search size={14} />
          </span>
          <input
            type="text"
            placeholder="Search by ref, category or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-red-500/50 placeholder-slate-600"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-[10px] text-slate-500 uppercase font-bold whitespace-nowrap">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-white rounded-xl py-2 px-3 focus:outline-none focus:border-red-500/40 w-full sm:w-44"
            >
              <option value="All">All Categories</option>
              {categoryPresets.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-[10px] text-slate-500 uppercase font-bold whitespace-nowrap">Outlet:</span>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-white rounded-xl py-2 px-3 focus:outline-none focus:border-red-500/40 w-full sm:w-44"
            >
              <option value="All">All Outlets</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name.split(' ')[0]}</option>
              ))}
            </select>
          </div>

        </div>

      </div>

      {/* EXPENSES HISTORIC LIST TABLE */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/10">
        <table className="w-full text-left text-xs text-slate-300">
          <thead>
            <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 text-[10px] font-bold uppercase select-none">
              <th className="p-3">Voucher Ref</th>
              <th className="p-3">Date</th>
              <th className="p-3">Category Head</th>
              <th className="p-3">Description Particulars</th>
              <th className="p-3 text-right">Amount (AED)</th>
              <th className="p-3 text-center">Outlet / branch</th>
              <th className="p-3 text-center">Paid By</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500 font-bold">
                  No showroom expenses matched the query parameters.
                </td>
              </tr>
            ) : (
              filteredExpenses.map((exp) => {
                const outletName = branches.find((b) => b.id === exp.branchId)?.name.split(' ')[0] || 'Dubai HQ';
                return (
                  <tr key={exp.id} className="hover:bg-slate-900/20 border-b border-slate-900/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-white tracking-wide">{exp.voucherNo}</td>
                    <td className="p-3 text-slate-400 font-semibold font-mono">
                      {new Date(exp.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="p-3 font-bold text-red-400">
                      <span className="px-2.5 py-0.5 bg-red-950/40 border border-red-900/30 rounded-full text-[10px]">
                        {exp.category}
                      </span>
                    </td>
                    <td className="p-3 text-slate-200">{exp.description}</td>
                    <td className="p-3 text-right font-black font-mono text-white text-sm">
                      {exp.amount.toLocaleString()} AED
                    </td>
                    <td className="p-3 text-center text-slate-300 font-bold">
                      <span className="px-2 py-0.5 bg-slate-800/80 rounded border border-slate-705 text-[10px] uppercase">
                        {outletName}
                      </span>
                    </td>
                    <td className="p-3 text-center text-slate-400 font-semibold uppercase">{exp.paidBy}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleEdit(exp)}
                          title="Edit transaction details"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg hover:text-white transition cursor-pointer"
                        >
                          <Edit2 size={11} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you absolutely sure you want to delete expense ${exp.voucherNo}: ${exp.category}?`)) {
                              deleteExpense(exp.id);
                            }
                          }}
                          title="Discard and send to trash"
                          className="p-1.5 bg-red-950/30 hover:bg-red-900/40 text-red-400 hover:text-red-300 rounded-lg transition border border-red-900/10 cursor-pointer"
                        >
                          <Trash2 size={11} />
                        </button>
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
  );
};
