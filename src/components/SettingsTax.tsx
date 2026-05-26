/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { 
  Settings, Save, FileText, Percent, Building, Database, 
  ShieldAlert, Landmark, ArrowUpRight, Check, Upload, X, ShieldCheck, Trash2, Key, Eye, EyeOff 
} from 'lucide-react';

interface UserPasswordRowProps {
  user: any;
  currentUser: any;
  updateUser: (id: string, updated: any) => void;
}

const UserPasswordRow: React.FC<UserPasswordRowProps> = ({ user, currentUser, updateUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [revealPass, setRevealPass] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  const actualPassword = user.password || (user.role === 'Admin' ? 'sameer123' : 'staff123');

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    if (newPass.trim().length < 4) {
      setPinError('Security protocols require pins with at least 4 digits/characters.');
      return;
    }

    const canChange = currentUser?.role === 'Admin' || currentUser?.id === user.id;
    if (!canChange) {
      alert('Access Denied: Only Admin can edit other users\' passwords. Staff can only change their own.');
      return;
    }

    updateUser(user.id, { password: newPass.trim() });
    setIsEditing(false);
    setNewPass('');
    alert(`Access keycode updated successfully for terminal user: ${user.username}`);
  };

  const canChange = currentUser?.role === 'Admin' || currentUser?.id === user.id;

  return (
    <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800/85 hover:border-slate-700/60 transition duration-200 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center border border-slate-800 shrink-0 text-white font-mono font-bold uppercase text-[11px] select-none">
            {user.username.slice(0, 2)}
          </div>
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <span>{user.username}</span>
              <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                user.role === 'Admin' 
                  ? 'bg-red-500/10 text-red-500 border border-red-500/15' 
                  : 'bg-blue-500/10 text-blue-400 border border-blue-505/15'
              }`}>
                {user.role === 'Admin' ? 'CEO ADMIN' : 'FLOOR STAFF'}
              </span>
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5">{user.email} • Joined {user.joinedDate}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 flex items-center gap-2 font-mono text-[11px]">
            <span className="text-[10px] text-zinc-500 font-sans font-semibold">Active Password:</span>
            <span className="text-red-400 font-extrabold tracking-widest text-center min-w-[50px]">
              {revealPass ? actualPassword : '••••••••'}
            </span>
            <button
              type="button"
              onClick={() => setRevealPass(!revealPass)}
              className="p-1 hover:text-white transition text-slate-400 ml-1.5 cursor-pointer"
              title={revealPass ? "Hide Access Pin" : "Reveal Access Pin"}
            >
              {revealPass ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>

          {canChange && (
            <button
              onClick={() => {
                setIsEditing(!isEditing);
                setNewPass('');
                setPinError(null);
              }}
              className="px-3 py-2 bg-white/5 hover:bg-white/10 text-[10px] font-extrabold uppercase rounded-lg transition border border-white/10 cursor-pointer"
            >
              {isEditing ? 'Cancel' : 'Change'}
            </button>
          )}
        </div>
      </div>

      {isEditing && (
        <form onSubmit={handleSavePassword} className="bg-slate-950/80 p-4 rounded-xl border border-slate-850/60 space-y-3.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-grow space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">New Access Password / PIN</label>
              <input
                type="text"
                autoFocus
                required
                value={newPass}
                onChange={(e) => {
                  setPinError(null);
                  setNewPass(e.target.value);
                }}
                placeholder="e.g. sameer2026 or 9988"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-xs text-white"
              />
            </div>
            <div className="sm:self-end">
              <button
                type="submit"
                className="w-full sm:w-auto px-4 py-2 bg-red-650 hover:bg-red-600 text-white font-bold text-xs uppercase rounded-lg transition shadow-md cursor-pointer"
              >
                Commit PIN Changes
              </button>
            </div>
          </div>
          {pinError && (
            <p className="text-[10px] text-red-500 font-semibold">{pinError}</p>
          )}
        </form>
      )}
    </div>
  );
};

export const SettingsTax: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    currentUser, 
    triggerRestoreDatabase, 
    getBackupPayload,
    resetDatabase,
    users,
    updateUser
  } = useERP();

  // Settings states
  const [vatPercent, setVatPercent] = useState<number>(settings.vatPercent);
  const [taxPercent, setTaxPercent] = useState<number>(settings.taxPercent);
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol);

  // Layout properties
  const [shopName, setShopName] = useState(settings.shopName);
  const [shopPhone, setShopPhone] = useState(settings.shopPhone);
  const [shopTRN, setShopTRN] = useState(settings.shopTRN);
  const [shopAddress, setShopAddress] = useState(settings.shopAddress);
  const [shopEmail, setShopEmail] = useState(settings.shopEmail);
  const [warrantyNotice, setWarrantyNotice] = useState(settings.warrantyNotice);

  // Active Panel Tab
  const [activeTab, setActiveTab] = useState<'shop' | 'tax' | 'receipt' | 'security' | 'passwords'>('shop');

  // Backup / Restore states
  const [backupSuccess, setBackupSuccess] = useState(false);
  const [restoreText, setRestoreText] = useState('');
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState(false);

  // Master Reset Popup Modal States
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Handle Updates
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser?.role !== 'Admin') {
      alert('Security violation: Multi-system configuration edits are locked to CEO level.');
      return;
    }

    updateSettings({
      vatPercent,
      taxPercent,
      currencySymbol,
      shopName,
      shopPhone,
      shopTRN,
      shopAddress,
      shopEmail,
      warrantyNotice,
    });
    alert('Cyber-ERP System settings saved successfully.');
  };

  // Dump static database local payload to instant clipboard/file
  const handleDumpBackupJSON = () => {
    const payload = getBackupPayload();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Dubai_ERP_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);

    setBackupSuccess(true);
    setTimeout(() => setBackupSuccess(false), 3500);
  };

  // Restore database by parsing JSON text block
  const handleRestoreDatabase = (e: React.FormEvent) => {
    e.preventDefault();
    setRestoreError(null);
    setRestoreSuccess(false);

    if (currentUser?.role !== 'Admin') {
      alert('Bypassed: System database restoration requires administrator privileges.');
      return;
    }

    try {
      const parsed = JSON.parse(restoreText);
      const output = triggerRestoreDatabase(parsed);
      
      if (output) {
        setRestoreSuccess(true);
        setRestoreText('');
        alert('ERP Database recovered successfully from file backup payload.');
      } else {
        setRestoreError('Format alignment mismatch: Backup structures corrupt or missing keys.');
      }
    } catch (err: any) {
      setRestoreError(`Invalid JSON format: ${err.message}`);
    }
  };

  // Execute Master Hard Reset Trigger
  const handleExecuteMasterReset = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);

    const validPasswords = ['admin123', 'sameer123', 'sameer'];
    if (!validPasswords.includes(resetPassword.trim().toLowerCase())) {
      setResetError('Security Check Failed: Incorrect admin authorization password.');
      return;
    }

    resetDatabase();
    setResetSuccess(true);
    
    setTimeout(() => {
      setResetSuccess(false);
      setIsResetModalOpen(false);
      setResetPassword('');
      alert('MASTER RESET INITIATED: ERP state hard reset to fresh empty databases. Sequence indicators zeroed successfully.');
      window.location.reload(); // Reload to assure components update clean states
    }, 1200);
  };

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/65 pb-5 font-sans">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            <Settings size={22} className="text-[#ef4444]" />
            <span>Showroom Advanced Settings Panel</span>
          </h2>
          <p className="text-xs text-slate-400 font-medium">Configure VAT regulations, billing headers, system backups, and run structural state operations</p>
        </div>
      </div>

      {/* Advanced Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Interactive Side Menu Tabs (3-columns space) */}
        <div className="lg:col-span-3 space-y-2">
          <button
            onClick={() => setActiveTab('shop')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-xs font-bold transition-all ${
              activeTab === 'shop'
                ? 'bg-red-650/15 border-red-500/30 text-red-400 font-black shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Building size={16} />
            <span>Shop Trading Profiles</span>
          </button>

          <button
            onClick={() => setActiveTab('tax')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-xs font-bold transition-all ${
              activeTab === 'tax'
                ? 'bg-red-650/15 border-red-500/30 text-red-400 font-black shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Percent size={16} />
            <span>Tax & Financials</span>
          </button>

          <button
            onClick={() => setActiveTab('receipt')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-xs font-bold transition-all ${
              activeTab === 'receipt'
                ? 'bg-red-650/15 border-red-500/30 text-red-400 font-black shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <FileText size={16} />
            <span>Receipt Customizer</span>
          </button>

          <button
            onClick={() => setActiveTab('passwords')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-xs font-bold transition-all ${
              activeTab === 'passwords'
                ? 'bg-red-650/15 border-red-500/30 text-red-500 font-black shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Key size={16} />
            <span>Staff Credentials & Passwords</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-xs font-bold transition-all ${
              activeTab === 'security'
                ? 'bg-red-650/15 border-red-500/30 text-red-500 font-black shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Database size={16} />
            <span>Power Utilities & DB Reset</span>
          </button>
        </div>

        {/* Right Active Configuration Panel Pane (9-columns space) */}
        <div className="lg:col-span-9">
          
          <div className="bg-slate-900/40 p-6 md:p-8 rounded-2xl border border-slate-800 text-slate-300">
            
            {/* TAB 1: SHOP SPECIFICATIONS */}
            {activeTab === 'shop' && (
              <div className="space-y-6">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Trading Profile Specifications</h3>
                  <p className="text-[10px] text-slate-450 mt-0.5">Control business credentials used for VAT invoices headers</p>
                </div>

                <form onSubmit={handleSaveSettings} className="space-y-5 text-xs font-medium">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-450 uppercase">Showroom Business Name</label>
                      <input
                        type="text"
                        required
                        value={shopName}
                        onChange={(e) => setShopName(e.target.value)}
                        placeholder="e.g. Al Qwas Al Zahabai Shop"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-red-500/50"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-450 uppercase mb-1 flex items-center gap-1">
                        <Landmark size={12} className="text-[#ef4444]" />
                        <span>UAE VAT TRN (Tax Registration Number)</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={shopTRN}
                        onChange={(e) => setShopTRN(e.target.value)}
                        placeholder="e.g. 100456123900003"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white font-mono tracking-wider text-[#ef4444] focus:outline-none focus:border-[#ef4444]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-450 uppercase">Customer Support Telephone</label>
                      <input
                        type="text"
                        required
                        value={shopPhone}
                        onChange={(e) => setShopPhone(e.target.value)}
                        placeholder="+971 4 333 4444"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-red-500/50"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-450 uppercase">Business Contact Email</label>
                      <input
                        type="email"
                        required
                        value={shopEmail}
                        onChange={(e) => setShopEmail(e.target.value)}
                        placeholder="sameersha2558@gmail.com"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase">Physical Outlet Address Address</label>
                    <input
                      type="text"
                      required
                      value={shopAddress}
                      onChange={(e) => setShopAddress(e.target.value)}
                      placeholder="Showroom 12, Deira Souq, Al Sabkha Road, Dubai, UAE"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex justify-end">
                    {currentUser?.role === 'Admin' ? (
                      <button
                        type="submit"
                        className="flex items-center gap-1.5 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs uppercase shadow-[0_0_15px_rgba(239,68,68,0.25)] transition duration-200 cursor-pointer"
                      >
                        <Save size={14} />
                        <span>Commit Shop Details</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-zinc-500 italic font-bold">Trading profile locks: requires manager permissions.</span>
                    )}
                  </div>
                </form>
              </div>
            )}

            {/* TAB 2: TAX & FINANCIALS */}
            {activeTab === 'tax' && (
              <div className="space-y-6">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Taxation & Regional Currency Settings</h3>
                  <p className="text-[10px] text-slate-450 mt-0.5">Control governmental VAT, customs tax, and trade currency indicator symbols</p>
                </div>

                <form onSubmit={handleSaveSettings} className="space-y-5 text-xs font-medium">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-455 uppercase">UAE Federal VAT (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        required
                        value={vatPercent}
                        onChange={(e) => setVatPercent(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white font-black"
                      />
                      <p className="text-[10px] text-slate-500 pt-1">Standard Federal rate is 5% in UAE.</p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-455 uppercase">Customs Import Duty (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        required
                        value={taxPercent}
                        onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white font-black"
                      />
                      <p className="text-[10px] text-slate-500 pt-1">Applied transparently during direct entries.</p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-455 uppercase">Shorthand Local Currency</label>
                      <input
                        type="text"
                        required
                        value={currencySymbol}
                        onChange={(e) => setCurrencySymbol(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white font-black uppercase text-center focus:border-red-500/55 text-red-400"
                      />
                      <p className="text-[10px] text-slate-500 pt-1">e.g. AED, $, SAR, QAR</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex justify-end">
                    {currentUser?.role === 'Admin' ? (
                      <button
                        type="submit"
                        className="flex items-center gap-1.5 px-5 py-2.5 bg-red-650 hover:bg-red-600 text-white font-bold rounded-xl text-xs uppercase shadow-[0_0_15px_rgba(239,68,68,0.25)] transition duration-200 cursor-pointer"
                      >
                        <Save size={14} />
                        <span>Commit Trade Financials</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-zinc-500 italic font-bold">Financial Locks: Tax edits restricted to Admin level.</span>
                    )}
                  </div>
                </form>
              </div>
            )}

            {/* TAB 3: RECEIPT CUSTOMIZER */}
            {activeTab === 'receipt' && (
              <div className="space-y-6">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Official Invoice Bottom Terms</h3>
                  <p className="text-[10px] text-slate-450 mt-0.5">Edit bilingual policy guidelines displayed at the bottom of printed invoices & A4 documents</p>
                </div>

                <form onSubmit={handleSaveSettings} className="space-y-5 text-xs font-medium">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase mb-1 block">Warranty notice and check terms (English + Arabic)</label>
                    <textarea
                      rows={6}
                      required
                      value={warrantyNotice}
                      onChange={(e) => setWarrantyNotice(e.target.value)}
                      placeholder="e.g. 1 Year warranty on devices. No refund on activated products..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 font-sans leading-relaxed focus:outline-none focus:border-red-500/50"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex justify-end">
                    {currentUser?.role === 'Admin' ? (
                      <button
                        type="submit"
                        className="flex items-center gap-1.5 px-5 py-2.5 bg-red-650 hover:bg-red-600 text-white font-bold rounded-xl text-xs uppercase shadow-[0_0_15px_rgba(239,68,68,0.25)] transition duration-200 cursor-pointer"
                      >
                        <Save size={14} />
                        <span>Save Receipt Layouts</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-zinc-500 italic font-bold">Policy notices: locked to security administrator.</span>
                    )}
                  </div>
                </form>
              </div>
            )}

            {/* TAB 4: POWER UTILITIES & DB RESET */}
            {activeTab === 'security' && (
              <div className="space-y-8">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">System Database Utilities</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Export logs or rebuild local storage indexes secure databases</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  
                  {/* Left: JSON Backup */}
                  <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Database size={15} className="text-emerald-400" />
                      <span>Encrypted Database Backups</span>
                    </h4>
                    <p className="text-[10.5px] text-slate-400 leading-normal">
                      Saves products, sales indexes, IMEI registry, vendor info, and showroom logs into a flat standard backup file.
                    </p>
                    <button
                      onClick={handleDumpBackupJSON}
                      className="w-full py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-white hover:text-red-400 rounded-xl text-xs font-bold uppercase transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Backup System JSON</span>
                      <ArrowUpRight size={13} className="text-red-500" />
                    </button>

                    {backupSuccess && (
                      <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] font-bold text-emerald-400 flex items-center justify-center gap-1.5 animate-pulse">
                        <Check size={12} />
                        <span>Payload backup generated successfully.</span>
                      </div>
                    )}
                  </div>

                  {/* Right: DB Restoration Paste */}
                  <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Upload size={15} className="text-amber-500" />
                      <span>Restore Storage Indexes</span>
                    </h4>
                    <form onSubmit={handleRestoreDatabase} className="space-y-4">
                      <div>
                        <textarea
                          rows={3}
                          required
                          value={restoreText}
                          onChange={(e) => {
                            setRestoreError(null);
                            setRestoreSuccess(false);
                            setRestoreText(e.target.value);
                          }}
                          placeholder='Paste backup content block...'
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2 sm:p-2.5 text-[10px] font-mono text-slate-450 focus:outline-none focus:border-amber-500/40"
                        />
                      </div>

                      {restoreError && (
                        <p className="text-[10px] text-red-400 font-bold leading-normal bg-red-500/5 p-2 rounded border border-red-500/10">
                          {restoreError}
                        </p>
                      )}

                      {restoreSuccess && (
                        <p className="text-[10px] text-emerald-400 font-bold bg-emerald-500/5 p-2 rounded border border-emerald-500/10">
                          Synchronization override completed!
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={!restoreText || currentUser?.role !== 'Admin'}
                        className="w-full py-2 bg-amber-550/10 hover:bg-amber-500 border border-amber-500/30 text-amber-500 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed rounded-xl text-xs font-semibold uppercase tracking-wider transition duration-150 cursor-pointer"
                      >
                        Execute Rebuild Override
                      </button>
                    </form>
                  </div>

                </div>

                {/* CRITICAL BOTTOM STAGE: MASTER ABSOLUTE RESET */}
                {currentUser?.role === 'Admin' && (
                  <div className="bg-[#ef4444]/5 p-5 md:p-6 rounded-2xl border border-red-500/20 space-y-4">
                    <div className="flex items-center gap-1.5 text-[#ef4444] text-xs font-extrabold uppercase tracking-wider">
                      <ShieldAlert size={18} />
                      <span>CRITICAL SYSTEM MASTER RESET</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans font-medium">
                      Invoking this hard reset permanently deletes products model specification list, transaction sheets, sales registries, suppliers profile cards, showroom audit logs, active expenses logs, and all IMEI serial stocks. Invoice indicators and SKU numbering tags are restarted from 1.
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        setResetPassword('');
                        setResetError(null);
                        setResetSuccess(false);
                        setIsResetModalOpen(true);
                      }}
                      className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white hover:text-red-100 text-xs font-black rounded-xl uppercase tracking-wider transition-all shadow-[0_4px_15px_rgba(239,68,68,0.15)] active:scale-95 duration-150 cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 size={13} />
                      <span>MASTER WIPE & ABSOLUTE RESET</span>
                    </button>
                  </div>
                )}

              </div>
            )}

            {/* TAB 5: STAFF CREDENTIALS & PASSWORDS */}
            {activeTab === 'passwords' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Key size={16} className="text-[#ef4444]" />
                    <span>Admin & Staff Passwords List</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Maintain security pins and passkeys for all active showroom portal identities</p>
                </div>

                <div className="space-y-4">
                  {users.map((user) => (
                    <UserPasswordRow 
                      key={user.id} 
                      user={user} 
                      currentUser={currentUser} 
                      updateUser={updateUser} 
                    />
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* MASTER SYSTEM RESET PASSWORD VERIFICATION POPUP MODAL */}
      {isResetModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-[9999] font-sans">
          <div className="bg-slate-900 border border-red-500/30 max-w-md w-full p-6 sm:p-8 rounded-2xl relative shadow-[0_0_50px_rgba(239,68,68,0.15)] animate-in fade-in zoom-in-95 duration-200">
            
            <button
              onClick={() => setIsResetModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition p-1 hover:bg-slate-800 rounded-lg"
            >
              <X size={18} />
            </button>

            <form onSubmit={handleExecuteMasterReset} className="space-y-5">
              
              <div className="flex flex-col items-center text-center space-y-2.5">
                <div className="p-3 bg-red-500/10 rounded-full text-red-500 border border-red-500/20">
                  <ShieldAlert size={36} className="animate-bounce" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-tight">Confirm Master Database Reset</h3>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs leading-relaxed">
                    This action is completely permanent. All products, clients, receipts, logs, and billing counters will restart from 1.
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Administrator Confirmation Password</label>
                <input
                  type="password"
                  required
                  autoFocus
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  placeholder="Enter confirmation password (e.g. admin123)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-center text-white font-mono tracking-widest placeholder:tracking-normal focus:outline-none focus:border-red-500/60"
                />
              </div>

              {resetError && (
                <div className="p-2.5 bg-red-505/10 border border-red-505/15 rounded-xl text-[10.5px] text-red-400 font-bold leading-snug text-center">
                  {resetError}
                </div>
              )}

              {resetSuccess ? (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10.5px] text-emerald-400 font-bold text-center flex items-center justify-center gap-1.5">
                  <ShieldCheck size={14} className="animate-spin" />
                  <span>Purging databases... Setting all indices to zero.</span>
                </div>
              ) : (
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-red-650 hover:bg-red-600 text-white font-extrabold text-xs uppercase tracking-wider shadow-[0_4px_15px_rgba(239,68,68,0.2)] rounded-xl transition cursor-pointer"
                  >
                    PURGE ALL CHANNELS
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsResetModalOpen(false)}
                    className="w-full py-2 bg-slate-955 border border-slate-800 text-slate-350 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Cancel Operations
                  </button>
                </div>
              )}

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
