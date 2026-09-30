import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff, AlertCircle, ShieldCheck, Store, ShoppingBag } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAdminAuthStore } from '../store/store'
import { useLangStore } from '../store/langStore'
import { alarmSound } from '../lib/alarmAudio'
import {
  DEFAULT_TEXTILE_BRANCH,
  DEFAULT_GROCERY_BRANCH,
} from '../store/branchContextStore'

export default function AdminLogin() {
  const navigate = useNavigate()
  const { lang } = useLangStore()
  const l = (en: string, ta: string) => (lang === 'ta' ? ta : en)
  const login = useAdminAuthStore((state) => state.login)

  const [mode, setMode] = useState<'staff' | 'admin'>('staff')
  // Default selected: Mariyam Kids World (Branch 2)
  const [selectedBranchId, setSelectedBranchId] = useState<string>(DEFAULT_GROCERY_BRANCH.id)
  const [portalId, setPortalId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isMariyam = selectedBranchId === DEFAULT_GROCERY_BRANCH.id

  // Dynamic branch details based on switching
  const branchName = isMariyam ? 'MARIYAM KIDS WORLD' : 'Taj textiles'
  const branchSubtitle = isMariyam ? 'Kids World & Clothing' : 'Retail Billing & Inventory'
  const branchLogo = isMariyam ? '/mariyam_kids_world_logo.png' : '/taj_textiles_logo.png'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Pre-unlock iOS audio context synchronously on user submit gesture
    void alarmSound.unlock()
    setError('')
    setLoading(true)

    const role = await login(
      portalId.trim(),
      password,
      mode === 'staff' ? selectedBranchId : undefined
    )
    setLoading(false)

    if (role === 'admin') {
      navigate('/admin', { replace: true })
    } else if (role === 'staff') {
      navigate('/dashboard', { replace: true })
    } else {
      setError(
        mode === 'admin'
          ? l('Invalid Administrator credentials', 'தவறான நிர்வாகி விவரங்கள்')
          : l(
              `Invalid Staff ID or Password for ${
                isMariyam ? 'MARIYAM KIDS WORLD' : 'Taj textiles'
              }`,
              'தேர்ந்தெடுக்கப்பட்ட கிளைக்கான தவறான பணியாளர் விவரங்கள்'
            )
      )
    }
  }

  return (
    <div className="relative h-screen max-h-screen min-h-screen overflow-y-auto lg:overflow-hidden bg-[#F3F4F6] p-3 sm:p-5 lg:p-6 font-sans flex items-center justify-center">
      <div
        className={`relative grid w-full max-w-4xl max-h-[94vh] overflow-hidden rounded-3xl border transition-colors duration-500 shadow-[0_25px_60px_-12px_rgba(0,0,0,0.25),0_12px_28px_-6px_rgba(0,0,0,0.15)] lg:grid-cols-[0.85fr_1.15fr] ${
          isMariyam
            ? 'bg-[#260716] border-pink-900/30'
            : 'bg-[#0B1528] border-blue-900/30'
        }`}
      >
        {/* Left Brand Panel with Dynamic Branch Theming */}
        <div
          className={`hidden flex-col justify-between items-center p-8 lg:p-10 text-white lg:flex overflow-y-auto hide-scrollbar transition-all duration-700 relative overflow-hidden ${
            isMariyam
              ? 'bg-gradient-to-b from-[#350A1F] via-[#200513] to-[#14020B] border-r border-pink-500/25'
              : 'bg-gradient-to-b from-[#0F1E38] via-[#091222] to-[#040913] border-r border-blue-500/25'
          }`}
        >
          {/* Subtle Ambient Background Glow */}
          <div
            className={`absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-colors duration-700 opacity-30 ${
              isMariyam ? 'bg-pink-600' : 'bg-blue-600'
            }`}
          />
          <div
            className={`absolute -bottom-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-colors duration-700 opacity-20 ${
              isMariyam ? 'bg-rose-500' : 'bg-cyan-500'
            }`}
          />

          {/* Top Subtitle */}
          <div className="w-full flex items-center justify-between relative z-10">
            <motion.p
              key={`sub-${isMariyam}`}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`text-[11px] font-black uppercase tracking-[0.24em] transition-colors duration-500 ${
                isMariyam ? 'text-pink-300' : 'text-amber-300'
              }`}
            >
              {branchSubtitle}
            </motion.p>
          </div>

          {/* Center Logo Card with 3D Flip Animation */}
          <div className="my-auto flex flex-col items-center justify-center py-6 w-full relative z-10">
            <div className="relative max-w-[280px] w-full aspect-square [perspective:1000px]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={isMariyam ? 'mariyam-logo-box' : 'taj-logo-box'}
                  initial={{ rotateY: 90, opacity: 0, scale: 0.88 }}
                  animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                  exit={{ rotateY: -90, opacity: 0, scale: 0.88 }}
                  transition={{ duration: 0.45, ease: [0.25, 1, 0.5, 1] }}
                  className={`w-full h-full p-6 sm:p-8 rounded-3xl flex items-center justify-center transition-all duration-500 border ${
                    isMariyam
                      ? 'bg-gradient-to-b from-[#440C29]/90 to-[#290618]/90 border-pink-500/40 shadow-[0_20px_50px_rgba(190,24,93,0.35),0_0_35px_rgba(244,114,182,0.18)]'
                      : 'bg-gradient-to-b from-[#142646]/90 to-[#0C172B]/90 border-blue-500/40 shadow-[0_20px_50px_rgba(30,58,138,0.4),0_0_35px_rgba(96,165,250,0.18)]'
                  }`}
                >
                  <img
                    src={branchLogo}
                    alt={branchName}
                    className="w-full h-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)] select-none"
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Dynamic Branch Name Caption */}
            <div className="mt-5 text-center">
              <motion.div
                key={`caption-${isMariyam}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <span
                  className={`text-xs font-black tracking-wider uppercase px-2.5 py-1 rounded-full border transition-colors duration-500 ${
                    isMariyam
                      ? 'bg-pink-500/20 text-pink-200 border-pink-400/30'
                      : 'bg-blue-500/20 text-blue-200 border-blue-400/30'
                  }`}
                >
                  {branchName}
                </span>
                <p className="text-[10px] text-gray-300 mt-2 font-medium">
                  {isMariyam
                    ? 'Branch 2 • Kids World & Clothing'
                    : 'Branch 1 • Retail & Textiles'}
                </p>
              </motion.div>
            </div>
          </div>

          {/* Bottom Security Footer */}
          <div
            className={`w-full flex items-center justify-center gap-2 text-xs font-bold transition-colors duration-500 relative z-10 ${
              isMariyam ? 'text-pink-300' : 'text-blue-300'
            }`}
          >
            <ShieldCheck size={15} />
            <span>Secure retail workspace</span>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="p-5 sm:p-7 lg:p-8 bg-white text-[#111111] overflow-y-auto hide-scrollbar flex flex-col justify-center">
          {/* Dynamic Brand Title in Header */}
          <div className="mb-4 flex flex-col items-center text-center lg:items-start lg:text-left">
            <motion.p
              key={`r-sub-${isMariyam}`}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              className={`text-[10px] font-black uppercase tracking-[0.22em] transition-colors duration-300 ${
                isMariyam ? 'text-pink-600' : 'text-blue-700'
              }`}
            >
              {branchSubtitle}
            </motion.p>
            <motion.h1
              key={`r-title-${isMariyam}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-[#0A0A0A]"
            >
              {branchName}
            </motion.h1>
          </div>

          {/* Mode Switcher Tabs: Staff vs Admin (with Sliding Indicator) */}
          <div className="relative grid grid-cols-2 p-1 bg-[#F3F4F6] rounded-2xl border border-gray-200 mb-4">
            <motion.div
              layout
              className={`absolute inset-y-1 rounded-xl shadow-sm ${
                isMariyam
                  ? 'bg-gradient-to-r from-[#9D174D] to-[#BE185D] text-white'
                  : 'bg-gradient-to-r from-[#1E3A8A] to-[#1D4ED8] text-white'
              }`}
              style={{
                left: mode === 'staff' ? '4px' : 'calc(50% + 2px)',
                width: 'calc(50% - 6px)',
              }}
              transition={{ type: 'spring', stiffness: 450, damping: 35 }}
            />
            <button
              type="button"
              onClick={() => {
                setMode('staff')
                setError('')
              }}
              className={`relative z-10 py-2 text-xs font-black rounded-xl transition-colors cursor-pointer ${
                mode === 'staff' ? 'text-white' : 'text-gray-500 hover:text-black'
              }`}
            >
              Staff POS Login
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('admin')
                setError('')
              }}
              className={`relative z-10 py-2 text-xs font-black rounded-xl transition-colors cursor-pointer ${
                mode === 'admin' ? 'text-white' : 'text-gray-500 hover:text-black'
              }`}
            >
              Admin Orchestrator
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-3.5 py-2.5 rounded-xl text-[12px] mb-3 flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
            {/* Branch Selector (Mariyam on LEFT defaultly selected, Taj on RIGHT) with Slider Animation */}
            {mode === 'staff' && (
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[#6B7280]">
                  <Store
                    size={13}
                    className={isMariyam ? 'text-pink-600' : 'text-blue-600'}
                  />
                  <span>Select Branch</span>
                  <span className="font-black text-red-500">*</span>
                </label>

                {/* Sliding Switch Container */}
                <div className="relative grid grid-cols-2 p-1.5 rounded-2xl bg-[#F4F4F6] border border-gray-200 overflow-hidden">
                  {/* Sliding Pill Indicator */}
                  <motion.div
                    layout
                    className={`absolute inset-y-1.5 rounded-xl shadow-md ${
                      isMariyam
                        ? 'bg-gradient-to-r from-[#9D174D] to-[#BE185D] shadow-pink-900/25'
                        : 'bg-gradient-to-r from-[#1E3A8A] to-[#1D4ED8] shadow-blue-900/25'
                    }`}
                    style={{
                      left: isMariyam ? '6px' : 'calc(50% + 3px)',
                      width: 'calc(50% - 9px)',
                    }}
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />

                  {/* LEFT: MARIYAM KIDS WORLD (Default) */}
                  <button
                    type="button"
                    onClick={() => setSelectedBranchId(DEFAULT_GROCERY_BRANCH.id)}
                    className={`relative z-10 p-2.5 rounded-xl text-left flex items-center gap-2.5 transition-colors cursor-pointer ${
                      isMariyam ? 'text-white' : 'text-gray-700 hover:text-black'
                    }`}
                  >
                    <ShoppingBag
                      size={17}
                      className={isMariyam ? 'text-pink-200' : 'text-pink-600'}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-black break-words leading-tight">
                        MARIYAM KIDS WORLD
                      </div>
                      <div
                        className={`text-[9px] mt-0.5 ${
                          isMariyam ? 'text-pink-100/80 font-medium' : 'text-gray-500'
                        }`}
                      >
                        Kids World & Clothing
                      </div>
                    </div>
                  </button>

                  {/* RIGHT: Taj textiles */}
                  <button
                    type="button"
                    onClick={() => setSelectedBranchId(DEFAULT_TEXTILE_BRANCH.id)}
                    className={`relative z-10 p-2.5 rounded-xl text-left flex items-center gap-2.5 transition-colors cursor-pointer ${
                      !isMariyam ? 'text-white' : 'text-gray-700 hover:text-black'
                    }`}
                  >
                    <Store
                      size={17}
                      className={!isMariyam ? 'text-blue-200' : 'text-blue-600'}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-black break-words leading-tight">
                        Taj textiles
                      </div>
                      <div
                        className={`text-[9px] mt-0.5 ${
                          !isMariyam ? 'text-blue-100/80 font-medium' : 'text-gray-500'
                        }`}
                      >
                        Retail & Textiles
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Staff / Admin ID Input */}
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[#6B7280]">
                <ShieldCheck
                  size={13}
                  className={isMariyam ? 'text-pink-600' : 'text-blue-600'}
                />
                <span>
                  {mode === 'admin'
                    ? 'Admin ID'
                    : isMariyam
                    ? 'MARIYAM KIDS WORLD Staff ID'
                    : 'Taj textiles Staff ID'}
                </span>
                <span className="font-black text-red-500">*</span>
              </label>
              <input
                type="text"
                autoComplete="username"
                placeholder={
                  mode === 'admin'
                    ? 'Enter admin ID'
                    : isMariyam
                    ? 'Enter Mariyam Kids World staff ID'
                    : 'Enter Taj textiles staff ID'
                }
                className={`w-full rounded-xl border-2 bg-[#FBFAF6] px-3.5 py-2.5 text-xs sm:text-sm font-semibold outline-none transition-all placeholder:text-[#AAA69C] focus:bg-white text-[#111111] ${
                  isMariyam
                    ? 'border-pink-200 focus:border-[#BE185D] focus:ring-2 focus:ring-pink-500/20'
                    : 'border-blue-200 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20'
                }`}
                value={portalId}
                onChange={(e) => {
                  setPortalId(e.target.value)
                  setError('')
                }}
                disabled={loading}
                required
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-[#6B7280] uppercase tracking-wide mb-1">
                <Lock
                  size={13}
                  className={isMariyam ? 'text-pink-600' : 'text-blue-600'}
                />
                <span>{l('Password', 'கடவுச்சொல்')}</span>
                <span className="text-red-500 font-black">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter password"
                  className={`w-full rounded-xl border-2 bg-[#FBFAF6] px-3.5 py-2.5 pr-11 text-xs sm:text-sm font-semibold outline-none transition-all placeholder:text-[#AAA69C] focus:bg-white text-[#111111] ${
                    isMariyam
                      ? 'border-pink-200 focus:border-[#BE185D] focus:ring-2 focus:ring-pink-500/20'
                      : 'border-blue-200 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20'
                  }`}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError('')
                  }}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#111111] cursor-pointer"
                  aria-label={
                    showPassword
                      ? l('Hide password', 'கடவுச்சொல்லை மறை')
                      : l('Show password', 'கடவுச்சொல்லை காட்டு')
                  }
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button styled with dynamic Branch Theme */}
            <button
              type="submit"
              disabled={loading}
              className={`group flex w-full items-center justify-center gap-2 rounded-xl py-3 font-black text-xs sm:text-sm text-white shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 cursor-pointer mt-3 border ${
                isMariyam
                  ? 'bg-gradient-to-r from-[#831843] via-[#9D174D] to-[#BE185D] hover:from-[#9D174D] hover:to-[#DB2777] shadow-pink-900/30 border-pink-400/30'
                  : 'bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#1D4ED8] hover:from-[#1E3A8A] hover:to-[#2563EB] shadow-blue-900/30 border-blue-400/30'
              }`}
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                  <span>{l('Authenticating...', 'சரிபார்க்கிறது...')}</span>
                </>
              ) : (
                <>
                  <Lock size={14} />
                  <span>
                    {mode === 'admin'
                      ? 'Sign In to Admin Orchestrator'
                      : isMariyam
                      ? 'Launch Mariyam Kids World POS'
                      : 'Launch Textile POS'}
                  </span>
                </>
              )}
            </button>

            <p className="text-center text-[10px] leading-relaxed text-[#888888] pt-1">
              {mode === 'admin'
                ? 'Superadmin access with cross-branch consolidation and analytics.'
                : 'Branch POS access with isolated stock ledger and dedicated invoice sequence.'}
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
