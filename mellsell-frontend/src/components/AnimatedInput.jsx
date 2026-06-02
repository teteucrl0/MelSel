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
          bg-amber-50/50 dark:bg-slate-700 text-amber-900 dark:text-slate-100 placeholder-amber-300 dark:placeholder-slate-500
          border-2 transition-all duration-300
          ${error ? 'border-red-400' : 'border-amber-200 dark:border-slate-600 group-hover:border-amber-500 dark:group-hover:border-yellow-500 focus:border-amber-400 dark:focus:border-yellow-400'}
          focus:outline-none focus:ring-2 
          ${error ? 'focus:ring-red-400' : 'focus:ring-amber-400/20 dark:focus:ring-yellow-400/20'}
          disabled:opacity-50 disabled:cursor-not-allowed
          ${value ? 'pt-6 pb-2' : 'pt-3 pb-3'}
        `}
        {...props}
      />
      <label
        className={`
          absolute left-4 transition-all duration-300 pointer-events-none
          ${value 
            ? 'top-1 text-xs text-amber-600 dark:text-yellow-400 font-semibold' 
            : 'top-3 text-sm text-amber-700 dark:text-slate-400 group-hover:text-amber-900 dark:group-hover:text-slate-300'}
        `}
      >
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {error && <div className="mt-1 text-xs text-red-400">{error}</div>}
    </div>
  )
}
