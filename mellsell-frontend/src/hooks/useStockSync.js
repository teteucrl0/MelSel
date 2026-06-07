import useStompTopic from './useStompTopic'

/**
 * Subscribes to /topic/inventory via STOMP/SockJS.
 * onUpdate is called with { productId, productName, stock, supplierId } on every broadcast.
 */
export default function useStockSync(onUpdate) {
  useStompTopic('/topic/inventory', onUpdate)
}
