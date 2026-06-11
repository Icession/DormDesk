import { useEffect, useRef, useState } from 'react'

export default function ImagePickerField({ file, onChange, label, hint }) {
  const inputRef = useRef(null)
  const [preview, setPreview] = useState(null)

  // Build a local preview URL whenever the file changes
  useEffect(() => {
    if (!file) {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />

      {!file ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-amber-300 hover:border-slate-400 hover:bg-amber-50 rounded-xl p-4 text-center transition-colors"
        >
          <span className="text-sm font-semibold text-slate-600 block">
            {label ?? 'Attach an image'}
          </span>
          {hint && <span className="text-xs text-slate-400">{hint}</span>}
        </button>
      ) : (
        <div className="flex items-center gap-3 border border-amber-200 bg-amber-50 rounded-xl p-3">
          <img
            src={preview}
            alt="Preview"
            className="w-14 h-14 object-cover rounded-lg border border-amber-200"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
            <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(0)} KB</p>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-xs font-medium text-slate-500 hover:text-slate-700 underline"
          >
            Change
          </button>
          <button
            type="button"
            onClick={() => {
              onChange(null)
              if (inputRef.current) inputRef.current.value = ''
            }}
            title="Remove"
            className="text-slate-400 hover:text-red-500 px-1"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}