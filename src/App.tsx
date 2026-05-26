/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ERPProvider, useERP } from './context/ERPContext';
import { LoginScreen } from './components/LoginScreen';
import { Dashboard } from './components/Dashboard';
import { Products } from './components/Products';
import { PurchaseModule } from './components/PurchaseModule';
import { SalesModule } from './components/SalesModule';
import { StockModule } from './components/StockModule';
import { ReturnsModule } from './components/ReturnsModule';
import { CustomersSuppliers } from './components/CustomersSuppliers';
import { BranchesUsers } from './components/BranchesUsers';
import { ReportsModule } from './components/ReportsModule';
import { SettingsTax } from './components/SettingsTax';
import { ExpensesModule } from './components/ExpensesModule';
import { 
  BarChart2, ShoppingCart, ShieldAlert, Settings, LogOut, 
  MapPin, Clock, Layers, Users, RefreshCw, Smartphone, PackageMinus, Landmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function ERPAppContent() {
  const { currentUser, setCurrentUser, settings, branches } = useERP();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currentTime, setCurrentTime] = useState<string>('');

  // Clock runner
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit', 
        hour12: true, 
        timeZone: 'Asia/Dubai' 
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!isAuthenticated || !currentUser) {
    return <LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: BarChart2 },
    { id: 'products', label: 'Models Catalog', icon: Smartphone },
    { id: 'purchases', label: 'Inward Ledgers', icon: Layers },
    { id: 'sales', label: 'POS Billing', icon: ShoppingCart },
    { id: 'stock', label: 'IMEI Warehouse', icon: Users },
    { id: 'returns', label: 'Returns', icon: PackageMinus },
    { id: 'crm', label: 'Directory CRM', icon: Users },
    { id: 'expenses', label: 'Expenses', icon: Landmark },
    { id: 'branches', label: 'Outlets', icon: MapPin },
    { id: 'reports', label: 'Executive Analyst', icon: BarChart2 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#0A0D12] text-slate-100 font-sans flex flex-col justify-between tracking-normal relative overflow-x-hidden antialiased">
      
      {/* Background Decorative Ambient glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

      {/* Corporate Top HUD Bar */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0e1219]/70 backdrop-blur-md px-4 py-3 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          
          {/* Logo Brand Title with gradient badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-900 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.4)] shrink-0">
              <span className="font-bold text-lg text-white">QZ</span>
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white uppercase">{settings.shopName}</h1>
              <p className="text-[10px] text-red-500 uppercase tracking-wider font-bold">Premium Showroom ERP • TRN: {settings.shopTRN}</p>
            </div>
          </div>

          {/* Integrated Live HUD Stats & Connection */}
          <div className="flex items-center flex-wrap gap-4 sm:gap-6 justify-between sm:justify-end text-xs text-slate-400 font-medium">
            
            <div className="hidden md:flex items-center gap-2 bg-white/5 px-3.5 py-1.5 rounded-full border border-white/10 text-[11px]">
              <span className="text-[10px] text-blue-300 font-mono font-bold uppercase">AED Indicator:</span>
              <span className="font-bold text-white">1 USD = 3.67 AED</span>
            </div>

            <div className="flex items-center gap-2.5 text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-white/60 font-semibold text-[11px]">Sync: Terminal Active</span>
            </div>

            <div className="flex items-center gap-3 border-l border-white/10 pl-4 sm:pl-6">
              <div className="text-right">
                <span className="text-[9px] text-white/40 block">Active portal user</span>
                <span className="text-xs font-bold text-white uppercase">{currentUser.username} ({currentUser.role})</span>
              </div>
              <span className="inline-flex items-center bg-red-600/10 text-red-400 border border-red-500/15 px-2.5 py-0.5 rounded-md font-mono text-[10px] font-bold">
                {branches.find(b => b.id === currentUser.branchId)?.name.split(' ')[0] || 'DUBAI HQ'}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors uppercase font-bold text-[10px] bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg cursor-pointer"
            >
              <LogOut size={13} />
              <span>Exit Portal</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Workspace Frame container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-grow flex flex-col lg:flex-row gap-6 relative z-10">
        
        {/* Dynamic Nav sidebar selector */}
        <aside className="lg:w-60 shrink-0 select-none pb-4 lg:pb-0">
          <nav className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible pb-3 lg:pb-0 scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition text-xs font-bold uppercase tracking-wider shrink-0 lg:w-full cursor-pointer border ${
                    isActive 
                      ? 'bg-red-600/15 text-red-200 border-red-600/40 shadow-[0_0_15px_rgba(220,38,38,0.15)] font-black' 
                      : 'text-white/40 hover:text-white/80 border-transparent hover:bg-white/5'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-red-400' : 'text-slate-400'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
          
          {/* Cyber Terminal Health widget inside Sidebar for Desktop view */}
          <div className="hidden lg:block mt-6 bg-white/5 rounded-2xl p-4 border border-white/5 text-[11px]">
            <div className="flex items-center justify-between mb-2 font-bold uppercase tracking-wider">
              <span className="text-white/40">Secure Backup</span>
              <span className="text-emerald-400">OPTIMIZED</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <div className="h-full w-5/6 bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.6)]"></div>
            </div>
            <p className="text-[9px] text-[#ef4444] mt-2 italic text-center font-bold font-mono">AUTOMATED SYNC INTERVAL ACTIVE</p>
          </div>
        </aside>

        {/* Selected Component render viewport */}
        <div className="flex-grow min-w-0 bg-transparent">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'dashboard' && <Dashboard onNavigate={(tab) => setActiveTab(tab)} />}
              {activeTab === 'products' && <Products />}
              {activeTab === 'purchases' && <PurchaseModule />}
              {activeTab === 'sales' && <SalesModule />}
              {activeTab === 'stock' && <StockModule />}
              {activeTab === 'returns' && <ReturnsModule />}
              {activeTab === 'crm' && <CustomersSuppliers />}
              {activeTab === 'expenses' && <ExpensesModule />}
              {activeTab === 'branches' && <BranchesUsers />}
              {activeTab === 'reports' && <ReportsModule />}
              {activeTab === 'settings' && <SettingsTax />}
            </motion.div>
          </AnimatePresence>
        </div>

      </main>

      {/* Cyber footer metrics */}
      <footer className="bg-[#080a0f] border-t border-white/5 py-4 px-4 sm:px-6 lg:px-8 select-none">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">
          
          <div className="flex items-center gap-2">
            <Clock size={11} className="text-slate-400" />
            <span>DUBAI GULF TIME: <span className="text-[#ef4444] font-mono">{currentTime || '08:45 PM'}</span></span>
          </div>

          <div>
            AL QWAS AL ZAHABAI ERP SYSTEM • INTEGRITY STATUS: FULLY SECURED
          </div>

          <div className="flex items-center gap-3 text-slate-600 font-bold">
            <span>UAE REGULATION CR-44855</span>
            <span>LICENSED PORTAL ACCESS</span>
          </div>

        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <ERPProvider>
      <ERPAppContent />
    </ERPProvider>
  );
}
