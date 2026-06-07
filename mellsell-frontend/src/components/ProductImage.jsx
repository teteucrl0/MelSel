import { useState } from 'react'
import { resolveProductImageUrl } from '../utils/productImageUrl'

function PlaceholderIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="product-media-placeholder-icon" aria-hidden>
      <path d="M12 3l6 3.5v7L12 17l-6-3.5v-7L12 3z" />
      <circle cx="12" cy="11" r="2" fill="currentColor" stroke="none" />
    </svg>
  )
}

export default function ProductImage({
  imageUrl,
  alt = 'Produto',
  className = 'product-media',
  variant = 'card',
}) {
  const [failed, setFailed] = useState(false)
  const src = resolveProductImageUrl(imageUrl)
  const isDetail = variant === 'detail'
  const wrapperClass = [
    className,
    isDetail ? 'product-media-frame' : '',
  ]
    .filter(Boolean)
    .join(' ')
  const imgClass = isDetail ? 'product-media-img product-media-img--contain' : 'product-media-img'

  if (!src || failed) {
    return (
      <div className={`${wrapperClass} product-media--empty`}>
        <PlaceholderIcon />
      </div>
    )
  }

  return (
    <div className={wrapperClass}>
      <img
        src={src}
        alt={alt}
        className={imgClass}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </div>
  )
}