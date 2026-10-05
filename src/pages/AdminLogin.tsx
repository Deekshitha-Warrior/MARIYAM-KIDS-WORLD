import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Lock, Eye, EyeOff, AlertCircle, ShieldCheck, Store, ShieldAlert } from 'lucide-react'
import { useAdminAuthStore, useSettingsStore, type PosBranch } from '../store/store'
import { BRAND_EN, BRAND_TA, BRAND_LOGO, TAJ_BRAND_NAME } from '../lib/brand'
import { branchLogo, branchShortLabel, branchSubtitle, combinedBranchSubtitle, applyActiveTheme } from '../lib/branchTheme'
import { useLangStore } from '../store/langStore'
import { alarmSound } from '../lib/alarmAudio'
import CenexaFooter from '../components/common/CenexaFooter'

const BRANCHES: { key: PosBranch; label: string }[] = [
  { key: 'pos1', label: branchShortLabel('pos1') },
  { key: 'pos2', label: branchShortLabel('pos2') },
]

export default function AdminLogin() {
  const navigate = useNavigate()
  const location = useLocation()
  const { lang } = useLangStore()
  const l = (en: string, ta: string) => lang === 'ta' ? ta : en
  const login = useAdminAuthStore((state) => state.login)

  const [loginTab, setLoginTab] = useState<'staff' | 'admin'>('staff')
  const [branch, setBranch] = useState<PosBranch>('pos1')

  const [staffId, setStaffId] = useState('')
  const [staffPassword, setStaffPassword] = useState('')
  const [showStaffPassword, setShowStaffPassword] = useState(false)

  const [adminId, setAdminId] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [showAdminPassword, setShowAdminPassword] = useState(false)

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isTaj = loginTab === 'staff' && branch === 'pos2'

  // Dynamically update document theme variables based on selected branch
  useEffect(() => {
    const settings = useSettingsStore.getState().settingsByBranch
    if (loginTab === 'staff') {
      applyActiveTheme(branch, 'staff', settings, branch)
    } else {
      applyActiveTheme('all', 'admin', settings)
    }
  }, [branch, loginTab])

  const from = (location.state as { from?: Location })?.from?.pathname || '/dashboard'

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    void alarmSound.unlock()
    setError('')
    setLoading(true)
    const role = await login(staffId.trim(), staffPassword, branch)
    setLoading(false)
    if (role === 'staff') {
      navigate('/dashboard', { replace: true })
    } else {
      setError(l(`Invalid staff ID or password for ${branchShortLabel(branch)}`, 'தவறான பணியாளர் விவரங்கள்'))
    }
  }

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    void alarmSound.unlock()
    setError('')
    setLoading(true)
    const role = await login(adminId.trim(), adminPassword)
    setLoading(false)
    if (role === 'admin') {
      const destination = from === '/pos' ? '/dashboard' : from
      navigate(destination, { replace: true })
    } else {
      setError(l('Invalid admin credentials', 'தவறான நிர்வாகி விவரங்கள்'))
    }
  }

  const switchTab = (tab: 'staff' | 'admin') => {
    setLoginTab(tab)
    setError('')
  }

  return (
    <div className={`relative h-[100dvh] max-h-[100dvh] min-h-[100dvh] transition-colors duration-500 font-sans flex flex-col justify-between overflow-hidden ${
      isTaj ? 'bg-gradient-to-br from-blue-50/70 via-white to-blue-50/40' : 'bg-gradient-to-br from-pink-50/70 via-white to-pink-50/40'
    }`}>
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-5 lg:p-6 flex flex-col items-center">
        <div className={`my-auto relative grid w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-3xl border transition-all duration-500 shadow-[0_25px_60px_-12px_rgba(0,0,0,0.2),0_12px_28px_-6px_rgba(0,0,0,0.1)] lg:grid-cols-[0.85fr_1.15fr] ${
          isTaj ? 'border-blue-200/90 bg-white' : 'border-pink-200/90 bg-white'
        }`}>
        
        {/* Left Hero Panel */}
        <div className={`hidden flex-col justify-between items-center transition-all duration-500 p-8 lg:p-10 text-white lg:flex overflow-y-auto ${
          isTaj
            ? 'bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 border-r border-blue-400/20'
            : 'bg-gradient-to-br from-pink-500 via-pink-600 to-pink-700 border-r border-pink-300/20'
        }`}>
          <div className="w-full flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-[0.26em] text-white/90">
              {loginTab === 'staff' ? branchSubtitle(branch) : combinedBranchSubtitle()}
            </p>
          </div>
          <div className="my-auto flex flex-col items-center justify-center py-6 w-full [perspective:1200px]">
            <div
              className="relative max-w-[280px] w-full aspect-square transition-transform duration-700 ease-in-out cursor-pointer hover:scale-[1.02]"
              style={{
                transformStyle: 'preserve-3d',
                transform: isTaj ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}
              onClick={() => {
                if (loginTab === 'staff') {
                  setBranch(branch === 'pos1' ? 'pos2' : 'pos1')
                  setError('')
                }
              }}
              title={loginTab === 'staff' ? 'Click to flip branch' : undefined}
            >
              {/* Front Face: Mariyam Kids World (Pink) */}
              <div
                className="absolute inset-0 p-5 sm:p-7 rounded-3xl bg-white border-2 border-pink-200 shadow-[0_20px_50px_rgba(219,39,119,0.35)] flex items-center justify-center transition-shadow"
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                }}
              >
                <img
                  src={branchLogo('pos1')}
                  alt={BRAND_EN}
                  className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.15)] select-none pointer-events-none"
                />
              </div>

              {/* Back Face: Taj Textiles (Blue) */}
              <div
                className="absolute inset-0 p-5 sm:p-7 rounded-3xl bg-white border-2 border-blue-200 shadow-[0_20px_50px_rgba(30,58,138,0.45)] flex items-center justify-center transition-shadow"
                style={{
                  transform: 'rotateY(180deg)',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                }}
              >
                <img
                  src={branchLogo('pos2')}
                  alt={TAJ_BRAND_NAME}
                  className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.15)] select-none pointer-events-none"
                />
              </div>
            </div>
          </div>
          <div className="w-full flex items-center justify-center gap-2 text-xs font-bold text-white/90">
            <ShieldCheck size={15} /> Secure retail workspace
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="p-5 sm:p-7 lg:p-8 bg-white text-[#111111] overflow-y-auto flex flex-col justify-center">
          {/* Brand */}
          <div className="mb-4 sm:mb-5 flex flex-col items-center text-center lg:items-start lg:text-left">
            {/* Mobile-only 3D flipping logo */}
            <div className="mb-3 lg:hidden flex justify-center [perspective:800px]">
              <div
                className="relative w-16 h-16 transition-transform duration-700 ease-in-out cursor-pointer"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: isTaj ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
                onClick={() => {
                  if (loginTab === 'staff') {
                    setBranch(branch === 'pos1' ? 'pos2' : 'pos1')
                    setError('')
                  }
                }}
              >
                {/* Mobile Front Face: Mariyam Kids World */}
                <div
                  className="absolute inset-0 rounded-2xl border-2 border-pink-200 p-2 flex items-center justify-center shadow-md bg-white"
                  style={{
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                  }}
                >
                  <img src={branchLogo('pos1')} alt={BRAND_EN} className="w-full h-full object-contain" />
                </div>
                {/* Mobile Back Face: Taj Textiles */}
                <div
                  className="absolute inset-0 rounded-2xl border-2 border-blue-200 p-2 flex items-center justify-center shadow-md bg-white"
                  style={{
                    transform: 'rotateY(180deg)',
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                  }}
                >
                  <img src={branchLogo('pos2')} alt={TAJ_BRAND_NAME} className="w-full h-full object-contain" />
                </div>
              </div>
            </div>
            <p className={`text-[10px] font-black uppercase tracking-[0.22em] transition-colors ${
              isTaj ? 'text-blue-600' : 'text-pink-600'
            }`}>
              {loginTab === 'staff' ? branchSubtitle(branch) : combinedBranchSubtitle()}
            </p>
            <h1 className={`mt-1 text-2xl sm:text-3xl font-black tracking-tight transition-colors duration-300 ${
              isTaj ? 'text-blue-700' : 'text-pink-600'
            }`}>
              {loginTab === 'staff' ? (branch === 'pos2' ? 'TAJ TEXTILES' : BRAND_EN) : `${BRAND_EN} + TAJ TEXTILES`}
            </h1>
            {BRAND_TA && BRAND_TA !== BRAND_EN && !isTaj && (
              <p className="mt-0.5 text-xs font-semibold text-gray-500">{BRAND_TA}</p>
            )}
          </div>

          {/* Tab switcher */}
          <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-gray-100/80 border border-gray-200 p-1">
            <button
              type="button"
              onClick={() => switchTab('staff')}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] sm:text-xs font-black uppercase tracking-wide transition-all cursor-pointer ${
                loginTab === 'staff'
                  ? isTaj ? 'bg-blue-600 text-white shadow-sm' : 'bg-pink-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Store size={13} /> {l('Staff POS Login', 'பணியாளர் நுழைவு')}
            </button>
            <button
              type="button"
              onClick={() => switchTab('admin')}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] sm:text-xs font-black uppercase tracking-wide transition-all cursor-pointer ${
                loginTab === 'admin' ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <ShieldAlert size={13} /> {l('Admin Orchestrator', 'நிர்வாகி')}
            </button>
          </div>

          {/* Server-level error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-3.5 py-2.5 rounded-xl text-[12px] mb-3.5 flex items-center gap-2">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {loginTab === 'staff' ? (
            <form onSubmit={handleStaffSubmit} noValidate className="space-y-3.5">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-600">
                  <Store size={13} />
                  {l('Select Branch', 'கிளையை தேர்ந்தெடுக்கவும்')}
                  <span className="font-black text-red-500">*</span>
                </label>

                {/* Animated Branch Slide Switch */}
                <div className="relative rounded-2xl bg-gray-100/90 p-1.5 border border-gray-200 shadow-inner overflow-hidden select-none">
                  {/* Sliding highlight pill */}
                  <div
                    className={`absolute top-1.5 bottom-1.5 left-1.5 w-[calc(50%-6px)] rounded-xl transition-all duration-300 ease-out shadow-md pointer-events-none ${
                      branch === 'pos2'
                        ? 'translate-x-[calc(100%+6px)] bg-white border-2 border-blue-600 shadow-blue-500/25'
                        : 'translate-x-0 bg-white border-2 border-pink-500 shadow-pink-500/25'
                    }`}
                  />

                  {/* Switch Options */}
                  <div className="relative z-10 grid grid-cols-2 gap-1.5">
                    {BRANCHES.map(({ key, label }) => {
                      const isSelected = branch === key
                      const isKeyPos2 = key === 'pos2'
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => { setBranch(key); setError('') }}
                          className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-all duration-300 cursor-pointer ${
                            isSelected
                              ? isKeyPos2
                                ? 'text-blue-900 font-bold'
                                : 'text-pink-900 font-bold'
                              : 'text-gray-500 hover:text-gray-800'
                          }`}
                        >
                          <span className={`w-8 h-8 shrink-0 rounded-lg bg-white border p-1 flex items-center justify-center overflow-hidden transition-all duration-300 ${
                            isSelected
                              ? isKeyPos2 ? 'border-blue-400 shadow-xs' : 'border-pink-400 shadow-xs'
                              : 'border-black/10 opacity-70'
                          }`}>
                            <img src={branchLogo(key)} alt="" className="w-full h-full object-contain" />
                          </span>
                          <span className="min-w-0">
                            <p className="text-xs font-black truncate leading-tight">{label}</p>
                            <p className={`text-[10px] font-semibold truncate transition-colors ${
                              isSelected
                                ? isKeyPos2 ? 'text-blue-700' : 'text-pink-700'
                                : 'text-gray-400'
                            }`}>
                              {isKeyPos2 ? 'Taj Textiles' : 'Mariyam Kids World'}
                            </p>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-600">
                  <ShieldCheck size={13} />
                  {l(`${branchShortLabel(branch)} Staff ID`, `${branchShortLabel(branch)} பணியாளர் ஐடி`)}
                  <span className="font-black text-red-500">*</span>
                </label>
                <input
                  type="text"
                  autoComplete="username"
                  placeholder={l(`Enter ${branchShortLabel(branch)} staff ID`, 'பணியாளர் ஐடி')}
                  className={`w-full rounded-xl border-2 bg-gray-50/60 px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold outline-none transition-colors placeholder:text-gray-400 text-gray-900 ${
                    isTaj ? 'border-blue-200 focus:border-blue-600 focus:bg-white' : 'border-pink-200 focus:border-pink-500 focus:bg-white'
                  }`}
                  value={staffId}
                  onChange={(e) => { setStaffId(e.target.value); setError('') }}
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-600 uppercase tracking-wide mb-1">
                  <Lock size={13} />
                  {l('Password', 'கடவுச்சொல்')}
                  <span className="text-red-500 font-black">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showStaffPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder={l('Enter password', 'கடவுச்சொல்லை உள்ளிடவும்')}
                    className={`w-full rounded-xl border-2 bg-gray-50/60 px-3.5 py-2.5 sm:py-3 pr-11 text-xs sm:text-sm font-semibold outline-none transition-colors placeholder:text-gray-400 text-gray-900 ${
                      isTaj ? 'border-blue-200 focus:border-blue-600 focus:bg-white' : 'border-pink-200 focus:border-pink-500 focus:bg-white'
                    }`}
                    value={staffPassword}
                    onChange={(e) => { setStaffPassword(e.target.value); setError('') }}
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowStaffPassword(!showStaffPassword)}
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
                    aria-label={showStaffPassword ? l('Hide password', 'கடவுச்சொல்லை மறை') : l('Show password', 'கடவுச்சொல்லை காட்டு')}
                  >
                    {showStaffPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`group flex w-full items-center justify-center gap-2 rounded-xl py-3 font-black text-xs sm:text-sm text-white shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 cursor-pointer ${
                  isTaj
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30'
                    : 'bg-pink-600 hover:bg-pink-700 shadow-pink-600/30'
                }`}
              >
                {loading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                    {l('Signing in...', 'உள்நுழைகிறது...')}
                  </>
                ) : (
                  <>
                    <Lock size={14} />
                    {l(`Launch ${branchShortLabel(branch)}`, `${branchShortLabel(branch)} தொடங்கு`)}
                  </>
                )}
              </button>

              <p className="text-center text-[10px] leading-relaxed text-gray-500">
                {l('Branch POS access with an isolated stock ledger and dedicated invoice sequence.', 'கிளை நுழைவு')}
              </p>
            </form>
          ) : (
            <form onSubmit={handleAdminSubmit} noValidate className="space-y-3.5">
              <div>
                <label className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-600">
                  <ShieldAlert size={13} />
                  {l('Admin ID', 'நிர்வாகி ஐடி')}
                  <span className="font-black text-red-500">*</span>
                </label>
                <input
                  type="text"
                  autoComplete="username"
                  placeholder={l('Enter admin ID', 'நிர்வாகி ஐடி')}
                  className="w-full rounded-xl border-2 border-gray-200 bg-gray-50/60 px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold outline-none transition-colors placeholder:text-gray-400 focus:border-gray-900 focus:bg-white text-gray-900"
                  value={adminId}
                  onChange={(e) => { setAdminId(e.target.value); setError('') }}
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-600 uppercase tracking-wide mb-1">
                  <Lock size={13} />
                  {l('Password', 'கடவுச்சொல்')}
                  <span className="text-red-500 font-black">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder={l('Enter password', 'கடவுச்சொல்லை உள்ளிடவும்')}
                    className="w-full rounded-xl border-2 border-gray-200 bg-gray-50/60 px-3.5 py-2.5 sm:py-3 pr-11 text-xs sm:text-sm font-semibold outline-none transition-colors placeholder:text-gray-400 focus:border-gray-900 focus:bg-white text-gray-900"
                    value={adminPassword}
                    onChange={(e) => { setAdminPassword(e.target.value); setError('') }}
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
                    aria-label={showAdminPassword ? l('Hide password', 'கடவுச்சொல்லை மறை') : l('Show password', 'கடவுச்சொல்லை காட்டு')}
                  >
                    {showAdminPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 hover:bg-black py-3 font-black text-xs sm:text-sm text-white shadow-lg shadow-black/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                    {l('Signing in...', 'உள்நுழைகிறது...')}
                  </>
                ) : (
                  <>
                    <ShieldCheck size={14} />
                    {l('Sign In to Admin Orchestrator', 'நிர்வாகியாக நுழைக')}
                  </>
                )}
              </button>

              <p className="text-center text-[10px] leading-relaxed text-gray-500">
                {l('Superadmin access with cross-branch consolidation and analytics.', 'அனைத்து கிளைகளையும் நிர்வகிக்கவும்.')}
              </p>
            </form>
          )}
        </div>
      </div>
      </div>
      <CenexaFooter />
    </div>
  )
}
