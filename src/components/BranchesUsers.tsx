/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { Branch, User } from '../types';
import { Plus, Edit2, Trash2, X, ShieldAlert, Check, UserCheck, MapPin } from 'lucide-react';

export const BranchesUsers: React.FC = () => {
  const { 
    branches, 
    addBranch, 
    updateBranch, 
    deleteBranch,
    users, 
    addUser, 
    updateUser, 
    deleteUser, 
    currentUser 
  } = useERP();

  const [activeTab, setActiveTab] = useState<'Branches' | 'Users'>('Branches');

  // Modal forms states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'Branch' | 'User'>('Branch');
  const [modalMode, setModalMode] = useState<'Create' | 'Edit'>('Create');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form parameters
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'Admin' | 'Staff'>('Staff');
  const [selectedBranchId, setSelectedBranchId] = useState('b1');

  const openCreateModal = (target: 'Branch' | 'User') => {
    // Admin checking
    if (currentUser?.role !== 'Admin') {
      alert('Security violation: Multi-branch operations require CEO privileges.');
      return;
    }
    setModalType(target);
    setModalMode('Create');
    setName('');
    setLocation('');
    setStatus('Active');
    setUsername('');
    setEmail('');
    setRole('Staff');
    setSelectedBranchId('b1');
    setIsModalOpen(true);
  };

  const openEditModal = (target: 'Branch' | 'User', item: any) => {
    if (currentUser?.role !== 'Admin') {
      alert('Security lock: Profile edits require Administrative override.');
      return;
    }
    setModalType(target);
    setModalMode('Edit');
    setEditingId(item.id);

    if (target === 'Branch') {
      const b = item as Branch;
      setName(b.name);
      setLocation(b.location);
      setStatus(b.status);
    } else {
      const u = item as User;
      setUsername(u.username);
      setEmail(u.email);
      setRole(u.role);
      setSelectedBranchId(u.branchId);
    }
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (modalType === 'Branch') {
      if (!name || !location) return;
      if (modalMode === 'Create') {
        addBranch({ name, location, status });
      } else if (editingId) {
        updateBranch(editingId, { name, location, status });
      }
    } else {
      // User
      if (!username || !email) return;
      if (modalMode === 'Create') {
        addUser({ username, email, role, branchId: selectedBranchId });
      } else if (editingId) {
        updateUser(editingId, { username, email, role, branchId: selectedBranchId });
      }
    }
    setIsModalOpen(false);
  };

  const handleDelete = (target: 'Branch' | 'User', id: string) => {
    if (currentUser?.role !== 'Admin') {
      alert('Access Forbidden: Multi-user erasure requires CEO permission.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete this ${target}? All linked transactional elements remain secure, but login access will terminate.`)) {
      if (target === 'Branch') deleteBranch(id);
      else deleteUser(id);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/60 pb-5 font-sans">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">EMPLOYEES & MULTI-BRANCH PORTAL</h2>
          <p className="text-xs text-slate-400 font-medium">Configure network branches & manage credentials permissions</p>
        </div>

        <div className="flex bg-slate-905 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('Branches')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'Branches' 
                ? 'bg-red-600 text-white font-extrabold shadow' 
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Showroom Branches
          </button>
          <button
            onClick={() => setActiveTab('Users')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'Users' 
                ? 'bg-red-600 text-white font-extrabold shadow' 
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Employee Credentials
          </button>
        </div>
      </div>

      {currentUser?.role === 'Admin' ? (
        <div className="flex justify-end mb-2">
          <button
            onClick={() => openCreateModal(activeTab === 'Branches' ? 'Branch' : 'User')}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs uppercase cursor-pointer"
          >
            <Plus size={14} />
            <span>Add {activeTab === 'Branches' ? 'Branch Store' : 'Staff Profile'}</span>
          </button>
        </div>
      ) : (
        <div className="bg-yellow-500/5 border border-yellow-500/20 p-4 rounded-xl flex items-start gap-2 text-xs text-yellow-500 font-medium">
          <ShieldAlert size={16} className="shrink-0 mt-0.5" />
          <span>Security Notice: Branches and User accounts are locked for view-only to floor showroom staff. CEO credentials required to establish outlets.</span>
        </div>
      )}

      {activeTab === 'Branches' ? (
        /* Branches Table List */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {branches.map(b => (
            <div key={b.id} className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl space-y-4">
              <div className="flex justify-between items-start gap-2">
                <div className="space-y-1">
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase ${
                    b.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' : 'bg-red-500/10 text-red-500 border border-red-500/10'
                  }`}>
                    {b.status}
                  </span>
                  <h3 className="text-base font-extrabold text-white">{b.name}</h3>
                </div>
                <MapPin size={18} className="text-red-500" />
              </div>

              <p className="text-xs text-slate-500 font-medium">{b.location}</p>

              {currentUser?.role === 'Admin' && (
                <div className="flex justify-end gap-2 border-t border-slate-800/40 pt-3">
                  <button
                    onClick={() => openEditModal('Branch', b)}
                    className="p-1 px-2.5 bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                  >
                    <Edit2 size={10} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete('Branch', b.id)}
                    className="p-1 px-2.5 bg-red-500/5 hover:bg-red-500/10 border border-red-500/15 text-red-400 rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                  >
                    <Trash2 size={10} />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Users List table */
        <div className="space-y-6">
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/20">
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 text-[10px] font-bold uppercase select-none">
                  <th className="p-3">Cryptographic username</th>
                  <th className="p-3">Email coordinate</th>
                  <th className="p-3">Linked Primary Branch</th>
                  <th className="p-3 text-center">Security Level Role</th>
                  <th className="p-3">Enrolled date</th>
                  <th className="p-3 text-center">Edit Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 font-medium">
                {users.map(u => {
                  const brName = branches.find(b => b.id === u.branchId)?.name || 'Direct HQ';
                  return (
                    <tr key={u.id} className="hover:bg-slate-900/10 transition-colors animate-fadeIn">
                      <td className="p-3 text-white font-extrabold select-all flex items-center gap-1.5">
                        <UserCheck size={14} className="text-red-500" />
                        <span>{u.username}</span>
                      </td>
                      <td className="p-3 select-all text-slate-400">{u.email}</td>
                      <td className="p-3 text-slate-300">{brName.replace('Showroom', '')}</td>
                      <td className="p-3 text-center">
                        <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                          u.role === 'Admin' 
                            ? 'bg-red-605/10 border border-red-600/20 text-red-400 font-black' 
                            : 'bg-blue-600/10 border border-blue-600/20 text-blue-400 font-bold'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 font-mono">{u.joinedDate}</td>
                      <td className="p-3 text-center">
                        {currentUser?.role === 'Admin' && (
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() => openEditModal('User', u)}
                              className="p-1 text-slate-400 hover:text-white transition"
                            >
                              <Edit2 size={13} />
                            </button>
                            {u.id !== currentUser.id && (
                              <button
                                onClick={() => handleDelete('User', u.id)}
                                className="p-1 text-slate-500 hover:text-red-500 transition"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Core Dynamic Role permissions breakdown widget */}
          <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">Dynamic Security Level Index Roles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-400">
              <div className="p-3 bg-red-600/5 border border-red-500/10 rounded-xl space-y-2">
                <h4 className="font-extrabold text-white text-xs uppercase text-red-400 flex items-center gap-1">
                  <Check size={14} />
                  <span>1. CFO/CEO ADMIN CLASS (Full Access)</span>
                </h4>
                <p className="text-[11px] leading-relaxed">Can modify pricing catalog ratios, establish inward stock, delete invoice logs, modify settings databases, bypass manual VAT rules, retrieve archived recovery files, and manage user login credentials.</p>
              </div>

              <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl space-y-2">
                <h4 className="font-bold text-white text-xs uppercase text-blue-400 flex items-center gap-1">
                  <Check size={14} />
                  <span>2. FLOOR SALES STAFF CLASS (Sales View/Check Only)</span>
                </h4>
                <p className="text-[11px] leading-relaxed">Can search active specifications, verify IMEI stock listings, create sales point-of-sale invoices, and preview report analytics charts. STRICTLY BLOCKED from erasing any invoice or catalog item, modifying settings details, or modifying other employee details.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULL BRANCH / USER EDIT MODAL PANEL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
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
              
              {modalType === 'Branch' ? (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Branch Store Title</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Dubai Marina Mall Retail"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-3 text-xs text-white focus:outline-none focus:border-red-500/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Exact Store Location ADDRESS</label>
                    <input
                      type="text"
                      required
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Sheikh Zayed Road Towers"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-3 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Operational Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-2 text-xs text-slate-300 focus:outline-none"
                    >
                      <option value="Active">Active Showroom Mode</option>
                      <option value="Inactive">De-activated Storage Mode</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Staff login Username</label>
                    <input
                      type="text"
                      required
                      value={username}
                      disabled={modalMode === 'Edit'} // safe lockout username edit
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. sale_dxb"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-3 text-xs text-white focus:outline-none disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Email Coordinates</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="staff@alqwas.ae"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-3 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block">Linked Shop Branch</label>
                      <select
                        value={selectedBranchId}
                        onChange={(e) => setSelectedBranchId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-2 text-xs text-slate-300 focus:outline-none"
                      >
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name.split(' ')[0]}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block">Security Clearance Role</label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-2 text-xs text-slate-300 focus:outline-none"
                      >
                        <option value="Admin">CEO Admin</option>
                        <option value="Staff">Floor Sales Representative</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

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
                  Apply Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
