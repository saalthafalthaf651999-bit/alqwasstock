/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useERP } from '../context/ERPContext';
import { BrandType, IMEIStatus } from '../types';
import { Search, Filter, HelpCircle, ArrowUpRight, Award, Circle } from 'lucide-react';

export const StockModule: React.FC = () => {
  const { imeis, products, branches, suppliers, checkIMEIUnique } = useERP();

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [selectedBranch, setSelectedBranch] = useState<string>('All');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  // Search date ranges
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const brandsList: BrandType[] = [
    'Apple', 'Samsung', 'Vivo', 'Oppo', 'Realme', 'iQOO', 'Xiaomi', 'OnePlus', 'Honor', 'Nokia'
  ];

  const statusList: IMEIStatus[] = [
    'In Stock', 'Sold', 'Returned', 'Damaged', 'Reserved'
  ];

  // Filtering Logic
  const filteredIMEIs = useMemo(() => {
    return imeis.filter((item) => {
      const prod = products.find(p => p.id === item.productId);
      if (!prod) return false;

      // 1. Text Search: matches IMEI, product Name, product ID, color
      const matchText = item.imei.includes(searchTerm) || 
                        prod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        prod.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      // 2. Filters
      const matchBrand = selectedBrand === 'All' || prod.brand === selectedBrand;
      const matchBranch = selectedBranch === 'All' || item.branchId === selectedBranch;
      const matchSupplier = selectedSupplier === 'All' || item.supplierId === selectedSupplier;
      const matchStatus = selectedStatus === 'All' || item.status === selectedStatus;

      // 3. Date filtering
      let matchDate = true;
      if (dateFrom) {
        matchDate = matchDate && new Date(item.createdAt.split('T')[0]) >= new Date(dateFrom);
      }
      if (dateTo) {
        matchDate = matchDate && new Date(item.createdAt.split('T')[0]) <= new Date(dateTo);
      }

      return matchText && matchBrand && matchBranch && matchSupplier && matchStatus && matchDate;
    });
  }, [imeis, products, searchTerm, selectedBrand, selectedBranch, selectedSupplier, selectedStatus, dateFrom, dateTo]);

  // Aggregate stats
  const aggregateMetrics = useMemo(() => {
    const totalCount = filteredIMEIs.length;
    
    // total value is cost price summation of these specific IMEIs
    const totalValue = filteredIMEIs.reduce((sum, item) => {
      const prod = products.find(p => p.id === item.productId);
      return sum + (prod ? prod.purchasePrice : 0);
    }, 0);

    return { totalCount, totalValue };
  }, [filteredIMEIs, products]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/60 pb-5">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">IMEI METRIC WAREHOUSE</h2>
          <p className="text-xs text-slate-400 font-medium">Unique digital footprint tracking & inventory logs</p>
        </div>

        {/* Dynamic stock stats header widgets */}
        <div className="flex gap-4">
          <div className="bg-slate-905 border border-slate-800 p-2.5 px-4 rounded-xl text-xs flex flex-col justify-center">
            <span className="text-[10px] text-zinc-500 uppercase block font-bold">Scoped Stock Count</span>
            <span className="text-sm font-black text-white">{aggregateMetrics.totalCount} Units</span>
          </div>
          <div className="bg-slate-905 border border-slate-800 p-2.5 px-4 rounded-xl text-xs flex flex-col justify-center">
            <span className="text-[10px] text-zinc-500 uppercase block font-bold">Scoped Asset Worth</span>
            <span className="text-sm font-black text-white">{aggregateMetrics.totalValue.toLocaleString()} AED</span>
          </div>
        </div>
      </div>

      {/* Dynamic Advanced Filters Panel */}
      <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/80 space-y-4">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1">
          <Filter size={14} className="text-red-500" />
          <span>GRADING FILTER DESK (تصفية المخزون)</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          
          {/* Broad Search field */}
          <div className="md:col-span-4 relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Search exact IMEI, gadget variant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 text-xs focus:border-red-500/50 rounded-xl py-1.5 pl-9 pr-3 text-white placeholder-slate-600 focus:outline-none"
            />
          </div>

          {/* Brand dropdown */}
          <div className="md:col-span-2">
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-2 text-xs text-slate-300 focus:outline-none focus:border-red-500/40"
            >
              <option value="All">All Brands</option>
              {brandsList.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Branch dropdown */}
          <div className="md:col-span-2">
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-2 text-xs text-slate-300 focus:outline-none focus:border-red-500/40"
            >
              <option value="All">All Branches</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name.split(' ')[0]} Store</option>
              ))}
            </select>
          </div>

          {/* Supplier dropdown */}
          <div className="md:col-span-2">
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-2 text-xs text-slate-300 focus:outline-none focus:border-red-500/40"
            >
              <option value="All">All Suppliers</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name.split(' ')[0]}</option>
              ))}
            </select>
          </div>

          {/* Status dropdown */}
          <div className="md:col-span-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-2 text-xs text-slate-300 focus:outline-none focus:border-red-500/40"
            >
              <option value="All">All Statuses</option>
              {statusList.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Date Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800/60 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase shrink-0">Stocked From:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl py-1 px-2.5 text-slate-300"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase shrink-0">Stocked To:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl py-1 px-2.5 text-slate-300"
            />
          </div>
        </div>
      </div>

      {/* Main Stock Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/20">
        <table className="w-full text-left text-xs text-slate-300">
          <thead>
            <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 text-[10px] font-bold uppercase select-none">
              <th className="p-3">GALAXY IMEI CODE</th>
              <th className="p-3">Brand & Model Name</th>
              <th className="p-3">Current Location Store</th>
              <th className="p-3">Import Date</th>
              <th className="p-3">Procurement Source</th>
              <th className="p-3 text-center">Inward TRN Verified</th>
              <th className="p-3 text-right">Warehouse status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 font-medium">
            {filteredIMEIs.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500 font-bold">No registered units detected matching specifications.</td>
              </tr>
            ) : (
              filteredIMEIs.map((item) => {
                const prod = products.find(p => p.id === item.productId);
                const branchName = branches.find(b => b.id === item.branchId)?.name || 'Direct Depot';
                const supplierName = suppliers.find(s => s.id === item.supplierId)?.name || 'Unknown Partner';

                return (
                  <tr key={item.imei} className="hover:bg-slate-900/10">
                    {/* IMEI Code */}
                    <td className="p-3 select-all font-mono font-bold text-white tracking-wider">
                      {item.imei}
                    </td>

                    {/* Product Brand / Name */}
                    <td className="p-3 select-all">
                      <div className="font-extrabold text-slate-200">
                        {prod ? prod.name : 'Unknown Product'}
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono font-bold mt-0.5 uppercase">
                        {prod?.brand} • {prod?.category} • {prod?.color}
                      </div>
                    </td>

                    {/* Location Branch */}
                    <td className="p-3 text-slate-300">
                      {branchName.replace('Showroom', '').replace('Plaza', '')}
                    </td>

                    {/* Date */}
                    <td className="p-3 text-slate-400 font-mono">
                      {item.createdAt.split('T')[0]}
                    </td>

                    {/* Supplier */}
                    <td className="p-3 text-slate-400 truncate max-w-[150px]">
                      {supplierName}
                    </td>

                    {/* TRN Match indicator */}
                    <td className="p-3 text-center">
                      <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                    </td>

                    {/* Status badge */}
                    <td className="p-3 text-right">
                      <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold tracking-wider uppercase border ${
                        item.status === 'In Stock' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : item.status === 'Sold'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          : item.status === 'Returned'
                          ? 'bg-orange-500/10 text-orange-400 border-orange-500/20 shadow-inner'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {item.status}
                      </span>
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
