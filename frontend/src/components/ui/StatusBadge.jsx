const styles = {
  'Initiated':      'bg-gray-500/20 text-gray-300 border-gray-500/30',
  'Due Diligence':  'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Contracted':     'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  'In Transit':     'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'Settled':        'bg-green-500/20 text-green-300 border-green-500/30',
  'Cancelled':      'bg-red-500/20 text-red-300 border-red-500/30',
  'Draft':          'bg-gray-500/20 text-gray-300 border-gray-500/30',
  'Sent':           'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Viewed':         'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  'Paid':           'bg-green-500/20 text-green-300 border-green-500/30',
  'Overdue':        'bg-red-500/20 text-red-300 border-red-500/30',
}

export default function StatusBadge({ status }) {
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${styles[status] ?? 'bg-gray-500/20 text-gray-300 border-gray-500/30'}`}>
      {status}
    </span>
  )
}