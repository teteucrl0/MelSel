/** Select com seta customizada (evita seta nativa quebrada no tema escuro). */
export default function ShopSelect({ id, className = '', children, ...props }) {
  return (
    <div className={`shop-select-wrap ${className}`.trim()}>
      <select id={id} className="input-field shop-select" {...props}>
        {children}
      </select>
    </div>
  )
}