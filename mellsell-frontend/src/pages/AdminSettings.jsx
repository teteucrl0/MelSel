import React from 'react'

export default function AdminSettings() {
  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8 dark:text-white">Configurações do Sistema</h1>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-lg shadow-sm">
        <p className="text-slate-600 dark:text-slate-400">
          Esta é uma página de espaço reservado para as configurações do sistema. 
          Aqui você poderá ajustar parâmetros globais, taxas e outras preferências.
        </p>
      </div>
    </div>
  )
}
