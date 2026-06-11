import { useState } from 'react'

export default function InviteCodeCard({ code }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copy your invite code:', code)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow border border-amber-200 p-6 flex items-center justify-between flex-wrap gap-4">
      <div>
        <h2 className="text-lg font-bold text-slate-700">Tenant invite code</h2>
        <p className="text-sm text-slate-500">
          Share this with your tenants — they'll enter it after signing up to join your property.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <span className="font-mono text-2xl font-bold tracking-widest text-slate-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
          {code}
        </span>
        <button
          onClick={copy}
          className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  )
}