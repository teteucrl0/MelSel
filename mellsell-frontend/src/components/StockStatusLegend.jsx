import StockStatusDot from './StockStatusDot'

export default function StockStatusLegend({ className = '' }) {
  return (
    <div className={`stock-status-legend ${className}`.trim()} role="note" aria-label="Legenda de estoque">
      <span className="stock-status-legend-title">Estoque:</span>
      <span className="stock-status-legend-item">
        <StockStatusDot stock={0} lowStockThreshold={5} pulse={false} />
        Esgotado
      </span>
      <span className="stock-status-legend-item">
        <StockStatusDot stock={2} lowStockThreshold={5} pulse={false} />
        Acabando
      </span>
      <span className="stock-status-legend-item">
        <StockStatusDot stock={20} lowStockThreshold={5} pulse={false} />
        Normal
      </span>
    </div>
  )
}