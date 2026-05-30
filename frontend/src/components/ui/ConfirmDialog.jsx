export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Confirm', variant = 'gold', loading = false }) {
  if (!isOpen) return null

  const btnStyles = {
    gold:    'bg-gold hover:bg-gold-dark text-nyin-bg',
    danger:  'bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30',
    success: 'bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30',
  }

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-nyin-card border border-nyin-border rounded-xl p-6 max-w-sm w-full shadow-2xl"
        style={{ animation: 'fadeIn 0.15s ease-out' }}>
        <h3 className="font-display text-xl text-white mb-2">{title}</h3>
        <p className="text-gray-400 text-sm mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 border border-nyin-border text-gray-400 hover:text-white hover:border-gray-500 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${btnStyles[variant]}`}
          >
            {loading ? 'Please wait...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}