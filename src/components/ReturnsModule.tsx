/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useERP } from '../context/ERPContext';
import { Search, AlertTriangle, ShieldCheck, HelpCircle, X, Award, RotateCcw } from 'lucide-react';

export const ReturnsModule: React.FC = () => {
  const { 
    returns, 
    addReturn, 
    deleteReturn, 
    imeis, 
    products, 
    suppliers, 
    customers, 
    currentUser 
  } = useERP();

  const [activeTab, setActiveTab] = useState<'History' | 'LogReturn'>('History');
  
  // Log Return Form inputs
  const [returnType, setReturnType] = useState<'Purchase Return' | 'Sales Return'>('Sales Return');
  const [imeiInput, setImeiInput] = useState('');
  const [returnAmount, setReturnAmount] = useState<number>(0);
  const [returnNotes, setReturnNotes] = useState('');

  // Form Validation alerts
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [matchedDetails, setMatchedDetails] = useState<{
    productName: string;
    partyId: string;
    partyName: string;
    suggestedAmount: number;
    canSubmit: boolean;
  } | null>(null);

  // Trigger IMEI validation on inputs
  const handleIMEILookup = (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);
    setMatchedDetails(null);
    const trimmed = imeiInput.trim();

    if (!trimmed) return;

    // Acknowledge target device
    const imeiObj = imeis.find(i => i.imei === trimmed);

    if (!imeiObj) {
      setLookupError('IMEI lookup failed: Device has not been logged in store database.');
      return;
    }

    const prod = products.find(p => p.id === imeiObj.productId);
    if (!prod) {
      setLookupError('Model matching error.');
      return;
    }

    if (returnType === 'Purchase Return') {
      // Return back to supplier. Device MUST be "In Stock" originally.
      if (imeiObj.status !== 'In Stock') {
        setLookupError(`IMEI Status conflict: Purchase returns require 'In Stock' device. Current status is ${imeiObj.status}.`);
        return;
      }

      const sup = suppliers.find(s => s.id === imeiObj.supplierId);
      setMatchedDetails({
        productName: prod.name,
        partyId: imeiObj.supplierId,
        partyName: sup ? sup.name : 'Primary Distributor',
        suggestedAmount: prod.purchasePrice,
        canSubmit: true,
      });
      setReturnAmount(prod.purchasePrice);

    } else {
      // Sales Return: Customer returns device. Device must be listed as "Sold".
      if (imeiObj.status !== 'Sold') {
        setLookupError(`IMEI Status conflict: Sales returns require 'Sold' device status. Current status is ${imeiObj.status}.`);
        return;
      }

      const cust = customers.find(c => c.id === imeiObj.customerId);
      setMatchedDetails({
        productName: prod.name,
        partyId: imeiObj.customerId || 'c1',
        partyName: cust ? cust.name : 'Retail client',
        suggestedAmount: prod.sellingPrice,
        canSubmit: true,
      });
      setReturnAmount(prod.sellingPrice);
    }
  };

  const handleRegisterReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchedDetails || !imeiInput) return;

    const success = addReturn({
      type: returnType,
      imei: imeiInput.trim(),
      partyId: matchedDetails.partyId,
      partyName: matchedDetails.partyName,
      amount: returnAmount,
      notes: returnNotes || `Digital Return filed for IMEI: ${imeiInput}`,
    });

    if (success) {
      // Reset Form State
      setImeiInput('');
      setReturnAmount(0);
      setReturnNotes('');
      setMatchedDetails(null);
      setActiveTab('History');
    } else {
      alert('Return file failed. Verify device integrity status.');
    }
  };

  const handleDiscardReturn = (id: string) => {
    if (currentUser?.role === 'Staff') {
      alert('Violation Check: Sales floor staff cannot delete verified ledger files.');
      return;
    }
    if (window.confirm('Deleting this return invoice reverses device stock positioning and supplier credits. Proceed?')) {
      deleteReturn(id);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Tabs */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/60 pb-5">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">RETURNS DISPUTE MANAGER</h2>
          <p className="text-xs text-slate-400 font-medium font-sans">Credit refunds, stock evacuation & compliance returns</p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-905 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('History')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'History' 
                ? 'bg-red-600 text-white font-extrabold shadow' 
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            History Logbooks
          </button>
          <button
            onClick={() => {
              setActiveTab('LogReturn');
              setMatchedDetails(null);
            }}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'LogReturn' 
                ? 'bg-red-600 text-white font-extrabold shadow' 
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Log Return Docket
          </button>
        </div>
      </div>

      {activeTab === 'LogReturn' ? (
        /* Return Logging Workspace */
        <div className="max-w-2xl mx-auto bg-slate-900/40 p-6 rounded-2xl border border-slate-800 space-y-6">
          
          <div className="space-y-4">
            {/* 1. Choose return direction */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Return Route Pathway</label>
              <div className="grid grid-cols-2 gap-3 text-xs font-bold">
                <button
                  onClick={() => {
                    setReturnType('Sales Return');
                    setMatchedDetails(null);
                    setImeiInput('');
                    setLookupError(null);
                  }}
                  className={`py-2 rounded-xl border transition-all ${
                    returnType === 'Sales Return' 
                      ? 'bg-[#ef4444]/15 border-red-500/40 text-[#ef4444] font-extrabold' 
                      : 'border-slate-800 text-slate-500 hover:text-slate-400'
                  }`}
                >
                  Customer Sales Return (صيانة عميل)
                </button>
                <button
                  onClick={() => {
                    setReturnType('Purchase Return');
                    setMatchedDetails(null);
                    setImeiInput('');
                    setLookupError(null);
                  }}
                  className={`py-2 rounded-xl border transition-all ${
                    returnType === 'Purchase Return' 
                      ? 'bg-[#ef4444]/15 border-red-500/40 text-[#ef4444] font-extrabold' 
                      : 'border-slate-800 text-slate-500 hover:text-slate-400'
                  }`}
                >
                  Supplier Purchase Return (إرجاع للمورد)
                </button>
              </div>
            </div>

            {/* 2. Lookup IMEI bar */}
            <form onSubmit={handleIMEILookup} className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 block uppercase">Terminal IMEI Lookup</label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={16}
                  value={imeiInput}
                  onChange={(e) => {
                    setLookupError(null);
                    setMatchedDetails(null);
                    setImeiInput(e.target.value.replace(/\D/g, ''));
                  }}
                  placeholder="Scan or enter 15 digit IMEI to file..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 pl-4 pr-16 text-xs font-mono tracking-wider focus:outline-none"
                />
                <button
                  type="submit"
                  className="absolute top-1.5 right-1.5 px-3 py-1 font-bold text-[10px] bg-red-600 hover:bg-red-500 rounded-lg text-white"
                >
                  Lookup
                </button>
              </div>

              {lookupError && (
                <p className="text-[10px] text-red-400 font-bold bg-red-500/5 p-2 rounded border border-red-500/10 flex items-center gap-1">
                  <AlertTriangle size={12} className="text-red-500 shrink-0" />
                  <span>{lookupError}</span>
                </p>
              )}
            </form>

            {/* 3. Output match highlights */}
            {matchedDetails && (
              <div className="space-y-4 p-4 bg-slate-950/40 border border-slate-800 rounded-xl animate-fadeIn">
                <div className="grid grid-cols-2 gap-4 text-xs font-medium border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[9px] text-zinc-500 uppercase block">Product Model Verified</span>
                    <span className="text-white font-extrabold">{matchedDetails.productName}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-500 uppercase block">
                      {returnType === 'Purchase Return' ? 'Supplying Distributor' : 'Original Client'}
                    </span>
                    <span className="text-white font-bold">{matchedDetails.partyName}</span>
                  </div>
                </div>

                <form onSubmit={handleRegisterReturn} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 block">Credit Refund Cost (AED)</label>
                      <input
                        type="number"
                        min="0"
                        value={returnAmount || ''}
                        onChange={(e) => setReturnAmount(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-white"
                      />
                      <span className="text-[9px] text-slate-500 italic block mt-0.5">Suggested value: {matchedDetails.suggestedAmount} AED</span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 block">Deduction Reason / Notes</label>
                      <input
                        type="text"
                        required
                        value={returnNotes}
                        onChange={(e) => setReturnNotes(e.target.value)}
                        placeholder="e.g. Scratched chassis, screen fault"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold uppercase transition"
                  >
                    Commit Return Ledger & Re-arrange stock listings
                  </button>
                </form>
              </div>
            )}

          </div>

        </div>
      ) : (
        /* History lists */
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/20">
          <table className="w-full text-left text-xs text-slate-300">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 text-[10px] font-bold uppercase select-none">
                <th className="p-3">Ref Code ID</th>
                <th className="p-3">Route Category</th>
                <th className="p-3">Device IMEI</th>
                <th className="p-3">Return Filed On</th>
                <th className="p-3">Associated party</th>
                <th className="p-3 text-right">Refund Ledger Amount</th>
                <th className="p-3 text-center">Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 font-medium">
              {returns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 font-bold">No return filings found.</td>
                </tr>
              ) : (
                returns.map(r => (
                  <tr key={r.id} className="hover:bg-slate-900/10">
                    <td className="p-3 select-all font-mono font-bold tracking-wider text-slate-400">{r.id.substr(-6)}</td>
                    <td className="p-3">
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase ${
                        r.type === 'Purchase Return' 
                          ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400' 
                          : 'bg-indigo-505/10 border border-indigo-505/20 text-indigo-400'
                      }`}>
                        {r.type}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-white select-all">{r.imei}</td>
                    <td className="p-3">{r.date.split('T')[0]}</td>
                    <td className="p-3 font-semibold text-slate-300">{r.partyName}</td>
                    <td className="p-3 text-right font-black text-white">{r.amount.toLocaleString()} AED</td>
                    <td className="p-3 text-center">
                      {currentUser?.role === 'Admin' && (
                        <button
                          onClick={() => handleDiscardReturn(r.id)}
                          className="px-2 py-0.5 bg-slate-800/50 text-slate-400 border border-slate-700 hover:text-red-500 hover:bg-red-500/5 text-[10px] rounded transition"
                        >
                          Cancel Return
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};
