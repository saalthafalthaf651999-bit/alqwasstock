/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { Sale, Customer, Branch, SystemSettings } from '../types';
import { Printer, Download, Share2, Mail, CheckCircle, FileText, ArrowLeft } from 'lucide-react';

interface InvoicePDFProps {
  sale: Sale;
  customer: Customer;
  branch: Branch;
  settings: SystemSettings;
  onBack: () => void;
}

// Simple English Number-to-Words converter for UAE AED
export function convertNumberToWordsAED(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  const mainPart = Math.floor(rounded);
  const filsPart = Math.round((rounded - mainPart) * 100);

  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const thousands = ['', 'Thousand', 'Million', 'Billion'];

  function convertLessThanThousand(n: number): string {
    if (n === 0) return '';
    let res = '';
    if (n >= 100) {
      res += units[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      res += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      res += units[n] + ' ';
    }
    return res.trim();
  }

  function convert(n: number): string {
    if (n === 0) return 'Zero';
    let res = '';
    let i = 0;
    while (n > 0) {
      const rest = n % 1000;
      if (rest !== 0) {
        res = convertLessThanThousand(rest) + ' ' + thousands[i] + ' ' + res;
      }
      n = Math.floor(n / 1000);
      i++;
    }
    return res.trim();
  }

  const mainWords = convert(mainPart);
  const filsWords = filsPart > 0 ? ` and ${convert(filsPart)} Fils` : '';
  return `AED ${mainWords}${filsWords} Only`;
}

export const InvoicePDF: React.FC<InvoicePDFProps> = ({ sale, customer, branch, settings, onBack }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [thermalMode, setThermalMode] = React.useState<boolean>(false);

  const handlePrint = () => {
    window.print();
  };

  const downloadCSV = () => {
    // Generate simple csv data representing the invoice
    let csvContent = `data:text/csv;charset=utf-8,`;
    csvContent += `AL QWAS AL ZAHABAI - INVOICE ${sale.invoiceNo}\r\n`;
    csvContent += `Date,${sale.date.split('T')[0]}\r\n`;
    csvContent += `Branch,${branch.name}\r\n`;
    csvContent += `Customer,${customer.name}\r\n`;
    csvContent += `Phone,${customer.mobile}\r\n\r\n`;
    csvContent += `Product,IMEI,Price,Discount,VAT,Total\r\n`;
    
    sale.items.forEach(item => {
      csvContent += `"${item.productName}","${item.imei}",${item.price},${item.discount},${item.vatPercent}%,${item.total}\r\n`;
    });
    
    csvContent += `\r\nSubtotal,${sale.subTotal}\r\n`;
    csvContent += `VAT Total,${sale.vatTotal}\r\n`;
    csvContent += `Discount,${sale.discountTotal}\r\n`;
    csvContent += `Grand Total,${sale.finalAmount}\r\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Invoice_${sale.invoiceNo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const amountInWords = convertNumberToWordsAED(sale.finalAmount);

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8 text-white relative">
      {/* Background Decorative Laser line */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_10px_#ef4444]"></div>
      
      {/* Action Header */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 backdrop-blur-md">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 border border-slate-800 hover:border-red-500/50 hover:bg-red-500/10 active:bg-red-500/20 text-slate-300 hover:text-red-400 rounded-lg transition-all duration-300 font-medium"
        >
          <ArrowLeft size={16} />
          <span>Back to Billing</span>
        </button>
        
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setThermalMode(!thermalMode)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all duration-300 ${
              thermalMode 
                ? 'bg-red-500/20 text-red-400 border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.2)]' 
                : 'border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
            }`}
          >
            {thermalMode ? 'A4 Invoice Mode' : 'Thermal Receipt Mode'}
          </button>
          
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 hover:border-slate-600 transition-all cursor-pointer font-medium"
          >
            <Printer size={14} />
            <span>Print Invoice</span>
          </button>
          
          <button
            onClick={downloadCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all shadow-[0_0_10px_rgba(239,68,68,0.3)] cursor-pointer font-medium"
          >
            <Download size={14} />
            <span>Excel Export</span>
          </button>
        </div>
      </div>

      {/* Invoice Document Body */}
      <div className="max-w-4xl mx-auto">
        <style>
          {`
            @media print {
              body {
                background: white !important;
                color: black !important;
              }
              .no-print {
                display: none !important;
              }
              .print-area {
                background: white !important;
                color: black !important;
                padding: 0 !important;
                box-shadow: none !important;
                border: none !important;
                width: 100% !important;
                margin: 0 !important;
              }
              /* For thermal printer styling */
              .thermal-print {
                width: 80mm !important;
                max-width: 80mm !important;
                padding: 4mm !important;
                font-size: 11px !important;
                line-height: 1.2 !important;
                color: black !important;
                background: white !important;
              }
              .thermal-print table {
                font-size: 10px !important;
              }
              .laser-neon, .glow-wrapper {
                text-shadow: none !important;
                box-shadow: none !important;
                border-color: #000 !important;
              }
            }
          `}
        </style>

        {/* 1. Thermal Printer Formatter */}
        {thermalMode ? (
          <div 
            ref={printRef}
            className="print-area thermal-print bg-white text-black p-6 mx-auto rounded-lg border border-dashed border-slate-300 shadow-md max-w-[320px] font-mono select-all"
          >
            <div className="text-center border-b border-slate-300 pb-3 mb-3">
              <h2 className="font-bold text-lg tracking-tight uppercase">AL QWAS AL ZAHABAI</h2>
              <p className="text-[10px] text-slate-800">PREMIUM MOBILE SHOWROOM</p>
              <p className="text-[9px] mt-1">VAT REGISTERED: TRN {settings.vatNo}</p>
              <p className="text-[9px]">{branch.name}</p>
              <p className="text-[9px]">{branch.location}</p>
              <p className="text-[9px]">TEL: {settings.phone}</p>
            </div>

            <div className="text-[10px] space-y-1 mb-3 border-b border-slate-200 pb-2">
              <div className="flex justify-between">
                <span>INVOICE NO:</span>
                <span className="font-bold">{sale.invoiceNo}</span>
              </div>
              <div className="flex justify-between">
                <span>DATE:</span>
                <span>{sale.date.replace('T', ' ').substr(0, 19)}</span>
              </div>
              <div className="flex justify-between">
                <span>SALESPERSON:</span>
                <span>{sale.salesPerson.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span>CUSTOMER:</span>
                <span className="font-semibold text-right max-w-[150px] truncate">{customer.name}</span>
              </div>
              <div className="flex justify-between">
                <span>MOB:</span>
                <span>{customer.mobile}</span>
              </div>
            </div>

            {/* Thermal Table */}
            <table className="w-full text-left text-[10px] mb-4">
              <thead>
                <tr className="border-b border-slate-400">
                  <th className="py-1">ITEM/IMEI</th>
                  <th className="py-1 text-center font-bold">QTY</th>
                  <th className="py-1 text-right">TOTAL (AED)</th>
                </tr>
              </thead>
              <tbody>
                {sale.items.map((item, index) => (
                  <tr key={index} className="border-b border-slate-100 last:border-0">
                    <td className="py-1.5 pr-1">
                      <div className="font-bold text-slate-900">{item.productName}</div>
                      <div className="text-[9px] text-slate-600">IMEI: {item.imei}</div>
                    </td>
                    <td className="py-1.5 text-center font-medium">1</td>
                    <td className="py-1.5 text-right font-medium">{item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="border-t border-slate-400 pt-2 space-y-1 text-xs font-bold">
              <div className="flex justify-between font-normal text-[11px]">
                <span>SUBTOTAL:</span>
                <span>{sale.subTotal.toFixed(2)} AED</span>
              </div>
              {sale.discountTotal > 0 && (
                <div className="flex justify-between font-normal text-[11px] text-red-600">
                  <span>DISCOUNT:</span>
                  <span>-{sale.discountTotal.toFixed(2)} AED</span>
                </div>
              )}
              <div className="flex justify-between font-normal text-[11px]">
                <span>VAT ({sale.vatPercent}%):</span>
                <span>{sale.vatTotal.toFixed(2)} AED</span>
              </div>
              <div className="flex justify-between text-base border-t border-double border-slate-400 pt-1">
                <span>TOTAL:</span>
                <span>{sale.finalAmount.toFixed(2)} AED</span>
              </div>
            </div>

            <div className="mt-3 text-[9px] text-slate-700 italic flex justify-between">
              <span>Pay Method: {sale.paymentMethod} {sale.cardType ? `(${sale.cardType})` : ''}</span>
            </div>

            <div className="mt-6 text-center text-[9px] border-t border-slate-200 pt-3 text-slate-800 space-y-1">
              <p className="font-bold">✨ THANK YOU FOR BUSINESS ✨</p>
              <p>شكرًا لتعاملكم معنا</p>
              <p className="mt-2 text-[8px] max-w-[240px] mx-auto">
                "Goods once sold cannot be returned without valid reason. 1 Year official warranty where applicable."
              </p>
              
              {/* Fake QR Mini Mock in Receipt */}
              <div className="mt-3 inline-block bg-slate-100 p-1.5 rounded">
                <div className="w-16 h-16 border border-slate-300 flex items-center justify-center font-bold text-[7px] text-slate-500 bg-white">
                  [ QR CODE ]
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* 2. Premium A4 Luxury Invoice */
          <div 
            ref={printRef}
            className="print-area bg-gradient-to-b from-slate-900 to-slate-950 p-6 md:p-10 rounded-2xl border border-slate-800/80 shadow-[0_20px_50px_rgba(0,0,0,0.4)] relative overflow-hidden"
          >
            {/* Glowing red accent rings */}
            <div className="absolute top-[-300px] right-[-300px] w-[600px] h-[600px] rounded-full bg-red-600/5 blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-200px] left-[-200px] w-[500px] h-[500px] rounded-full bg-blue-600/5 blur-[100px] pointer-events-none"></div>

            {/* Watermark Logo */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.015] pointer-events-none select-none text-center">
              <h1 className="text-9xl font-bold tracking-widest text-slate-300">AQZ</h1>
              <p className="text-xl tracking-[0.4em] uppercase">AL QWAS AL ZAHABAI</p>
            </div>

            {/* Invoice Header Cards */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start border-b border-slate-800/80 pb-8 relative z-10">
              {/* Left Logo and Brand */}
              <div className="col-span-1 md:col-span-7 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.4)] border border-red-400/30">
                    <span className="font-black text-xl text-white tracking-tighter">AQ</span>
                  </div>
                  <div>
                    <h1 className="text-2xl font-black tracking-tight text-white uppercase bg-gradient-to-r from-red-400 via-white to-slate-100 bg-clip-text text-transparent">AL QWAS AL ZAHABAI</h1>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] tracking-widest uppercase font-bold text-slate-400">Luxury Mobile Showroom ERP</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-slate-400 text-xs font-medium max-w-sm">
                  <p className="text-white font-bold opacity-90">{settings.companyName}</p>
                  <p className="flex items-center gap-1.5">
                    <span className="text-red-400">TRN:</span> {settings.vatNo}
                  </p>
                  <p>{branch.name}</p>
                  <p className="text-slate-500">{branch.location}</p>
                  <p>Tel: {settings.phone} | Email: {settings.email}</p>
                </div>
              </div>

              {/* Right Verification QR and Status Tags */}
              <div className="col-span-1 md:col-span-5 flex md:flex-col justify-between items-end gap-4">
                <div className="text-right space-y-1.5">
                  <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[10px] tracking-wider uppercase font-extrabold shadow-[0_0_10px_rgba(16,185,129,0.05)]">
                    Original Tax Invoice
                  </span>
                  <p className="text-slate-500 text-[10px] font-bold mt-1 tracking-widest uppercase">فاتورة ضريبية</p>
                </div>

                {/* Micro QR Validation code */}
                <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl shadow-lg flex items-center gap-3">
                  <div className="w-16 h-16 bg-white p-1 rounded border border-slate-200 flex flex-col justify-between items-center relative">
                    {/* Visual simulated QR dots */}
                    <div className="grid grid-cols-4 gap-1 w-full h-full opacity-90">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((i) => (
                        <div 
                          key={i} 
                          className={`rounded-sm ${(i % 3 === 0 || i % 7 === 1 || i % 11 === 0) ? 'bg-slate-900' : 'bg-transparent'}`}
                        ></div>
                      ))}
                    </div>
                  </div>
                  <div className="text-left font-sans select-none">
                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Showroom QR Security</p>
                    <p className="text-[8px] text-slate-500">Scan via Dubai FTA App</p>
                    <p className="text-[9px] font-mono text-slate-400 mt-1">Ref: {sale.invoiceNo.replace('AQZ-', '')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Customers Info Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-b border-slate-800/80 text-sm relative z-10">
              <div className="space-y-2 bg-slate-900/30 p-4 rounded-xl border border-slate-800/60">
                <p className="text-xs font-bold uppercase tracking-widest text-red-400">Billing Customer (العميل):</p>
                <div>
                  <h3 className="font-extrabold text-white text-base">{customer.name}</h3>
                  <div className="mt-2 space-y-1 text-xs text-slate-400 font-medium">
                    <p>Phone: {customer.mobile}</p>
                    {customer.address && <p>Address: {customer.address}</p>}
                    <p>Account Type: <span className="text-red-400 font-bold">{customer.type}</span></p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 bg-slate-900/30 p-4 rounded-xl border border-slate-800/60 md:text-right">
                <p className="text-xs font-bold uppercase tracking-widest text-red-400 md:text-right">Transaction Details:</p>
                <div className="space-y-1 text-xs text-slate-400 font-medium md:items-end md:flex md:flex-col">
                  <p className="text-base text-white font-extrabold">Invoice #: <span className="text-red-400">{sale.invoiceNo}</span></p>
                  <p>Transaction Date: <span className="text-white">{sale.date.split('T')[0]}</span></p>
                  <p>Issued Branch: <span className="text-white">{branch.name}</span></p>
                  <p>Billing Representative: <span className="text-white uppercase">{sale.salesPerson}</span></p>
                </div>
              </div>
            </div>

            {/* Products Table */}
            <div className="py-6 relative z-10">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                <FileText size={14} className="text-red-500" />
                <span>Line Items (تفاصيل المنتجات)</span>
              </h3>
              
              <div className="overflow-x-auto rounded-xl border border-slate-800/80">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold">
                      <th className="p-3 w-12 text-center">#</th>
                      <th className="p-3">Product Description</th>
                      <th className="p-3">Unique IMEI Code</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Price (AED)</th>
                      <th className="p-3 text-center">VAT</th>
                      <th className="p-3 text-right">Discount</th>
                      <th className="p-3 text-right text-red-400">Total (AED)</th>
                    </tr>
                    <tr className="bg-slate-900/40 text-[9px] text-slate-500 font-bold border-b border-slate-800/50">
                      <th className="px-3 pb-2 text-center">م</th>
                      <th className="px-3 pb-2">تفاصيل الصنف</th>
                      <th className="px-3 pb-2">رقم IMEI الفريد</th>
                      <th className="px-3 pb-2 text-center">الكمية</th>
                      <th className="px-3 pb-2 text-right">السعر</th>
                      <th className="px-3 pb-2 text-center">الضريبة</th>
                      <th className="px-3 pb-2 text-right">الخصم</th>
                      <th className="px-3 pb-2 text-right">الإجمالي شامل الضريبة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 font-medium">
                    {sale.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/20 text-slate-300">
                        <td className="p-3 text-center text-slate-500 font-bold">{idx + 1}</td>
                        <td className="p-3">
                          <p className="text-white font-extrabold">{item.productName}</p>
                          <p className="text-[10px] text-slate-500">Dubai Quality Standard Approval</p>
                        </td>
                        <td className="p-3">
                          <span className="font-mono text-red-400 bg-red-500/5 border border-red-500/20 px-2 py-0.5 rounded text-[11px] tracking-wider">
                            {item.imei}
                          </span>
                        </td>
                        <td className="p-3 text-center font-bold text-white">1</td>
                        <td className="p-3 text-right">{item.price.toFixed(2)}</td>
                        <td className="p-3 text-center text-slate-400">{item.vatPercent}%</td>
                        <td className="p-3 text-right text-red-500">-{item.discount.toFixed(2)}</td>
                        <td className="p-3 text-right font-extrabold text-white">{item.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Block section */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end py-6 z-10 relative">
              {/* Note left side */}
              <div className="col-span-1 md:col-span-6 space-y-4">
                <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-800/60">
                  <p className="text-[10px] font-bold text-red-400 tracking-wider uppercase mb-1">AED Amount in Words (مبلغ الحروف):</p>
                  <p className="text-white text-xs font-extrabold italic">{amountInWords}</p>
                </div>
                
                <div className="flex gap-2 text-[10px] text-slate-400">
                  <span className="font-bold text-red-400">Payment Status:</span>
                  <span className="text-emerald-400 font-extrabold uppercase">Full Payment Received via [{sale.paymentMethod}]</span>
                  {sale.cardType && <span className="text-xs text-slate-400 font-mono">({sale.cardType})</span>}
                </div>
              </div>

              {/* Math summary right side */}
              <div className="col-span-1 md:col-span-6 space-y-2.5 font-sans">
                <div className="flex justify-between text-xs text-slate-400 font-medium">
                  <span>Subtotal Amount (الإجمالي الخاضع):</span>
                  <span className="text-white">{sale.subTotal.toFixed(2)} AED</span>
                </div>
                {sale.discountTotal > 0 && (
                  <div className="flex justify-between text-xs text-red-500 font-medium">
                    <span>Discount Deducted (خصم):</span>
                    <span>-{sale.discountTotal.toFixed(2)} AED</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-slate-400 font-medium">
                  <span>UAE VAT ({sale.vatPercent}%):</span>
                  <span className="text-white">{sale.vatTotal.toFixed(2)} AED</span>
                </div>
                
                <div className="border-t border-slate-800 my-2 pt-2"></div>

                <div className="flex justify-between items-center p-3.5 bg-gradient-to-r from-red-600/10 to-transparent border border-red-500/20 rounded-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-1 h-full bg-red-500"></div>
                  <div>
                    <span className="text-xs font-bold text-red-400 block tracking-widest uppercase">GRAND TOTAL DUE (المبلغ النهائي)</span>
                    <span className="text-[9px] text-slate-500 font-semibold block uppercase">Inc. Standard TRN 5% VAT Sales</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-white tracking-tight shadow-red-500/20">
                      {sale.finalAmount.toFixed(2)} <span className="text-xs text-red-400 font-medium">AED</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Signature Block */}
            <div className="grid grid-cols-2 gap-12 pt-12 pb-6 text-xs relative z-10 font-medium text-slate-500">
              <div className="border-t border-slate-800/80 pt-4 space-y-8 text-left">
                <span>Customer Signature (توقيع العميل)</span>
                <div className="h-4 border-b border-dashed border-slate-800"></div>
              </div>
              
              <div className="border-t border-slate-800/80 pt-4 space-y-8 text-right">
                <span className="block text-right">Authorized Shop Signature (التوقيع المصرح به)</span>
                {/* Visual Digital signature of Al Qwas */}
                <div className="relative h-4 flex items-center justify-end">
                  <div className="absolute font-serif text-red-400/40 text-lg rotate-[-12deg] tracking-wider select-none font-bold italic right-1">
                    AL QWAS AL ZAHABAI
                  </div>
                  <div className="w-1/2 border-b border-dashed border-slate-800"></div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-800/80 mt-10 pt-6 text-[10px] text-slate-500 text-center space-y-1 relative z-10 font-semibold max-w-2xl mx-auto leading-relaxed">
              <p className="text-slate-400 font-bold">✨ Thank you for choosing AL QWAS AL ZAHABAI MOBILE SHOWROOM Dubai ✨</p>
              <p>شكراً لاختياركم معرض القواص الذهبي للهواتف المتحركة دبي</p>
              <p className="mt-3 text-slate-600 font-normal">
                Warranty Rules: Standard official warranty of manufacturer applies. Returned units must be unchecked with valid invoice. Good once sold cannot be returned without valid reason, within 3 days maximum condition checking.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
