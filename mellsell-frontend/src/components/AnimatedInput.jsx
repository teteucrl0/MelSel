import React from 'react'

export default function AnimatedInput({ label, type = 'text', value, onChange, placeholder, required = false, error = '', disabled = false, ...props }) {
  return (
    <div className="relative mb-6 group">
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder || label}
        required={required}
        disabled={disabled}
        className={`
          w-full px-4 py-3 rounded-lg
          bg-slate-700 text-slate-100 placeholder-slate-500
          border-2 transition-all duration-300
          ${error ? 'border-red-400' : 'border-slate-600 group-hover:border-yellow-500 focus:border-yellow-400'}
          focus:outline-none focus:ring-2 
          ${error ? 'focus:ring-red-400' : 'focus:ring-yellow-400/20'}
          disabled:opacity-50 disabled:cursor-not-allowed
          ${value ? 'pt-6 pb-2' : 'pt-3 pb-3'}
        `}
        {...props}
      />
      <label
        className={`
          absolute left-4 transition-all duration-300 pointer-events-none
          ${value 
            ? 'top-1 text-xs text-yellow-400 font-semibold' 
            : 'top-3 text-sm text-slate-400 group-hover:text-slate-300'}
        `}
      >
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {error && <div className="mt-1 text-xs text-red-400">{error}</div>}
    </div>
  )
}
