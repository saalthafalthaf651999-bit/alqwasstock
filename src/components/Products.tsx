/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useERP } from '../context/ERPContext';
import { Product, BrandType, CategoryType } from '../types';
import { Search, Plus, Edit2, Trash2, X, Check, Barcode } from 'lucide-react';
import { InvoicePDF } from './InvoicePDF';

export const Products: React.FC = () => {
  const { 
    products, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    currentUser, 
    imeis,
    sales,
    customers,
    branches,
    suppliers,
    settings
  } = useERP();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Modal / Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'Create' | 'Edit'>('Create');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [brand, setBrand] = useState<BrandType>('Apple');
  const [category, setCategory] = useState<CategoryType>('Flagship');
  const [ramRom, setRamRom] = useState('');
  const [color, setColor] = useState('');
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);

  // Barcode visualization modal state
  const [viewedBarcodeProduct, setViewedBarcodeProduct] = useState<Product | null>(null);

  // Stock lookup and print PDF states
  const [viewingStockProduct, setViewingStockProduct] = useState<Product | null>(null);
  const [activePrintSale, setActivePrintSale] = useState<any | null>(null);

  const productIMEIs = useMemo(() => {
    if (!viewingStockProduct) return [];
    return imeis.filter((i) => i.productId === viewingStockProduct.id);
  }, [imeis, viewingStockProduct]);

  const brandsList: BrandType[] = [
    'Apple', 'Samsung', 'Vivo', 'Oppo', 'Realme', 'iQOO', 'Xiaomi', 'OnePlus', 'Honor', 'Nokia'
  ];

  const categoriesList: CategoryType[] = [
    'Flagship', 'Mid Range', 'Low Range', 'Keypad'
  ];

  // Filters
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.ramRom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.color.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchBrand = selectedBrand === 'All' || p.brand === selectedBrand;
      const matchCategory = selectedCategory === 'All' || p.category === selectedCategory;

      return matchSearch && matchBrand && matchCategory;
    });
  }, [products, searchTerm, selectedBrand, selectedCategory]);

  const openCreateModal = () => {
    setFormMode('Create');
    setName('');
    setBrand('Apple');
    setCategory('Flagship');
    setRamRom('8GB/256GB');
    setColor('Black');
    setPurchasePrice(0);
    setSellingPrice(0);
    setIsFormOpen(true);
  };

  const openEditModal = (p: Product) => {
    // Permission check: Staff cannot edit purchase price or manage core details
    if (currentUser?.role === 'Staff') {
      alert('Security violation: Sales staff cannot modify product structures.');
      return;
    }
    setFormMode('Edit');
    setEditingId(p.id);
    setName(p.name);
    setBrand(p.brand);
    setCategory(p.category);
    setRamRom(p.ramRom);
    setColor(p.color);
    setPurchasePrice(p.purchasePrice);
    setSellingPrice(p.sellingPrice);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !ramRom || !color || purchasePrice <= 0 || sellingPrice <= 0) {
      alert('Ensure all standard parameters are non-zero.');
      return;
    }

    if (formMode === 'Create') {
      addProduct({
        name,
        brand,
        category,
        ramRom,
        color,
        purchasePrice,
        sellingPrice,
      });
    } else {
      if (editingId) {
        updateProduct(editingId, {
          name,
          brand,
          category,
          ramRom,
          color,
          purchasePrice,
          sellingPrice,
        });
      }
    }
    setIsFormOpen(false);
  };

  const handleDelete = (id: string, prodName: string) => {
    if (currentUser?.role === 'Staff') {
      alert('Security Alert: Sales staff cannot delete inventory models.');
      return;
    }
    if (window.confirm(`Do you wish to remove product model ${prodName}? It will be moved to the safe recovery log.`)) {
      deleteProduct(id);
    }
  };

  if (activePrintSale) {
    const customerObject = customers.find(c => c.id === activePrintSale.customerId) || {
      id: 'guest',
      name: 'Walk-In Guest Ledger',
      mobile: '+971 50 000 0000',
      type: 'Retail',
      pendingAmount: 0
    };
    const branchObject = branches.find(b => b.id === activePrintSale.branchId) || branches[0];

    return (
      <InvoicePDF
        sale={activePrintSale}
        customer={customerObject as any}
        branch={branchObject}
        settings={settings}
        onBack={() => setActivePrintSale(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/60 pb-5">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">GALAXY SHOWROOM INVENTORY</h2>
          <p className="text-xs text-slate-400 font-medium">Core gadget configurations & price registries</p>
        </div>

        {currentUser?.role === 'Admin' && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all duration-300 cursor-pointer text-xs uppercase"
          >
            <Plus size={14} />
            <span>Create product model</span>
          </button>
        )}
      </div>

      {/* Filter Options panel */}
      <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/80 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Broad Search field */}
          <div className="md:col-span-6 relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Filter by name, description, variant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 text-sm focus:border-red-500/50 rounded-xl py-2 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-red-500/15"
            />
          </div>

          {/* Brand dropdown */}
          <div className="md:col-span-3">
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-red-500/50 rounded-xl py-2 px-3 text-sm text-slate-300 focus:outline-none"
            >
              <option value="All">All Showroom Brands</option>
              {brandsList.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Category dropdown */}
          <div className="md:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-red-500/50 rounded-xl py-2 px-3 text-sm text-slate-300 focus:outline-none"
            >
              <option value="All">All Categories</option>
              {categoriesList.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid List Products */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProducts.map((p) => {
          const matchingStockCount = imeis.filter((i) => i.productId === p.id && i.status === 'In Stock').length;
          
          return (
            <div 
              key={p.id} 
              className="bg-slate-900/40 backdrop-blur border border-slate-800/85 p-5 rounded-2xl relative overflow-hidden group hover:border-red-500/35 transition-all duration-300"
            >
              {/* Product Info Display */}
              <div className="flex justify-between items-start gap-2">
                <div>
                  <span className="text-[10px] font-mono tracking-widest text-[#ef4444] uppercase font-bold">
                    {p.brand} • {p.category}
                  </span>
                  <h3 className="text-base font-extrabold text-white mt-1 group-hover:text-red-400 transition-colors">
                    {p.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    Spec: {p.ramRom} | Color: {p.color}
                  </p>
                </div>
                
                <span className="text-[10px] bg-slate-950 text-slate-400 px-2 py-0.5 rounded border border-slate-800/80 font-mono font-bold select-all">
                  {p.id}
                </span>
              </div>

              {/* Stats and Stock count */}
              <div className="mt-5 grid grid-cols-2 gap-4 border-t border-b border-slate-800/50 py-3.5 text-xs">
                {currentUser?.role === 'Admin' ? (
                  <div>
                    <span className="text-[9px] text-zinc-500 block uppercase font-bold">Purchase Rate</span>
                    <span className="text-slate-200 font-mono font-extrabold">{p.purchasePrice.toLocaleString()} AED</span>
                  </div>
                ) : (
                  <div>
                    <span className="text-[9px] text-zinc-500 block uppercase font-bold">Secure Info</span>
                    <span className="text-slate-500 font-mono italic">Protected</span>
                  </div>
                )}
                <div>
                  <span className="text-[9px] text-zinc-500 block uppercase font-bold">Showroom Rate</span>
                  <span className="text-emerald-400 font-mono font-extrabold">{p.sellingPrice.toLocaleString()} AED</span>
                </div>
              </div>

              {/* Actions & Inventory Status Counter */}
              <div className="mt-4 flex justify-between items-center bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/40">
                <span 
                  onClick={() => {
                    if (matchingStockCount > 0) {
                      setViewingStockProduct(p);
                    }
                  }}
                  className={`text-[11px] font-bold px-2 py-0.5 rounded select-none ${
                    matchingStockCount === 0 
                      ? 'bg-red-600/10 text-red-500 border border-red-500/20' 
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25 cursor-pointer hover:underline transition-all duration-200'
                  }`}
                  title={matchingStockCount > 0 ? 'Click to view specific IMEI stock list' : 'Out of stock'}
                >
                  {matchingStockCount === 0 ? 'Out of stock' : `${matchingStockCount} Device stocked(s)`}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setViewedBarcodeProduct(p)}
                    title="View SKU Barcode"
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/70 rounded-lg transition"
                  >
                    <Barcode size={15} />
                  </button>

                  {currentUser?.role === 'Admin' && (
                    <>
                      <button
                        onClick={() => openEditModal(p)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/70 rounded-lg transition"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Barcode Visualization Modal */}
      {viewedBarcodeProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 max-w-sm w-full p-6 rounded-2xl relative select-none">
            <button
              onClick={() => setViewedBarcodeProduct(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
            >
              <X size={18} />
            </button>
            <div className="text-center space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">SKU Barcode Generation</h3>
              <p className="text-xs text-slate-400 font-semibold">{viewedBarcodeProduct.name}</p>
              
              {/* Stunning neon cyber barcode visual layout */}
              <div className="bg-white p-5 rounded-xl inline-block w-full border border-slate-700/60 shadow-inner">
                <div className="py-4 space-y-0.5 flex flex-col items-center justify-center">
                  <div className="h-14 w-44 flex justify-between items-stretch">
                    {/* Simulated vector barcode bars */}
                    {[1, 3, 2, 4, 1, 2, 4, 3, 1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4].map((width, idx) => (
                      <div 
                        key={idx} 
                        className="bg-black shrink-0" 
                        style={{ width: `${width}px` }}
                      ></div>
                    ))}
                  </div>
                  <span className="font-mono text-xs text-black tracking-[0.3em] font-bold mt-2">
                    {viewedBarcodeProduct.id}
                  </span>
                </div>
              </div>
              
              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 text-left text-[11px] text-slate-500">
                <p>Ensure terminal is mapped to laser scanner. Product catalog auto scans via scanning this bar code on purchases & point-of-sale.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Add/Edit Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 max-w-lg w-full p-6 sm:p-8 rounded-2xl relative">
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-black text-white tracking-tight uppercase mb-5">
              {formMode === 'Create' ? 'Add Inventory Product Model' : 'Modify Showroom Model Details'}
            </h3>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-slate-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Name */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-400 block uppercase">Product Model Title</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. iPhone 15 Pro Max, Galaxy S24"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-red-500/50"
                  />
                </div>

                {/* Brand */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block uppercase">Brand Origin</label>
                  <select
                    value={brand}
                    onChange={(e) => setBrand(e.target.value as BrandType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-300 focus:outline-none"
                  >
                    {brandsList.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block uppercase">Showroom Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as CategoryType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-300 focus:outline-none"
                  >
                    {categoriesList.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Spec RAM-ROM */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block uppercase">Hardware Variant (RAM/ROM)</label>
                  <input
                    type="text"
                    required
                    value={ramRom}
                    onChange={(e) => setRamRom(e.target.value)}
                    placeholder="e.g. 16GB/512GB, 4MB"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white focus:outline-none"
                  />
                </div>

                {/* Colors */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block uppercase">Colorway</label>
                  <input
                    type="text"
                    required
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="e.g. Titanium Blue, Natural"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white focus:outline-none"
                  />
                </div>

                {/* Rates */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block uppercase">Purchase Wholesale Price (AED)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={purchasePrice || ''}
                    onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                    placeholder="Cost price"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block uppercase">Selling Retail Price (AED)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={sellingPrice || ''}
                    onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                    placeholder="Sale price"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white focus:outline-none"
                  />
                </div>

              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-slate-800 text-slate-400 text-xs font-bold rounded-xl hover:border-slate-700 transition"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                >
                  Save Model Specifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW STOCK DETAIL MODAL */}
      {viewingStockProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 max-w-2xl w-full p-6 rounded-2xl relative shadow-[0_0_50px_rgba(0,0,0,0.8)] align-middle">
            <button
              onClick={() => setViewingStockProduct(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition p-1 hover:bg-slate-800 rounded-lg"
            >
              <X size={18} />
            </button>
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-[10px] font-mono tracking-widest text-[#ef4444] uppercase font-black">
                  {viewingStockProduct.brand} • {viewingStockProduct.category}
                </span>
                <h3 className="text-lg font-black text-white mt-1">{viewingStockProduct.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Spec: {viewingStockProduct.ramRom} | Color: {viewingStockProduct.color}</p>
              </div>

              <div className="max-h-[350px] overflow-y-auto space-y-3.5 pr-2">
                {productIMEIs.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-8 text-center">No active units registered for this model.</p>
                ) : (
                  productIMEIs.map((i) => {
                    const linkedSale = i.status === 'Sold' ? sales.find((s) => s.items.some((item) => item.imei === i.imei)) : null;
                    const bName = branches.find((b) => b.id === i.branchId)?.name || 'Main Showroom';
                    const sName = suppliers.find((s) => s.id === i.supplierId)?.name || 'Direct Import';
                    return (
                      <div key={i.imei} className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-white tracking-wider select-all text-sm bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{i.imei}</span>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                              i.status === 'In Stock'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : i.status === 'Sold'
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            }`}>
                              {i.status}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 space-y-1 pt-1.5">
                            <p><span className="text-slate-500 uppercase font-bold text-[9px] tracking-wider">Branch/Outlet:</span> {bName}</p>
                            <p><span className="text-slate-500 uppercase font-bold text-[9px] tracking-wider">Supplier Source:</span> {sName}</p>
                            <p><span className="text-slate-500 uppercase font-bold text-[9px] tracking-wider">Date Tracked:</span> {new Date(i.createdAt).toLocaleString()}</p>
                          </div>
                        </div>

                        {i.status === 'Sold' && linkedSale ? (
                          <button
                            onClick={() => {
                              setViewingStockProduct(null);
                              setActivePrintSale(linkedSale);
                            }}
                            className="bg-red-600 hover:bg-red-500 text-white font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-all text-[11px] self-start sm:self-center uppercase flex items-center gap-1 cursor-pointer"
                          >
                            <Barcode size={13} />
                            <span>Invoice / PDF</span>
                          </button>
                        ) : null}
                      </div>
                    );
                  })
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setViewingStockProduct(null)}
                  className="px-4 py-2 border border-slate-800 text-slate-400 text-xs font-bold rounded-xl hover:border-slate-700 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
