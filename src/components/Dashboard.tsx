/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { useERP } from '../context/ERPContext';
import { 
  TrendingUp, ShoppingBag, Landmark, ArrowUpRight, 
  AlertTriangle, DollarSign, ArrowDownRight, Layers,
  ChevronRight, Sparkles, Activity, Award, HelpCircle
} from 'lucide-react';
import { BrandType } from '../types';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { 
    sales, 
    purchases, 
    imeis, 
    products, 
    suppliers, 
    branches, 
    settings, 
    currentBranchId,
    expenses
  } = useERP();

  // Helper date parsing to isolate Today
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Today Sales total
  const todaySalesVal = useMemo(() => {
    return sales
      .filter(s => s.date.split('T')[0] === todayStr)
      .reduce((sum, s) => sum + s.finalAmount, 0);
  }, [sales, todayStr]);

  // 2. Total Sales total
  const totalSalesVal = useMemo(() => {
    return sales.reduce((sum, s) => sum + s.finalAmount, 0);
  }, [sales]);

  // 3. Today Expense (Purchases registered today + manually logged expenses)
  const todayExpenseVal = useMemo(() => {
    const purchaseExpense = purchases
      .filter(p => p.date.split('T')[0] === todayStr)
      .reduce((sum, p) => sum + p.totalAmount, 0);
    const customExpense = (expenses || [])
      .filter(e => e.date.split('T')[0] === todayStr)
      .reduce((sum, e) => sum + e.amount, 0);
    return purchaseExpense + customExpense;
  }, [purchases, expenses, todayStr]);

  // 4. Total Expense (All purchases + manually logged expenses)
  const totalExpenseVal = useMemo(() => {
    const purchaseExpense = purchases.reduce((sum, p) => sum + p.totalAmount, 0);
    const customExpense = (expenses || []).reduce((sum, e) => sum + e.amount, 0);
    return purchaseExpense + customExpense;
  }, [purchases, expenses]);

  // 5. Pending Payments (Outstanding dues to supplier)
  const pendingPaymentsVal = useMemo(() => {
    return suppliers.reduce((sum, s) => sum + s.pendingDues, 0);
  }, [suppliers]);

  // 6. Total Stock Count (Status = 'In Stock')
  const totalInStockCount = useMemo(() => {
    return imeis.filter(i => i.status === 'In Stock').length;
  }, [imeis]);

  // 7. Total Purchase Stock Amount Val (valuation of un-sold units in warehouse)
  const totalPurchaseStockAmount = useMemo(() => {
    return imeis
      .filter(i => i.status === 'In Stock')
      .reduce((sum, item) => {
        // match list price
        const prod = products.find(p => p.id === item.productId);
        return sum + (prod ? prod.purchasePrice : 0);
      }, 0);
  }, [imeis, products]);

  // Profit overview calculator (Profit made on sold units)
  const salesNetProfitVal = useMemo(() => {
    return sales.reduce((sum, sale) => {
      // For each item, purchase price matching
      const itemsCost = sale.items.reduce((subSum, item) => {
        const prod = products.find(p => p.id === item.productId);
        return subSum + (prod ? prod.purchasePrice : 0);
      }, 0);
      return sum + (sale.finalAmount - itemsCost);
    }, 0);
  }, [sales, products]);

  // Low stock alarm (Products with <= 1 IMEI in active warehouse)
  const lowStockAlerts = useMemo(() => {
    return products.map(prod => {
      const stocked = imeis.filter(i => i.productId === prod.id && i.status === 'In Stock').length;
      return { product: prod, count: stocked };
    }).filter(p => p.count <= 1);
  }, [products, imeis]);

  // Top selling products based on transaction volume
  const topSellingDevices = useMemo(() => {
    const counts: Record<string, { name: string; brand: string; count: number; revenue: number }> = {};
    sales.forEach(s => {
      s.items.forEach(item => {
        if (!counts[item.productId]) {
          counts[item.productId] = { name: item.productName, brand: '', count: 0, revenue: 0 };
        }
        counts[item.productId].count += 1;
        counts[item.productId].revenue += item.total;
        const prod = products.find(p => p.id === item.productId);
        if (prod) counts[item.productId].brand = prod.brand;
      });
    });
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 4);
  }, [sales, products]);

  // Branch Performance
  const branchPerformances = useMemo(() => {
    return branches.map(br => {
      // filter sales
      const bSales = sales.filter(s => s.branchId === br.id);
      const bSalesVal = bSales.reduce((sum, s) => sum + s.finalAmount, 0);
      const stockCount = imeis.filter(i => i.branchId === br.id && i.status === 'In Stock').length;
      return { branch: br, salesValue: bSalesVal, stock: stockCount };
    });
  }, [branches, sales, imeis]);

  return (
    <div className="space-y-8 pb-12">
      {/* Dynamic Welcome Heading */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-2">
            <span>SHOWROOM ANALYTICS</span>
            <Sparkles size={20} className="text-red-500 animate-pulse" />
          </h1>
          <p className="text-xs text-white/50 font-medium mt-0.5">
            Real-time branch intelligence & secure TRN billing terminal
          </p>
        </div>

        {/* Currency AED Live Exchange widget block */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 flex items-center gap-4 text-xs font-mono shadow-md">
          <div className="flex items-center gap-2 border-r border-white/10 pr-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-white font-extrabold uppercase text-[11px]">UAE AED LIVE INDICATOR</span>
          </div>
          <div className="space-x-4 text-white/85">
            <span>1 USD = <span className="text-red-400 font-bold">3.6725 AED</span></span>
            <span>1 EUR = <span className="text-blue-400 font-bold">3.9850 AED</span></span>
            <span>1 SAR = <span className="text-slate-400 font-bold">0.9790 AED</span></span>
          </div>
        </div>
      </div>

      {/* Grid: Animated Stat Cards with Sophisticated Dark details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Today Sales */}
        <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-5 relative overflow-hidden group hover:border-red-500/30 hover:bg-white/10 transition-all duration-300 shadow-xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition-colors"></div>
          <p className="text-[10px] font-bold text-white/50 tracking-wider uppercase">Today Sales (مبيعات اليوم)</p>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-3xl font-black text-white tracking-tight leading-none">
              {todaySalesVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-red-500 font-bold">AED</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold mt-3">
            <TrendingUp size={12} />
            <span>+12.4% vs same-hour yesterday</span>
          </div>
        </div>

        {/* Card 2: Total Sales */}
        <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-5 relative overflow-hidden group hover:border-red-500/30 hover:bg-white/10 transition-all duration-300 shadow-xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl"></div>
          <p className="text-[10px] font-bold text-white/50 tracking-wider uppercase">Total Sales (إجمالي المبيعات)</p>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-3xl font-black text-white tracking-tight leading-none">
              {totalSalesVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-blue-400 font-bold">AED</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-white/50 font-semibold mt-3">
            <Activity size={12} className="text-blue-400 animate-pulse" />
            <span>Cumulative showroom invoices</span>
          </div>
        </div>

        {/* Card 3: Today Expense */}
        <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-5 relative overflow-hidden group hover:border-red-500/30 hover:bg-white/10 transition-all duration-300 shadow-xl">
          <p className="text-[10px] font-bold text-white/50 tracking-wider uppercase">Today Expense (مصاريف اليوم)</p>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-3xl font-black text-rose-400 tracking-tight leading-none">
              {todayExpenseVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-rose-500 font-bold">AED</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-white/40 font-semibold mt-3">
            <span>Calculated from new purchases</span>
          </div>
        </div>

        {/* Card 4: Total Expense */}
        <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-5 relative overflow-hidden group hover:border-red-500/30 hover:bg-white/10 transition-all duration-300 shadow-xl">
          <p className="text-[10px] font-bold text-white/50 tracking-wider uppercase">Total Expense (إجمالي المصاريف)</p>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-3xl font-black text-white tracking-tight leading-none">
              {totalExpenseVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-slate-400 font-bold">AED</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-white/40 font-semibold mt-3">
            <span>Supplier purchasing index value</span>
          </div>
        </div>

        {/* Card 5: Outstanding Dues - Highlighted Red Styled Card from Theme HTML */}
        <div className="bg-red-650/10 backdrop-blur-md border border-red-600/30 p-5 rounded-2xl shadow-[0_0_20px_rgba(220,38,38,0.1)] relative overflow-hidden group transition-all duration-300">
          <p className="text-[10px] font-bold text-red-300 tracking-wider uppercase">Pending Dues (المستحقات المعلقة)</p>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-3xl font-black text-white tracking-tight leading-none">
              {pendingPaymentsVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-red-400 font-bold">AED</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-red-400/80 font-semibold mt-3">
            <AlertTriangle size={12} />
            <span>Supplier accounts payable</span>
          </div>
        </div>

        {/* Card 6: Cumulative Stock Count */}
        <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-5 relative overflow-hidden group hover:border-red-500/30 hover:bg-white/10 transition-all duration-300 shadow-xl">
          <p className="text-[10px] font-bold text-white/50 tracking-wider uppercase">Total Stocks (إجمالي الأجهزة)</p>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-3xl font-black text-white tracking-tight leading-none">
              {totalInStockCount}
            </span>
            <span className="text-xs text-white/40 font-bold">UNITS</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-white/45 font-semibold mt-3">
            <Layers size={12} className="text-red-500" />
            <span>Active unique IMEI items in stock</span>
          </div>
        </div>

        {/* Card 7: Total stock value */}
        <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-5 relative overflow-hidden group hover:border-red-500/30 hover:bg-white/10 transition-all duration-300 shadow-xl">
          <p className="text-[10px] font-bold text-white/50 tracking-wider uppercase">Purchase stock asset value (قيمة المخزون)</p>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-3xl font-black text-white tracking-tight leading-none">
              {totalPurchaseStockAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-white/40 font-bold">AED</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-white/40 font-semibold mt-3">
            <span>At purchase rate valuation</span>
          </div>
        </div>

        {/* Card 8: Sales margin metric */}
        <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-5 relative overflow-hidden group hover:border-red-500/30 hover:bg-white/10 transition-all duration-300 shadow-xl">
          <p className="text-[10px] font-bold text-red-400 tracking-wider uppercase">Total Net Profit Overview (الأرباح)</p>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-3xl font-black text-emerald-400 tracking-tight leading-none animate-pulse">
              {salesNetProfitVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-emerald-500 font-bold">AED</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold mt-3">
            <span>Sales price minus buying price</span>
          </div>
        </div>
      </div>

      {/* Grid line elements: Live charts and shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Custom Premium Chart Widget (8 cols) - Glass Dark styling */}
        <div className="col-span-1 lg:col-span-8 bg-black/30 border border-white/5 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">MONTHLY SALES OVERVIEW</h3>
              <p className="text-[10px] text-white/40 mt-0.5">Custom visual transaction scale graph (AED)</p>
            </div>
            <span className="text-[10px] font-bold bg-white/5 border border-white/10 px-2.5 py-1 rounded text-red-500 font-mono">
              Q2 LIVE INDEX
            </span>
          </div>

          {/* Fully customized stunning responsive SVG bar & line graph */}
          <div className="h-64 w-full relative flex items-end">
            {/* Guidelines */}
            <div className="absolute left-0 w-full h-full flex flex-col justify-between text-[9px] text-white/30 font-mono pointer-events-none pb-6">
              <div className="border-b border-white/5 w-full pt-1">10 K</div>
              <div className="border-b border-white/5 w-full">5 K</div>
              <div className="border-b border-white/5 w-full">2 K</div>
              <div className="w-full">0</div>
            </div>

            {/* Custom Interactive Bars representing Mock Monthly Data */}
            <div className="w-full h-44 flex justify-around items-end relative z-10 font-bold text-[9.5px] text-white/55 pl-12">
              {[
                { label: 'Jan', val: 7800, count: 2 },
                { label: 'Feb', val: 9400, count: 4 },
                { label: 'Mar', val: 12800, count: 5 },
                { label: 'Apr', val: 6500, count: 2 },
                { label: 'May (Live)', val: totalSalesVal || 9450, count: sales.length, highlighted: true },
              ].map((month, idx) => {
                const maxVal = 13000;
                const percentage = Math.min(100, (month.val / maxVal) * 100);
                
                return (
                  <div key={idx} className="flex flex-col items-center gap-2 group cursor-pointer w-12">
                    {/* Hover Card Display value */}
                    <div className="opacity-0 group-hover:opacity-100 absolute transform -translate-y-12 bg-red-600 font-bold text-[10px] rounded px-2 py-1 text-white shadow-lg pointer-events-none transition-all duration-300">
                      AED {month.val.toFixed(0)} ({month.count} sales)
                    </div>

                    {/* Bar */}
                    <div className="w-6 bg-white/5 group-hover:bg-[#111622] rounded-t-lg h-36 flex items-end relative overflow-hidden border border-white/5">
                      <div 
                        style={{ height: `${percentage}%` }}
                        className={`w-full rounded-t-md transition-all duration-1000 ${
                          month.highlighted 
                            ? 'bg-gradient-to-t from-red-605 to-red-600 shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
                            : 'bg-white/10 group-hover:bg-red-600/40'
                        }`}
                      ></div>
                    </div>
                    <span>{month.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-white/5 pt-4 mt-2 flex justify-between text-[11px] text-white/50 font-semibold font-sans">
            <span>Showroom target: <span className="text-white">AED 25,000 / month</span></span>
            <span className="text-emerald-400">Live Showroom Efficiency: Standard Premium</span>
          </div>
        </div>

        {/* Quick Utilities / Branch Performers (4 cols) */}
        <div className="col-span-1 lg:col-span-4 space-y-5">
          {/* Branch-wise Perf card */}
          <div className="bg-white/5 border border-white/5 rounded-2xl p-5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Branch Performance</h3>
            <div className="space-y-3">
              {branchPerformances.map((perf, idx) => (
                <div key={idx} className="p-3 bg-black/30 border border-white/5 rounded-xl space-y-1">
                  <div className="flex justify-between text-xs font-bold text-white/90">
                    <span className="truncate max-w-[160px]">{perf.branch.name}</span>
                    <span className="text-red-400 font-extrabold">{perf.salesValue.toLocaleString()} AED</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-white/40 font-semibold">
                    <span>{perf.branch.location.split(',')[1] || 'Retail Showroom'}</span>
                    <span>Available Stock: <span className="text-white">{perf.stock} unit(s)</span></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fast shortcut buttons */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Instant Checkout Channels</h3>
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <button 
                onClick={() => onNavigate('sales')}
                className="p-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl transition cursor-pointer text-center text-[11px]"
              >
                + New Invoice billing
              </button>
              <button 
                onClick={() => onNavigate('purchases')}
                className="p-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl transition cursor-pointer text-center text-[11px]"
              >
                + Register Purchase
              </button>
              <button 
                onClick={() => onNavigate('products')}
                className="p-2.5 bg-white/5 border border-white/5 text-white/70 hover:bg-white/10 hover:text-white rounded-xl transition cursor-pointer text-center text-[11px]"
              >
                Add Inventory Product
              </button>
              <button 
                onClick={() => onNavigate('returns')}
                className="p-2.5 bg-orange-600/10 text-orange-400 border border-orange-500/15 hover:bg-orange-600/20 rounded-xl transition cursor-pointer text-center text-[11px]"
              >
                Return Registry
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Low stock and recent sales footer list block */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Low Stock alarms */}
        <div className="bg-white/5 border border-white/5 rounded-2xl p-5">
          <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="text-red-500 animate-pulse" size={14} />
              <span>Low Stock Alerts (انذار مخزون منخفض)</span>
            </h3>
            <span className="text-[10px] font-mono text-red-400 font-bold">Threshold &lt;= 1 Unit</span>
          </div>

          <div className="space-y-2">
            {lowStockAlerts.length === 0 ? (
              <p className="text-white/40 text-xs text-center py-4 font-bold">Stock levels optimized. All devices abundantly loaded.</p>
            ) : (
              lowStockAlerts.slice(0, 5).map((alert, idx) => (
                <div key={idx} className="flex justify-between items-center p-2.5 bg-red-500/5 hover:bg-red-500/10 rounded-xl border border-red-500/10 transition-colors">
                  <div>
                    <span className="text-xs font-extrabold text-white">{alert.product.name}</span>
                    <span className="text-[10px] text-white/40 ml-2 font-mono uppercase bg-black/40 px-1.5 py-0.5 rounded border border-white/5">{alert.product.brand}</span>
                  </div>
                  <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                    alert.count === 0 ? 'bg-red-600 text-white animate-pulse' : 'bg-orange-500/20 text-orange-400'
                  }`}>
                    {alert.count === 0 ? 'OUT OF STOCK' : 'Only 1 left'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent sales - Fully styled with Sophisticated Dark details */}
        <div className="bg-white/5 border border-white/5 rounded-2xl p-5">
          <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Recent Invoices</h3>
            <button 
              onClick={() => onNavigate('sales')}
              className="text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors cursor-pointer"
            >
              See all invoices
            </button>
          </div>

          <div className="space-y-3">
            {sales.length === 0 ? (
              <p className="text-white/40 text-xs text-center py-4">No recent billing logs found.</p>
            ) : (
              sales.slice(0, 4).map((sale, idx) => (
                <div key={idx} className="flex justify-between items-center p-2.5 bg-black/30 rounded-xl border border-white/5 hover:border-white/10 transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-white">{sale.invoiceNo}</span>
                      <span className="text-[10px] text-white/40 font-semibold">{sale.date.split('T')[0]}</span>
                    </div>
                    <p className="text-[10px] text-white/50 select-all font-mono">IMEI: {sale.items[0]?.imei || 'No SKU'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-white">{sale.finalAmount.toLocaleString()} AED</p>
                    <span className="text-[9px] text-[#22c55e] font-mono font-medium">{sale.paymentMethod} Payment</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
