/** Espaço reservado enquanto dados carregam — sem texto "Carregando…". */
export default function PageLoadPlaceholder({ className = 'min-h-[14rem]' }) {
  return <div className={className} aria-busy="true" aria-live="polite" />
}