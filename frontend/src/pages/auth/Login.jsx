import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      const mustReset = data.user?.user_metadata?.must_reset_password
      if (mustReset) {
        navigate('/reset-password?first=true')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (profile?.role === 'admin') navigate('/admin/dashboard')
      else navigate('/client/orders')
    } catch (err) {
      toast.error(err.message || 'Login failed')
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
          <p className="text-nyin-border text-xs tracking-[0.3em] uppercase">International FZCO</p>
          <div className="w-16 h-px bg-gold mx-auto mt-4 opacity-50" />
        </div>

        <div className="bg-nyin-card border border-nyin-border rounded-xl p-8">
          <h2 className="font-display text-2xl text-white mb-1">Welcome back</h2>
          <p className="text-gray-500 text-sm mb-8">Sign in to your trading portal</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-nyin-surface border border-nyin-border rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-gold transition-colors placeholder-gray-600"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full bg-nyin-surface border border-nyin-border rounded-lg px-4 py-3 pr-10 text-white text-sm focus:outline-none focus:border-gold transition-colors placeholder-gray-600"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold hover:bg-gold-dark text-nyin-bg font-semibold py-3 rounded-lg transition-colors text-sm tracking-wide disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center mt-6 text-xs text-gray-600">
            Forgot your password?{' '}
            <a href="/reset-password" className="text-gold hover:underline">Reset it here</a>
          </p>
        </div>

        <p className="text-center text-xs text-gray-700 mt-8">
          © {new Date().getFullYear()} NYIN International FZCO. All rights reserved.
        </p>
      </div>
    </div>
  )
}