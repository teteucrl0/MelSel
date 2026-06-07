export default function ShopPageHeader({ title, description, action }) {
  return (
    <header className="shop-page-header">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="shop-page-header-action">{action}</div>}
    </header>
  )
}