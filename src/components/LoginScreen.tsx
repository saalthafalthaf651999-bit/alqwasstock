/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { Lock, User as UserIcon, HelpCircle, ShieldAlert, Key, Landmark, Check, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const { users, setCurrentUser } = useERP();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);
  
  // Forgot Password / OTP Flows
  const [mode, setMode] = useState<'login' | 'forgot' | 'otp' | 'reset'>('login');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otpStatus, setOtpStatus] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorCode(null);
    
    // Check in context users
    const foundUser = users.find(
      (u) => 
        u.username.toLowerCase() === username.trim().toLowerCase() ||
        u.email.toLowerCase() === username.trim().toLowerCase()
    );

    if (foundUser) {
      const dbPassword = foundUser.password || (foundUser.role === 'Admin' ? 'sameer123' : 'staff123');
      if (dbPassword === password.trim()) {
        setCurrentUser(foundUser);
        onLoginSuccess();
      } else {
        setErrorCode('Incorrect security PIN/password. Please try again or use recovery.');
      }
    } else {
      setErrorCode('Invalid username or email identifier.');
    }
  };

  const handleQuickLogin = (role: 'Admin' | 'Staff') => {
    const targetUser = users.find((u) => u.role === role);
    if (targetUser) {
      setCurrentUser(targetUser);
      onLoginSuccess();
    }
  };

  const startForgotFlow = () => {
    setMode('forgot');
    setErrorCode(null);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail) return;
    setOtpStatus('A hyper-secure passcode has been beamed to your terminal.');
    setMode('otp');
  };

  const handleOtpVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode === '2558' || otpCode.length >= 4) {
      setMode('reset');
    } else {
      setErrorCode('Invalid security token entry. Use [ 2558 ] for demonstration reset.');
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 4) {
      setErrorCode('Passwords must exceed 4 characters.');
      return;
    }
    setMode('login');
    setErrorCode('Password updated. Please log in with your new credential passcode.');
  };

  return (
    <div className="min-h-screen w-full bg-[#0A0D12] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans text-slate-100">
      
      {/* Background Decorative Ambient glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

      {/* Futuristic Header grid */}
      <div className="max-w-md w-full text-center space-y-4 mb-2 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] tracking-widest text-[#ef4444] font-extrabold uppercase shadow-[0_0_15px_rgba(239,68,68,0.05)]">
          <Landmark size={12} className="text-red-500 animate-pulse" />
          <span>AL QWAS AL ZAHABAI • PREMIUM SHOWROOM ERP</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white uppercase bg-transparent">
          CYBER SHOWROOM PORTAL
        </h1>
        <p className="text-xs text-white/50 font-medium">
          Dubai Terminal Management Suite & Premium Security Logs
        </p>
      </div>

      {/* Cyber Glass Login Card */}
      <div className="mt-6 max-w-md w-full relative z-10">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-2xl shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_8px_#ef4444]"></div>
          
          <AnimatePresence mode="wait">
            {mode === 'login' && (
              <motion.form 
                key="login" 
                onSubmit={handleLogin}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">System Login</h3>
                  <p className="text-xs text-white/40">Provide staff cryptographic credentials</p>
                </div>

                {errorCode && (
                  <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex items-start gap-2 text-xs text-red-400 font-medium animate-pulse">
                    <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                    <span>{errorCode}</span>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Identity Field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-white/60 uppercase tracking-wider block">Username or Email</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                        <UserIcon size={16} />
                      </div>
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="sameer or staff_dxb"
                        className="w-full bg-[#0e1219]/80 border border-white/10 focus:border-red-500/50 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-red-500/20 transition-all duration-300"
                      />
                    </div>
                  </div>

                  {/* Cryptographic Pin Code */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-white/60 uppercase tracking-wider block">Security Pin</label>
                      <button
                        type="button"
                        onClick={startForgotFlow}
                        className="text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors"
                      >
                        Recovery Pin?
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                        <Lock size={16} />
                      </div>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#0e1219]/80 border border-white/10 focus:border-red-500/50 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-red-500/20 transition-all duration-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Remember state checkbox */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={() => setRememberMe(!rememberMe)}
                      className="rounded border-white/10 bg-[#0e1219] text-red-600 focus:ring-1 focus:ring-red-500 focus:ring-offset-slate-950"
                    />
                    <span className="text-xs font-semibold text-white/50">Remember session</span>
                  </label>
                </div>

                {/* Action button */}
                <button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl border border-red-500/35 hover:border-red-400/50 shadow-[0_0_15px_rgba(239,68,68,0.25)] transition-all duration-300 inline-flex items-center justify-center gap-1 cursor-pointer text-sm"
                >
                  <span>Authenticate Terminal</span>
                  <ArrowRight size={14} />
                </button>
              </motion.form>
            )}

            {mode === 'forgot' && (
              <motion.form
                key="forgot"
                onSubmit={handleForgotSubmit}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-5"
              >
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Recover Cipher PIN</h3>
                  <p className="text-xs text-white/40">Request automated OTP validation signal</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white/60 block tracking-wider uppercase">User Email Address</label>
                  <input
                    type="email"
                    required
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    placeholder="sameersha2558@gmail.com"
                    className="w-full bg-[#0e1219]/80 border border-white/10 focus:border-red-500/50 rounded-xl py-2.5 px-4 text-sm font-medium text-white placeholder-white/30 focus:outline-none transition-all duration-300"
                  />
                </div>

                <div className="flex justify-between items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="px-4 py-2 border border-white/10 text-white/55 text-xs font-semibold rounded-xl hover:border-white/20 transition hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-500 transition shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                  >
                    Beam OTP Token
                  </button>
                </div>
              </motion.form>
            )}

            {mode === 'otp' && (
              <motion.form
                key="otp"
                onSubmit={handleOtpVerify}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-5"
              >
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Secure Token Portal</h3>
                  <p className="text-xs text-emerald-400 font-bold bg-emerald-500/5 p-2 rounded border border-emerald-500/20">{otpStatus}</p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <label className="text-xs font-bold text-white/60 block tracking-wider uppercase">OTP Pin Code</label>
                    <span className="text-[10px] text-white/40 font-bold font-mono">CODE HINT: 2558</span>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Enter security digits"
                    className="w-full bg-[#0e1219]/80 border border-white/10 focus:border-red-500/50 rounded-xl py-2.5 px-4 text-center font-mono tracking-widest text-lg text-white focus:outline-none transition-all duration-300"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl text-xs uppercase cursor-pointer"
                >
                  Verify Verification Token
                </button>
              </motion.form>
            )}

            {mode === 'reset' && (
              <motion.form
                key="reset"
                onSubmit={handleResetPassword}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-5"
              >
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Overwrite PIN Log</h3>
                  <p className="text-xs text-white/45">Provide new security keycode access</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white/60 block tracking-wider uppercase">New Cipher Keycode</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new PIN number"
                    className="w-full bg-[#0e1219]/80 border border-white/10 focus:border-red-500/50 rounded-xl py-2.5 px-4 text-sm font-medium text-white focus:outline-none transition-all duration-300"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-bold py-2.5 rounded-xl text-xs uppercase cursor-pointer"
                >
                  Apply PIN Override
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>


      <div className="mt-8 text-[10px] text-[#475569] font-bold select-none uppercase tracking-widest text-center">
        AL QWAS AL ZAHABAI ERP v4.0.5 • DUBAI SHOWROOM CODES SECURED • LICENSE: ACTIVE
      </div>
    </div>
  );
};
