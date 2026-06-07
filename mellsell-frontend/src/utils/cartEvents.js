/** Evento global para sincronizar badge do header, drawer e páginas do carrinho. */
export const CART_UPDATED_EVENT = 'mellsell-cart-updated'

/** Dispara após mutações no carrinho (add/remove/update/checkout). */
export function notifyCartUpdated(detail = {}) {
  window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT, { detail }))
}