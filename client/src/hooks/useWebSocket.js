import { useEffect, useState, useCallback, useRef } from 'react'
import { io } from 'socket.io-client'

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '')

export function useWebSocket() {
  const [connected, setConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)
  const socketRef = useRef(null)

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))
    socket.on('initial_data', (data) => setLastUpdate({ type: 'snapshot', data, ts: Date.now() }))
    socket.on('update', (data) => setLastUpdate({ type: 'snapshot', data, ts: Date.now() }))
    socket.on('score_update', (data) => setLastUpdate({ type: 'score', data, ts: Date.now() }))
    socket.on('alert_new', (data) => setLastUpdate({ type: 'alert', data, ts: Date.now() }))
    socket.on('event_new', (data) => setLastUpdate({ type: 'event', data, ts: Date.now() }))

    socketRef.current = socket
    return () => socket.disconnect()
  }, [])

  const emit = useCallback((event, data) => {
    socketRef.current?.emit(event, data)
  }, [])

  const subscribe = useCallback((event, handler) => {
    socketRef.current?.on(event, handler)
    return () => socketRef.current?.off(event, handler)
  }, [])

  return { connected, lastUpdate, subscribe, emit }
}
