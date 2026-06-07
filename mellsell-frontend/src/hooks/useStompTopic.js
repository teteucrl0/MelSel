import { useEffect, useRef } from 'react'
import { getWsUrl } from '../utils/wsUrl'

/**
 * Subscribes to a STOMP topic. Handler receives parsed JSON body.
 * SockJS/STOMP carregados sob demanda para não derrubar a app se o bundle falhar.
 */
export default function useStompTopic(topic, onMessage, enabled = true) {
  const handlerRef = useRef(onMessage)

  useEffect(() => {
    handlerRef.current = onMessage
  }, [onMessage])

  useEffect(() => {
    if (!enabled || !topic) return undefined

    let client
    let cancelled = false

    ;(async () => {
      try {
        const [{ Client }, { default: SockJS }] = await Promise.all([
          import('@stomp/stompjs'),
          import('sockjs-client'),
        ])
        if (cancelled) return

        client = new Client({
          webSocketFactory: () => new SockJS(getWsUrl()),
          reconnectDelay: 5000,
          onConnect: () => {
            client.subscribe(topic, (message) => {
              try {
                handlerRef.current(JSON.parse(message.body))
              } catch {
                // ignore malformed payloads
              }
            })
          },
        })
        client.activate()
      } catch (err) {
        console.warn('[MelSell] WebSocket indisponível:', err?.message || err)
      }
    })()

    return () => {
      cancelled = true
      client?.deactivate()
    }
  }, [topic, enabled])
}