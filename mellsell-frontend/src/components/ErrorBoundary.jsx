import { Component } from 'react'
import { isChunkLoadError } from '../utils/lazyPage'

export default class ErrorBoundary extends Component {
  state = { error: null, isChunkError: false }

  static getDerivedStateFromError(error) {
    return {
      error,
      isChunkError: isChunkLoadError(error),
    }
  }

  componentDidCatch(error, info) {
    console.error('MelSell UI error:', error, info)
  }

  handleRetry = () => {
    if (this.state.isChunkError) {
      window.location.reload()
      return
    }
    this.setState({ error: null, isChunkError: false })
  }

  render() {
    if (this.state.error) {
      const { isChunkError } = this.state
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] px-6 text-stone-100">
          <div className="surface-elevated max-w-md p-8 text-center">
            <h1 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
              {isChunkError ? 'Atualização da página necessária' : 'Algo deu errado na interface'}
            </h1>
            <p className="mt-3 text-sm text-muted">
              {isChunkError
                ? 'O navegador está com um trecho antigo do app (comum após salvar arquivos no Vite). Recarregue com Ctrl+Shift+R.'
                : 'Recarregue a página. Se continuar, limpe o cache do site ou abra em uma aba anônima.'}
            </p>
            <p className="mt-4 rounded-lg bg-stone-100 px-3 py-2 text-left text-xs text-stone-600 dark:bg-stone-800 dark:text-stone-400">
              {this.state.error?.message || String(this.state.error)}
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <button type="button" className="btn-primary w-full" onClick={this.handleRetry}>
                {isChunkError ? 'Recarregar agora' : 'Tentar novamente'}
              </button>
              {!isChunkError && (
                <button
                  type="button"
                  className="btn-secondary w-full"
                  onClick={() => window.location.reload()}
                >
                  Recarregar página
                </button>
              )}
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}