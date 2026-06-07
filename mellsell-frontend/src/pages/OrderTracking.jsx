import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import trackingService from '../services/trackingService'
import orderService from '../services/orderService'
import OrderTrackingTimeline from '../components/OrderTrackingTimeline'
import PageLoadPlaceholder from '../components/PageLoadPlaceholder'
import useStompTopic from '../hooks/useStompTopic'
import { buildSimulatedTracking } from '../utils/trackingFallback'
import {
  clampProgress,
  isLiveTrackingSource,
  isSimulatedTrackingSource,
} from '../utils/trackingProgress'

function resolveTrackingPayload(apiData, orderData) {
  if (!apiData) return buildSimulatedTracking(orderData)
  if (apiData.events?.length) {
    return {
      ...apiData,
      progressPercent: clampProgress(apiData.progressPercent),
    }
  }
  const fallback = buildSimulatedTracking(orderData)
  if (!fallback?.events?.length) return apiData
  return {
    ...fallback,
    ...apiData,
    events: fallback.events,
    progressPercent: clampProgress(apiData.progressPercent ?? fallback.progressPercent),
    source: apiData.source && apiData.source !== 'none' ? apiData.source : fallback.source,
  }
}

const BEE_HERO_WIDTH = 683
const BEE_HERO_HEIGHT = 1024
const BEE_HERO_WEBP = '/images/bee-delivery-hero.webp'
const BEE_HERO_PNG = '/images/bee-delivery-hero.png'

const MotionBeeImg = motion.img

function BeeDeliveryHeroPicture({ className, alt = '', animate, transition }) {
  return (
    <picture>
      <source srcSet={BEE_HERO_WEBP} type="image/webp" />
      <MotionBeeImg
        src={BEE_HERO_PNG}
        alt={alt}
        className={className}
        width={BEE_HERO_WIDTH}
        height={BEE_HERO_HEIGHT}
        decoding="async"
        animate={animate}
        transition={transition}
      />
    </picture>
  )
}

export default function OrderTracking() {
  const { id } = useParams()
  const [tracking, setTracking] = useState(null)
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [live, setLive] = useState(false)

  const onTrackingUpdate = useCallback((payload) => {
    if (!payload || payload.orderId == null) return
    setTracking((prev) => ({
      ...(prev || {}),
      ...payload,
      events: payload.events?.length ? payload.events : prev?.events,
      progressPercent: clampProgress(
        payload.progressPercent ?? prev?.progressPercent ?? 0
      ),
    }))
    setLive(isLiveTrackingSource(payload.source))
  }, [])

  useStompTopic(`/topic/tracking/${id}`, onTrackingUpdate, Boolean(id))

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    orderService
      .getOrder(id)
      .then(async (orderData) => {
        if (cancelled) return
        setOrder(orderData)

        try {
          const trackingData = await trackingService.getTracking(id)
          if (cancelled) return

          const resolved = resolveTrackingPayload(trackingData, orderData)
          if (resolved?.events?.length) {
            setTracking(resolved)
            setLive(isLiveTrackingSource(resolved.source))
          } else {
            setError('Rastreamento indisponível para este pedido.')
          }
        } catch {
          const fallback = buildSimulatedTracking(orderData)
          if (!cancelled) {
            if (fallback?.events?.length) {
              setTracking({
                ...fallback,
                progressPercent: clampProgress(fallback.progressPercent),
              })
              setLive(false)
            } else {
              setError('Rastreamento indisponível para este pedido.')
            }
          }
        }
      })
      .catch((err) => {
        if (cancelled) return
        const msg = err?.response?.data?.message
        if (err?.response?.status === 404) {
          setError('Pedido não encontrado.')
        } else if (err?.response?.status === 401) {
          setError('Sessão expirada. Faça login novamente.')
        } else {
          setError(msg || 'Não foi possível carregar o pedido. Confira se o backend está rodando.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id])

  const copyCode = async () => {
    const code = tracking?.trackingCode
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  if (loading) {
    return (
      <div className="tracking-page">
        <div className="tracking-loading-hero" aria-hidden>
          <BeeDeliveryHeroPicture
            alt=""
            className="tracking-hero-bee tracking-loading-bee"
          />
        </div>
        <PageLoadPlaceholder className="min-h-[12rem]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="tracking-page">
        <Link to="/orders" className="tracking-back-link">
          ← Meus pedidos
        </Link>
        <div className="tracking-card tracking-card--center">
          <BeeDeliveryHeroPicture
            alt=""
            className="tracking-error-bee"
            aria-hidden
          />
          <p className="tracking-error-title">Não foi possível rastrear</p>
          <p className="tracking-error-msg">{error}</p>
          <Link to="/orders" className="shop-btn-primary mt-6 inline-flex">
            Voltar aos pedidos
          </Link>
        </div>
      </div>
    )
  }

  const progress = clampProgress(tracking?.progressPercent)
  const delivered = tracking?.delivered
  const isDemoMode = isSimulatedTrackingSource(tracking?.source) && !live

  return (
    <div className="tracking-page">
      <Link to="/orders" className="tracking-back-link">
        ← Meus pedidos
      </Link>

      <section className="tracking-hero">
        <motion.div
          className="tracking-hero-visual"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="tracking-hero-glow" aria-hidden />
          <BeeDeliveryHeroPicture
            alt="Abelha entregadora com pacote"
            className="tracking-hero-bee"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>

        <motion.div
          className="tracking-hero-copy"
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.45 }}
        >
          <span className="tracking-order-pill">Pedido #{id}</span>
          <h1 className="tracking-hero-title">
            {delivered ? 'Entrega concluída!' : 'Seu mel está a caminho'}
          </h1>
          <p className="tracking-hero-sub">
            {tracking?.supplierName
              ? `Enviado por ${tracking.supplierName} · ${tracking?.carrier || 'Correios'}`
              : 'Acompanhe cada etapa até chegar na sua porta.'}
          </p>
          <div className="tracking-hero-meta">
            {live && !delivered && (
              <span className="tracking-live-pill">
                <span className="tracking-live-dot" aria-hidden />
                Ao vivo
              </span>
            )}
            {isDemoMode && !live && (
              <span className="tracking-demo-pill">Modo demonstração</span>
            )}
            {delivered && <span className="tracking-done-pill">✓ Entregue</span>}
            <span className="tracking-progress-pill">{progress}% do trajeto</span>
          </div>
        </motion.div>
      </section>

      <div className="tracking-progress-hero" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={`${progress}% do trajeto`}>
        <motion.div
          className="tracking-progress-hero-fill"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ delay: 0.15, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <p className="tracking-status-line">{tracking?.currentStatusLabel}</p>

      <div className="tracking-grid">
        <section className="tracking-card tracking-card--code">
          <div className="tracking-card-label">Código de rastreio</div>
          <p className="tracking-code-value">{tracking?.trackingCode || '—'}</p>
          <p className="tracking-card-hint">Transportadora · {tracking?.carrier || 'Correios'}</p>
          <div className="tracking-actions">
            {tracking?.trackingCode && (
              <button type="button" onClick={copyCode} className="shop-btn-primary tracking-btn">
                {copied ? '✓ Copiado' : 'Copiar código'}
              </button>
            )}
            {tracking?.correiosUrl && (
              <a
                href={tracking.correiosUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shop-btn-secondary tracking-btn"
              >
                Abrir nos Correios
              </a>
            )}
          </div>
        </section>

        {order?.shippingAddress && (
          <section className="tracking-card tracking-card--address">
            <div className="tracking-card-label">Destino da entrega</div>
            <p className="tracking-address-text">{order.shippingAddress}</p>
            {tracking?.estimatedDelivery && !delivered && (
              <p className="tracking-eta-inline">
                Previsão:{' '}
                <strong>{new Date(tracking.estimatedDelivery).toLocaleDateString('pt-BR')}</strong>
              </p>
            )}
          </section>
        )}
      </div>

      <section className="tracking-card tracking-card--timeline">
        <div className="tracking-timeline-head">
          <h2 className="tracking-timeline-title">Linha do tempo</h2>
          <p className="tracking-timeline-sub">Atualizações da rota de entrega</p>
        </div>
        <OrderTrackingTimeline tracking={tracking} live={live} premium />
      </section>

      {live && (
        <p className="tracking-footnote tracking-footnote--live">
          Atualizações em tempo real — novas etapas aparecem automaticamente.
        </p>
      )}

      {isDemoMode && (
        <p className="tracking-footnote">
          Timeline MelSell (demonstração). O código segue o padrão dos Correios.
        </p>
      )}
    </div>
  )
}