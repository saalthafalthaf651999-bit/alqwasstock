/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useERP } from '../context/ERPContext';
import { 
  TrendingUp, Download, Printer, Filter, 
  HelpCircle, Calendar, LineChart, FileText 
} from 'lucide-react';

type ReportType =
  | 'Sales'
  | 'Purchase'
  | 'Expense'
  | 'Stock'
  | 'Dues'
  | 'Profit'
  | 'IMEI'
  | 'Supplier';

export const ReportsModule: React.FC = () => {
  const { sales, purchases, imeis, products, suppliers, branches, expenses } = useERP();

  const [activeReport, setActiveReport] = useState<ReportType>('Sales');

  // Filter Parameters
  const [selectedBranchId, setSelectedBranchId] = useState('All');
  const [filterPeriod, setFilterPeriod] = useState<'All' | 'Daily' | 'Monthly' | 'Custom'>('All');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  // IMEI search targeting specific reports
  const [imeiQuery, setImeiQuery] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];
  const thisMonthStr = new Date().toISOString().substr(0, 7); // "2026-05"

  // Date limit checker is applicable across records
  const checkDateInLimit = (dateStr: string) => {
    const dStr = dateStr.split('T')[0];
    if (filterPeriod === 'Daily') {
      return dStr === todayStr;
    }
    if (filterPeriod === 'Monthly') {
      return dStr.startsWith(thisMonthStr);
    }
    if (filterPeriod === 'Custom') {
      let valid = true;
      if (customFrom) {
        valid = valid && new Date(dStr) >= new Date(customFrom);
      }
      if (customTo) {
        valid = valid && new Date(dStr) <= new Date(customTo);
      }
      return valid;
    }
    return true; // All
  };

  // 1. Sales Report calculations
  const salesReportData = useMemo(() => {
    return sales.filter(s => {
      const matchBranch = selectedBranchId === 'All' || s.branchId === selectedBranchId;
      const matchDate = checkDateInLimit(s.date);
      return matchBranch && matchDate;
    });
  }, [sales, selectedBranchId, filterPeriod, customFrom, customTo]);

  // 2. Purchases Report
  const purchaseReportData = useMemo(() => {
    return purchases.filter(p => {
      const matchBranch = selectedBranchId === 'All' || p.branchId === selectedBranchId;
      const matchDate = checkDateInLimit(p.date);
      return matchBranch && matchDate;
    });
  }, [purchases, selectedBranchId, filterPeriod, customFrom, customTo]);

  // Expenses Report
  const expensesReportData = useMemo(() => {
    return (expenses || []).filter(e => {
      const matchBranch = selectedBranchId === 'All' || e.branchId === selectedBranchId;
      const matchDate = checkDateInLimit(e.date);
      return matchBranch && matchDate;
    });
  }, [expenses, selectedBranchId, filterPeriod, customFrom, customTo]);

  // 3. Stock Valuation Report
  const stockReportData = useMemo(() => {
    return imeis.filter(i => {
      const matchBranch = selectedBranchId === 'All' || i.branchId === selectedBranchId;
      const matchInStock = i.status === 'In Stock';
      return matchBranch && matchInStock;
    });
  }, [imeis, selectedBranchId]);

  // 4. Pending Payment dues report (supplier level)
  const outstandingDuesData = useMemo(() => {
    return suppliers.filter(s => s.pendingDues > 0);
  }, [suppliers]);

  // 5. Profit reporting metrics
  // Groups profits by billing codes and maps sales discounts
  const profitReportData = useMemo(() => {
    return salesReportData.map(s => {
      const costAmount = s.items.reduce((sum, item) => {
        const prod = products.find(p => p.id === item.productId);
        return sum + (prod ? prod.purchasePrice : 0);
      }, 0);
      const grossProfit = s.finalAmount - costAmount;
      return {
        invoiceNo: s.invoiceNo,
        date: s.date.split('T')[0],
        totalSale: s.finalAmount,
        totalCost: costAmount,
        profit: grossProfit,
        margin: s.finalAmount > 0 ? (grossProfit / s.finalAmount) * 100 : 0
      };
    });
  }, [salesReportData, products]);

  // 6. IMEI sales tracking search (looks up historic track of device)
  const imeiSalesHistory = useMemo(() => {
    if (!imeiQuery) return [];
    
    // Look up IMEI in transactional items
    const matches: any[] = [];
    sales.forEach(s => {
      s.items.forEach(item => {
        if (item.imei.includes(imeiQuery)) {
          matches.push({
            imei: item.imei,
            type: 'SALES TRANSACTION OUTWARD',
            code: s.invoiceNo,
            date: s.date.split('T')[0],
            details: `Sold to unique client ID ledger. Representative: ${s.salesPerson.toUpperCase()}`,
            value: item.total
          });
        }
      });
    });

    purchases.forEach(p => {
      p.items.forEach(item => {
        if (item.imei.includes(imeiQuery)) {
          matches.push({
            imei: item.imei,
            type: 'PURCHASE REPLENISHMENT INWARD',
            code: p.invoiceNo,
            date: p.date.split('T')[0],
            details: `Replenished warehouse. Cost: ${item.purchaseRate} AED`,
            value: item.purchaseRate
          });
        }
      });
    });

    return matches;
  }, [sales, purchases, imeiQuery]);

  // Combined aggregation totals computed dynamically
  const reportingTotalsSummary = useMemo(() => {
    if (activeReport === 'Sales') {
      const count = salesReportData.length;
      const sum = salesReportData.reduce((tot, s) => tot + s.finalAmount, 0);
      return { count, label: 'Sales Invoices', sum, sumLabel: 'Turnover value (AED)' };
    }
    if (activeReport === 'Purchase') {
      const count = purchaseReportData.length;
      const sum = purchaseReportData.reduce((tot, p) => tot + p.totalAmount, 0);
      return { count, label: 'Inward dockets', sum, sumLabel: 'Purchased Assets cost (AED)' };
    }
    if (activeReport === 'Stock') {
      const count = stockReportData.length;
      const sum = stockReportData.reduce((tot, item) => {
        const prod = products.find(p => p.id === item.productId);
        return tot + (prod ? prod.purchasePrice : 0);
      }, 0);
      return { count, label: 'Stocked Items', sum, sumLabel: 'Available Asset Worth (AED)' };
    }
    if (activeReport === 'Dues') {
      const count = outstandingDuesData.length;
      const sum = outstandingDuesData.reduce((tot, s) => tot + s.pendingDues, 0);
      return { count, label: 'Supplier accounts', sum, sumLabel: 'Accounts Payable Dues (AED)' };
    }
    if (activeReport === 'Profit') {
      const count = profitReportData.length;
      const sum = profitReportData.reduce((tot, p) => tot + p.profit, 0);
      return { count, label: 'Profited sales', sum, sumLabel: 'Net Margin Profits (AED)' };
    }
    if (activeReport === 'Expense') {
      const count = expensesReportData.length;
      const sum = expensesReportData.reduce((tot, e) => tot + e.amount, 0);
      return { count, label: 'Logged Expenses', sum, sumLabel: 'Showroom Expenses Total (AED)' };
    }
    return null;
  }, [activeReport, salesReportData, purchaseReportData, stockReportData, outstandingDuesData, profitReportData, expensesReportData, products]);

  // Multi-format XLS/CSV simulated direct exports download link
  const exportSimulatedCSV = () => {
    let header = '';
    let rows = '';

    if (activeReport === 'Sales') {
      header = 'Invoice Code,Date,No Items,Settled Amount (AED)\r\n';
      salesReportData.forEach(s => {
        rows += `"${s.invoiceNo}","${s.date.split('T')[0]}",${s.items.length},${s.finalAmount}\r\n`;
      });
    } else if (activeReport === 'Purchase') {
      header = 'Docket Code,Replenish Date,Items,Valuation Cost (AED)\r\n';
      purchaseReportData.forEach(p => {
        rows += `"${p.invoiceNo}","${p.date.split('T')[0]}",${p.items.length},${p.totalAmount}\r\n`;
      });
    } else if (activeReport === 'Expense') {
      header = 'Voucher Ref,Date,Category Head,Description,Amount (AED),Paid By\r\n';
      expensesReportData.forEach(e => {
        rows += `"${e.voucherNo}","${e.date.split('T')[0]}","${e.category}","${e.description.replace(/"/g, '""')}",${e.amount},"${e.paidBy}"\r\n`;
      });
    } else if (activeReport === 'Stock') {
      header = 'IMEI Code,Product specifications,Warehouse Location Store,Buying Rate\r\n';
      stockReportData.forEach(i => {
        const prod = products.find(p => p.id === i.productId);
        rows += `"${i.imei}","${prod?.brand || ''} ${prod?.name || ''}",${i.branchId},${prod?.purchasePrice}\r\n`;
      });
    } else if (activeReport === 'Profit') {
      header = 'Invoiced Code,Date,Sale val (AED),Buying cost (AED),Profit margin\r\n';
      profitReportData.forEach(p => {
        rows += `"${p.invoiceNo}","${p.date}",${p.totalSale},${p.totalCost},${p.profit}\r\n`;
      });
    } else {
      header = 'Report Type,Exported On\r\n';
      rows += `"${activeReport}","${todayStr}"\r\n`;
    }

    const csvContent = `data:text/csv;charset=utf-8,` + header + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Dubai_Showroom_${activeReport}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const menuButtons: { type: ReportType; label: string }[] = [
    { type: 'Sales', label: 'Sales Reports Invoices' },
    { type: 'Purchase', label: 'Purchases Rep-Index' },
    { type: 'Expense', label: 'Showroom Expenses' },
    { type: 'Stock', label: 'Stock Valuation list' },
    { type: 'Dues', label: 'Supplier Due accounts' },
    { type: 'Profit', label: 'Net Profit Margins' },
    { type: 'IMEI', label: 'IMEI Transaction lookup' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Upper header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/60 pb-5">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            <LineChart size={22} className="text-red-500" />
            <span>EXECUTIVE REPORT ANALYZER</span>
          </h2>
          <p className="text-xs text-slate-400 font-medium">Bilingual Dubai accounts indices & dynamic spreadsheets</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={exportSimulatedCSV}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition cursor-pointer"
          >
            <Download size={13} />
            <span>Direct Excel CSV</span>
          </button>
          
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-500 hover:text-white text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-[0_0_10px_rgba(239,68,68,0.2)]"
          >
            <Printer size={13} />
            <span>Thermal Print desk</span>
          </button>
        </div>
      </div>

      {/* Main Grid options */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left selector col (3 cols) */}
        <div className="lg:col-span-3 space-y-2 select-none">
          {menuButtons.map(btn => (
            <button
              key={btn.type}
              onClick={() => {
                setActiveReport(btn.type);
                setImeiQuery('');
              }}
              className={`w-full text-left py-2.5 px-4 rounded-xl text-xs font-bold tracking-wide transition uppercase cursor-pointer ${
                activeReport === btn.type
                  ? 'bg-red-650/15 border border-red-500/40 text-red-400 font-extrabold shadow-[0_0_15px_rgba(239,68,68,0.03)]'
                  : 'bg-slate-900/20 border border-slate-850 text-slate-400 hover:text-slate-300 hover:bg-slate-900/50'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Right reporting col (9 cols) */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* Filtering Widgets Panel */}
          <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/80 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Filter size={13} />
              <span>Report filtration rules</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Branch scope Selector */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Specific Branch filter</label>
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs py-1.5 px-2 text-slate-300 focus:outline-none focus:border-red-500/40"
                  disabled={activeReport === 'Dues'} // Dues are supplier unique, not branch partitioned generally
                >
                  <option value="All">All Dubai Branches merged</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* Date metric selector */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Report calendar limits</label>
                <select
                  value={filterPeriod}
                  onChange={(e) => setFilterPeriod(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs py-1.5 px-2 text-slate-300 focus:outline-none focus:border-red-500/40"
                  disabled={activeReport === 'Stock' || activeReport === 'Dues'}
                >
                  <option value="All">Complete Historic Logbooks</option>
                  <option value="Daily">Today sales & inward</option>
                  <option value="Monthly">Current month aggregate</option>
                  <option value="Custom">Custom Date Parameters-Range</option>
                </select>
              </div>

              {/* Custom dates indicators */}
              {filterPeriod === 'Custom' && (
                <div className="col-span-1 grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <label className="text-slate-500 block">From</label>
                    <input
                      type="date"
                      value={customFrom}
                      onChange={(e) => setCustomFrom(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 py-1 px-1.5 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block">To (inclusive)</label>
                    <input
                      type="date"
                      value={customTo}
                      onChange={(e) => setCustomTo(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 py-1 px-1.5 rounded text-white"
                    />
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Dynamic reporting aggregate widget box */}
          {reportingTotalsSummary && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950/60 p-4 border border-slate-800 rounded-xl">
                <span className="text-[9px] text-zinc-500 uppercase block font-bold">{reportingTotalsSummary.label} count</span>
                <span className="text-base font-black text-white">{reportingTotalsSummary.count} Records file</span>
              </div>
              <div className="bg-red-600/5 p-4 border border-red-500/15 rounded-xl">
                <span className="text-[9px] text-red-500 uppercase block font-bold">{reportingTotalsSummary.sumLabel}</span>
                <span className="text-base font-black text-white">{reportingTotalsSummary.sum.toLocaleString()} AED</span>
              </div>
            </div>
          )}

          {/* Core dynamic tables based on active tabs */}
          {activeReport === 'Sales' && (
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/20">
              <table className="w-full text-left text-xs text-slate-300">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 text-[10px] font-bold uppercase select-none">
                    <th className="p-3">Ref POS Code</th>
                    <th className="p-3">Billing Date</th>
                    <th className="p-3">Client details</th>
                    <th className="p-3 text-center">Settled Channel</th>
                    <th className="p-3 text-right">Sum Worth (AED)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {salesReportData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500 font-bold">No retail sales found.</td>
                    </tr>
                  ) : (
                    salesReportData.map(s => (
                      <tr key={s.id} className="hover:bg-slate-900/5">
                        <td className="p-3 font-mono font-bold text-red-400 select-all">{s.invoiceNo}</td>
                        <td className="p-3">{s.date.split('T')[0]}</td>
                        <td className="p-3 font-semibold text-white">
                          {suppliers.find(x => x.id === s.customerId)?.name || 'Retail Client'}
                        </td>
                        <td className="p-3 text-center text-slate-400">{s.paymentMethod}</td>
                        <td className="p-3 text-right font-black text-white">{s.finalAmount.toLocaleString()} AED</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeReport === 'Purchase' && (
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/20">
              <table className="w-full text-left text-xs text-slate-300">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 text-[10px] font-bold uppercase select-none">
                    <th className="p-3">Docker ID Code</th>
                    <th className="p-3">Inward Date</th>
                    <th className="p-3">Supplying Distributor</th>
                    <th className="p-3 text-center">Balance Stocked</th>
                    <th className="p-3 text-right">Valuation Sum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium font-sans">
                  {purchaseReportData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500 font-bold">No purchases logged.</td>
                    </tr>
                  ) : (
                    purchaseReportData.map(p => {
                      const sName = suppliers.find(s => s.id === p.supplierId)?.name || 'Direct Depot';
                      return (
                        <tr key={p.id}>
                          <td className="p-3 font-mono text-white font-extrabold select-all">{p.invoiceNo}</td>
                          <td className="p-3">{p.date.split('T')[0]}</td>
                          <td className="p-3 text-slate-305 font-bold">{sName}</td>
                          <td className="p-3 text-center text-slate-400">{p.items.length} units</td>
                          <td className="p-3 text-right font-black text-white">{p.totalAmount.toLocaleString()} AED</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeReport === 'Stock' && (
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/20">
              <table className="w-full text-left text-xs text-slate-300">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 text-[10px] font-bold uppercase select-none">
                    <th className="p-3">IMEI code</th>
                    <th className="p-3">Specs Name</th>
                    <th className="p-3">Store Location</th>
                    <th className="p-3 text-right">Cost Price (AED)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {stockReportData.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-500 font-bold">No items in warehouse.</td>
                    </tr>
                  ) : (
                    stockReportData.map(i => {
                      const prod = products.find(p => p.id === i.productId);
                      const brName = branches.find(b => b.id === i.branchId)?.name || 'Warehouse';
                      return (
                        <tr key={i.imei} className="hover:bg-slate-900/5">
                          <td className="p-3 font-mono font-bold text-white select-all">{i.imei}</td>
                          <td className="p-3 font-semibold text-slate-300">{prod ? `${prod.brand} ${prod.name}` : 'Unknown SKU'}</td>
                          <td className="p-3 text-slate-500">{brName.replace('Showroom', '')}</td>
                          <td className="p-3 text-right font-black text-slate-200">{(prod ? prod.purchasePrice : 0).toLocaleString()} AED</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeReport === 'Dues' && (
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/20">
              <table className="w-full text-left text-xs text-slate-300">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 text-[10px] font-bold uppercase select-none">
                    <th className="p-3">Company Distributor</th>
                    <th className="p-3">Support Phone</th>
                    <th className="p-3">TRN Code</th>
                    <th className="p-3 text-right">Outstanding balance (Payable)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {outstandingDuesData.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-500 font-semibold text-emerald-400">Perfect. Zero outstanding account dues payable.</td>
                    </tr>
                  ) : (
                    outstandingDuesData.map(s => (
                      <tr key={s.id}>
                        <td className="p-3 text-white font-extrabold">{s.name}</td>
                        <td className="p-3 font-mono text-slate-400">{s.phone}</td>
                        <td className="p-3 font-mono text-slate-500 select-all">{s.vatNo || 'None'}</td>
                        <td className="p-3 text-right font-black text-[#ef4444] font-mono">{s.pendingDues.toLocaleString()} AED</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeReport === 'Profit' && (
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/20 animate-fadeIn">
              <table className="w-full text-left text-xs text-slate-300">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 text-[10px] font-bold uppercase select-none">
                    <th className="p-3">Invoice Ref No</th>
                    <th className="p-3">Transaction Date</th>
                    <th className="p-3 text-right">Sale worth (A)</th>
                    <th className="p-3 text-right font-medium">Purchase Cost (B)</th>
                    <th className="p-3 text-right text-emerald-400">Net Profit (A - B)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {profitReportData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500 font-bold">No profitable transactions matching dates.</td>
                    </tr>
                  ) : (
                    profitReportData.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/5">
                        <td className="p-3 font-mono font-bold text-slate-400 select-all">{p.invoiceNo}</td>
                        <td className="p-3">{p.date}</td>
                        <td className="p-3 text-right">{p.totalSale.toLocaleString()} AED</td>
                        <td className="p-3 text-right text-slate-500">{p.totalCost.toLocaleString()} AED</td>
                        <td className="p-3 text-right font-black text-emerald-400 font-mono">{p.profit.toLocaleString()} AED</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeReport === 'Expense' && (
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/20 animate-fadeIn font-medium">
              <table className="w-full text-left text-xs text-slate-300">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 text-[10px] font-bold uppercase select-none">
                    <th className="p-3">Voucher Ref</th>
                    <th className="p-3">Voucher Date</th>
                    <th className="p-3">Category Head</th>
                    <th className="p-3">Description Particulars</th>
                    <th className="p-3 text-right">Amount (AED)</th>
                    <th className="p-3 text-center">Paid By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {expensesReportData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 font-bold">No showroom expenses matching criteria.</td>
                    </tr>
                  ) : (
                    expensesReportData.map((e, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/5">
                        <td className="p-3 font-mono font-bold text-slate-450 select-all">{e.voucherNo}</td>
                        <td className="p-3 font-mono">{e.date.slice(0, 10)}</td>
                        <td className="p-3 font-semibold text-red-400">
                          <span className="px-2 py-0.5 bg-red-950/20 border border-red-900/10 rounded">
                            {e.category}
                          </span>
                        </td>
                        <td className="p-3 text-slate-200">{e.description}</td>
                        <td className="p-3 text-right font-black font-mono text-white text-sm">{e.amount.toLocaleString()} AED</td>
                        <td className="p-3 text-center text-slate-400 uppercase font-bold">{e.paidBy}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeReport === 'IMEI' && (
            /* Historical IMEI scanning searching */
            <div className="space-y-4">
              <div className="space-y-1 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Historic IMEI Laser Trace</label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={16}
                    value={imeiQuery}
                    onChange={(e) => setImeiQuery(e.target.value.replace(/\D/g, ''))} // numbers
                    placeholder="Enter unique 15-digit IMEI tracking key..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 pl-4 text-xs font-mono tracking-widest text-[#ef4444]"
                  />
                </div>
                <span className="text-[9px] text-slate-500 italic block mt-1">Logs chronological footprint of specific stock item in the ERP registries.</span>
              </div>

              <div className="space-y-3">
                {imeiQuery && imeiSalesHistory.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6 font-bold">No historical file logs found for targeted IMEI.</p>
                ) : (
                  imeiSalesHistory.map((item, idx) => (
                    <div key={idx} className="p-4 bg-slate-950 border border-slate-850 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs animate-fadeIn">
                      <div className="space-y-1">
                        <span className={`text-[9px] px-2 py-0.2 rounded font-extrabold uppercase ${
                          item.type.includes('OUTWARD') ? 'bg-blue-600/10 text-blue-400 border border-blue-605/15' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-505/15'
                        }`}>
                          {item.type}
                        </span>
                        <h4 className="font-mono text-white text-xs font-extrabold pt-1">IMEI Code Trace: {item.imei}</h4>
                        <p className="text-[10px] text-slate-400 font-semibold">{item.details}</p>
                      </div>

                      <div className="text-right sm:items-end flex flex-col justify-center">
                        <span className="font-mono text-red-400 text-[10px] block font-bold">Ref: {item.code}</span>
                        <span className="text-xs font-black text-white">{item.value.toLocaleString()} AED</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
