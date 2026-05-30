import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { Eye, EyeOff, KeyRound } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [searchParams] = useSearchParams()
  const isFirstLogin = searchParams.get('first') === 'true'
  const navigate = useNavigate()

  const handleReset = async (e) => {
    e.preventDefault()
    if (password !== confirm) {
      toast.error('Passwords do not match')
      return
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password,
        data: { must_reset_password: false }
      })
      if (error) throw error

      toast.success('Password updated successfully!')

      // Redirect based on role
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role === 'admin') navigate('/admin/dashboard')
      else navigate('/client/orders')

    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-nyin-bg flex items-center justify-center p-4"
      style={{ backgroundImage: 'radial-gradient(ellipse at 50% 0%, #C9A64615 0%, transparent 70%)' }}>
      <div className="w-full max-w-md">

        <div className="text-center mb-10">
          <h1 className="font-display text-5xl text-gold tracking-widest mb-2">NYIN</h1>
          <p className="text-gray-600 text-xs tracking-[0.3em] uppercase">International FZCO</p>
          <div className="w-16 h-px bg-gold mx-auto mt-4 opacity-50" />
        </div>

        <div className="bg-nyin-card border border-nyin-border rounded-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
              <KeyRound size={16} className="text-gold" />
            </div>
            <div>
              <h2 className="font-display text-2xl text-white leading-tight">
                {isFirstLogin ? 'Set Your Password' : 'Reset Password'}
              </h2>
              <p className="text-gray-500 text-xs mt-0.5">
                {isFirstLogin
                  ? 'Choose a secure password to get started'
                  : 'Enter your new password below'}
              </p>
            </div>
          </div>

          {isFirstLogin && (
            <div className="bg-gold/5 border border-gold/20 rounded-lg p-4 mb-6">
              <p className="text-gold text-xs leading-relaxed">
                🔐 For security, you must set a personal password before accessing your portal.
                Your temporary password will no longer work after this.
              </p>
            </div>
          )}

          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="Min. 8 characters"
                  className="w-full bg-nyin-surface border border-nyin-border rounded-lg px-4 py-3 pr-10 text-white text-sm focus:outline-none focus:border-gold transition-colors placeholder-gray-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {/* Password strength indicator */}
              {password.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                      password.length >= (i + 1) * 3
                        ? password.length >= 12 ? 'bg-green-400'
                        : password.length >= 8 ? 'bg-gold'
                        : 'bg-red-400'
                        : 'bg-nyin-border'
                    }`} />
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                placeholder="Repeat your new password"
                className={`w-full bg-nyin-surface border rounded-lg px-4 py-3 text-white text-sm focus:outline-none transition-colors placeholder-gray-600
                  ${confirm.length > 0
                    ? confirm === password ? 'border-green-500/50 focus:border-green-500' : 'border-red-500/50 focus:border-red-500'
                    : 'border-nyin-border focus:border-gold'
                  }`}
              />
              {confirm.length > 0 && confirm !== password && (
                <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || password !== confirm || password.length < 8}
              className="w-full bg-gold hover:bg-gold-dark text-nyin-bg font-semibold py-3 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Saving...' : isFirstLogin ? 'Set Password & Enter Portal' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}