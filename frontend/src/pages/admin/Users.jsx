import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import {
  Users, Plus, X, Shield, User,
  Mail, Phone, Building, Eye, EyeOff,
  Trash2, RotateCcw
} from 'lucide-react'
import AdminLayout from '../../components/layout/AdminLayout.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import { supabase } from '../../lib/supabase.js'
import toast from 'react-hot-toast'

function UserCard({ user, onRefresh }) {
  const isAdmin = user.role === 'admin'
  const isDeleted = user.is_deleted
  const isInactive = !user.is_active && !user.is_deleted
  const [showActions, setShowActions] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleAction = async (action) => {
    setLoading(true)
    try {
      const { data: result, error } = await supabase.functions.invoke('create-user', {
        body: { action, user_id: user.id }
      })
      if (error) throw new Error(error.message)
      if (result?.error) throw new Error(result.error)
      toast.success(
        action === 'delete'     ? 'Account deleted. Email sent.' :
        action === 'restore'    ? 'Account restored. Email sent.' :
        action === 'deactivate' ? 'Account deactivated. Email sent.' :
        'Account reactivated. Email sent.'
      )
      onRefresh()
    } catch (err) {
      toast.error(err.message ?? 'Action failed')
    } finally {
      setLoading(false)
      setConfirmAction(null)
      setShowActions(false)
    }
  }

  return (
    <>
      <div className={`bg-nyin-card border rounded-xl p-5 transition-colors relative
        ${isDeleted ? 'border-red-500/20 opacity-60' : isInactive ? 'border-yellow-500/20 opacity-70' : 'border-nyin-border hover:border-gold/20'}`}>

        {/* Status tag */}
        {isDeleted && (
          <div className="absolute top-3 left-3">
            <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">
              Deleted
            </span>
          </div>
        )}
        {isInactive && !isDeleted && (
          <div className="absolute top-3 left-3">
            <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full">
              Inactive
            </span>
          </div>
        )}

        {/* Three dot menu */}
        <div className="absolute top-3 right-3">
          <button
            onClick={() => setShowActions(!showActions)}
            className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-white hover:bg-white/5 rounded transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="2"/>
              <circle cx="12" cy="12" r="2"/>
              <circle cx="12" cy="19" r="2"/>
            </svg>
          </button>

          {showActions && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)} />
              <div className="absolute right-0 top-8 bg-nyin-surface border border-nyin-border rounded-lg shadow-2xl z-20 w-48 overflow-hidden">
                {!isDeleted && !isInactive && (
                  <button
                    onClick={() => { setConfirmAction('deactivate'); setShowActions(false) }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-yellow-400 hover:bg-yellow-400/5 transition-colors text-left"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                    </svg>
                    Deactivate
                  </button>
                )}
                {isInactive && !isDeleted && (
                  <button
                    onClick={() => { setConfirmAction('reactivate'); setShowActions(false) }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-green-400 hover:bg-green-400/5 transition-colors text-left"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Reactivate
                  </button>
                )}
                {isDeleted && (
                  <button
                    onClick={() => { setConfirmAction('restore'); setShowActions(false) }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-green-400 hover:bg-green-400/5 transition-colors text-left"
                  >
                    <RotateCcw size={12} />
                    Restore Account
                  </button>
                )}
                {!isDeleted && (
                  <>
                    <div className="border-t border-nyin-border" />
                    <button
                      onClick={() => { setConfirmAction('delete'); setShowActions(false) }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-red-400 hover:bg-red-400/5 transition-colors text-left"
                    >
                      <Trash2 size={12} />
                      Delete Account
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Avatar */}
        <div className={`flex items-center gap-3 mb-3 ${isDeleted || isInactive ? 'mt-5' : ''}`}>
          <div className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0
            ${isAdmin ? 'bg-gold/10 border-gold/25' : 'bg-blue-500/10 border-blue-500/25'}`}>
            <span className={`font-display text-lg ${isAdmin ? 'text-gold' : 'text-blue-400'}`}>
              {user.full_name?.[0] ?? '?'}
            </span>
          </div>
          <div className="min-w-0 pr-6">
            <p className="text-white text-sm font-medium truncate">{user.full_name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isAdmin
                ? <Shield size={10} className="text-gold" />
                : <User size={10} className="text-blue-400" />
              }
              <span className={`text-xs ${isAdmin ? 'text-gold' : 'text-blue-400'}`}>
                {isAdmin ? 'Administrator' : 'Client'}
              </span>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-gray-500 text-xs">
            <Mail size={10} />
            <span className="truncate">{user.email}</span>
          </div>
          {user.company_name && (
            <div className="flex items-center gap-2 text-gray-500 text-xs">
              <Building size={10} />
              <span className="truncate">{user.company_name}</span>
            </div>
          )}
          {user.phone && (
            <div className="flex items-center gap-2 text-gray-500 text-xs">
              <Phone size={10} />
              <span>{user.phone}</span>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => handleAction(confirmAction)}
        loading={loading}
        title={
          confirmAction === 'delete'     ? 'Delete Account' :
          confirmAction === 'restore'    ? 'Restore Account' :
          confirmAction === 'deactivate' ? 'Deactivate Account' :
          'Reactivate Account'
        }
        message={
          confirmAction === 'delete'
            ? `Delete ${user.full_name}'s account? They will be notified by email. You can restore it later from this page.`
            : confirmAction === 'restore'
            ? `Restore ${user.full_name}'s account? They will regain access and receive a notification email.`
            : confirmAction === 'deactivate'
            ? `Deactivate ${user.full_name}'s account? They won't be able to log in and will be notified by email.`
            : `Reactivate ${user.full_name}'s account? They will be able to log in again and will be notified.`
        }
        confirmLabel={
          confirmAction === 'delete'     ? 'Yes, Delete' :
          confirmAction === 'restore'    ? 'Yes, Restore' :
          confirmAction === 'deactivate' ? 'Yes, Deactivate' :
          'Yes, Reactivate'
        }
        variant={
          confirmAction === 'restore' || confirmAction === 'reactivate' ? 'success' : 'danger'
        }
      />
    </>
  )
}

export default function UsersPage() {
  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showDeleted, setShowDeleted] = useState(false)
  const queryClient = useQueryClient()

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: { role: 'client' }
  })

  const selectedRole = watch('role')

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      return data ?? []
    }
  })

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['all-users'] })
    queryClient.invalidateQueries({ queryKey: ['clients'] })
  }

  const activeAdmins  = users.filter(u => u.role === 'admin'  && !u.is_deleted)
  const activeClients = users.filter(u => u.role === 'client' && !u.is_deleted)
  const deletedUsers  = users.filter(u => u.is_deleted)

  const onSubmit = async (data) => {
    setCreating(true)
    try {
      const { data: result, error } = await supabase.functions.invoke('create-user', {
        body: {
          action:       'create',
          email:        data.email,
          password:     data.password,
          full_name:    data.full_name,
          role:         data.role,
          company_name: data.company_name ?? null,
          phone:        data.phone ?? null,
        }
      })
      if (error) throw new Error(error.message)
      if (result?.error) throw new Error(result.error)

      toast.success(`Account created! Welcome email sent to ${data.email}`)
      refresh()
      reset()
      setShowModal(false)
    } catch (err) {
      toast.error(err.message ?? 'Failed to create user')
    } finally {
      setCreating(false)
    }
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl text-white">Users</h1>
          <p className="text-gray-500 text-sm mt-1">
            {activeAdmins.length} admin{activeAdmins.length !== 1 ? 's' : ''} · {activeClients.length} client{activeClients.length !== 1 ? 's' : ''}
            {deletedUsers.length > 0 && ` · ${deletedUsers.length} deleted`}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gold hover:bg-gold-dark text-nyin-bg px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          <Plus size={16} />
          New User
        </button>
      </div>

      {/* Admins */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={14} className="text-gold" />
          <h2 className="font-display text-xl text-white">Administrators</h2>
          <span className="text-xs text-gray-600 bg-nyin-card border border-nyin-border px-2 py-0.5 rounded-full ml-1">
            {activeAdmins.length}
          </span>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeAdmins.map(user => (
            <UserCard key={user.id} user={user} onRefresh={refresh} />
          ))}
          {activeAdmins.length === 0 && !isLoading && (
            <p className="text-gray-600 text-sm col-span-3 py-2">No admins found</p>
          )}
        </div>
      </div>

      {/* Clients */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <User size={14} className="text-blue-400" />
          <h2 className="font-display text-xl text-white">Clients</h2>
          <span className="text-xs text-gray-600 bg-nyin-card border border-nyin-border px-2 py-0.5 rounded-full ml-1">
            {activeClients.length}
          </span>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeClients.map(user => (
            <UserCard key={user.id} user={user} onRefresh={refresh} />
          ))}
          {activeClients.length === 0 && !isLoading && (
            <div className="col-span-3 bg-nyin-card border border-dashed border-nyin-border rounded-xl p-10 text-center">
              <Users size={28} className="text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No clients yet</p>
              <p className="text-gray-700 text-xs mt-1">Click "New User" to create your first client</p>
            </div>
          )}
        </div>
      </div>

      {/* Deleted Users (collapsible) */}
      {deletedUsers.length > 0 && (
        <div>
          <button
            onClick={() => setShowDeleted(!showDeleted)}
            className="flex items-center gap-2 mb-4 text-gray-500 hover:text-white transition-colors"
          >
            <Trash2 size={14} className="text-red-400" />
            <h2 className="font-display text-xl">Deleted Accounts</h2>
            <span className="text-xs text-gray-600 bg-nyin-card border border-nyin-border px-2 py-0.5 rounded-full ml-1">
              {deletedUsers.length}
            </span>
            <span className="text-xs text-gray-600 ml-1">
              {showDeleted ? '▲ hide' : '▼ show'}
            </span>
          </button>

          {showDeleted && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {deletedUsers.map(user => (
                <UserCard key={user.id} user={user} onRefresh={refresh} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className="bg-nyin-card border border-nyin-border rounded-xl w-full max-w-md shadow-2xl overflow-y-auto max-h-[90vh]"
            style={{ animation: 'fadeIn 0.15s ease-out' }}
          >
            <div className="flex items-center justify-between p-6 border-b border-nyin-border sticky top-0 bg-nyin-card z-10">
              <div>
                <h2 className="font-display text-2xl text-white">New User</h2>
                <p className="text-gray-500 text-xs mt-0.5">Create a client or admin account</p>
              </div>
              <button
                onClick={() => { setShowModal(false); reset() }}
                className="text-gray-600 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              {/* Role */}
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Account Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'client', label: 'Client',        icon: User,   desc: 'External counterparty' },
                    { value: 'admin',  label: 'Administrator', icon: Shield, desc: 'NYIN team member' },
                  ].map(({ value, label, icon: Icon, desc }) => (
                    <label key={value}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all
                        ${selectedRole === value ? 'border-gold bg-gold/10 text-gold' : 'border-nyin-border text-gray-500 hover:border-gray-500'}`}
                    >
                      <input type="radio" value={value} {...register('role')} className="hidden" />
                      <Icon size={14} className="mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold">{label}</p>
                        <p className="text-xs opacity-60 mt-0.5">{desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Full Name *</label>
                <input
                  {...register('full_name', { required: 'Full name is required' })}
                  placeholder="John Smith"
                  className="w-full bg-nyin-surface border border-nyin-border rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-gold placeholder-gray-600 transition-colors"
                />
                {errors.full_name && <p className="text-red-400 text-xs mt-1">{errors.full_name.message}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Email Address *</label>
                <div className="relative">
                  <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input
                    {...register('email', {
                      required: 'Email is required',
                      pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' }
                    })}
                    type="email"
                    placeholder="john@company.com"
                    className="w-full bg-nyin-surface border border-nyin-border rounded-lg pl-9 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-gold placeholder-gray-600 transition-colors"
                  />
                </div>
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Temporary Password *</label>
                <div className="relative">
                  <input
                    {...register('password', {
                      required: 'Password is required',
                      minLength: { value: 8, message: 'Minimum 8 characters' }
                    })}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    className="w-full bg-nyin-surface border border-nyin-border rounded-lg px-4 py-2.5 pr-10 text-white text-sm focus:outline-none focus:border-gold placeholder-gray-600 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
              </div>

              {/* Company (clients only) */}
              {selectedRole === 'client' && (
                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Company Name</label>
                  <div className="relative">
                    <Building size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                    <input
                      {...register('company_name')}
                      placeholder="Acme Mining Co."
                      className="w-full bg-nyin-surface border border-nyin-border rounded-lg pl-9 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-gold placeholder-gray-600 transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Phone */}
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Phone Number</label>
                <div className="relative">
                  <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input
                    {...register('phone')}
                    placeholder="+971 50 000 0000"
                    className="w-full bg-nyin-surface border border-nyin-border rounded-lg pl-9 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-gold placeholder-gray-600 transition-colors"
                  />
                </div>
              </div>

              {/* Note */}
              <div className="bg-nyin-surface border border-nyin-border rounded-lg p-3">
                <p className="text-gray-500 text-xs leading-relaxed">
                  📧 A welcome email with login credentials will be sent automatically.
                  The user must set a new password on first login.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); reset() }}
                  className="flex-1 border border-nyin-border text-gray-400 hover:text-white py-2.5 rounded-lg text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-gold hover:bg-gold-dark text-nyin-bg font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                  {creating ? 'Creating...' : `Create ${selectedRole === 'admin' ? 'Admin' : 'Client'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}