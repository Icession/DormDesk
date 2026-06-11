const styles = {
  unpaid: 'bg-rose-100 text-rose-700',
  partially_paid: 'bg-amber-100 text-amber-700',
  paid: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-rose-100 text-rose-700',
  in_progress: 'bg-sky-100 text-sky-700',
  resolved: 'bg-green-100 text-green-700',
}

const labels = {
  unpaid: 'Unpaid',
  partially_paid: 'Partial',
  paid: 'Paid',
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  in_progress: 'In progress',
  resolved: 'Resolved',
}

export default function StatusBadge({ status }) {
  return (
    <span
      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
        styles[status] ?? 'bg-slate-100 text-slate-600'
      }`}
    >
      {labels[status] ?? status}
    </span>
  )
}