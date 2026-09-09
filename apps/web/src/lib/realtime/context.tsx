import {
  createContext,
  createSignal,
  onCleanup,
  onMount,
  useContext,
  type JSX,
} from 'solid-js'
import type { RealtimeEvent } from '@strafe/shared'
import { realtime } from './client.js'

type Status = 'connecting' | 'online' | 'offline'
const Context = createContext<{
  lastEvent: () => RealtimeEvent | undefined
  status: () => Status
}>()
export function RealtimeProvider(props: { children?: JSX.Element }) {
  const [lastEvent, setLastEvent] = createSignal<RealtimeEvent>()
  const [status, setStatus] = createSignal<Status>('offline')
  onMount(() => {
    const offEvent = realtime.onEvent(setLastEvent)
    const offStatus = realtime.onStatus(setStatus)
    realtime.start()
    onCleanup(() => {
      offEvent()
      offStatus()
      realtime.stop()
    })
  })
  return (
    <Context.Provider value={{ lastEvent, status }}>
      {props.children}
    </Context.Provider>
  )
}
export function useRealtime() {
  const value = useContext(Context)
  if (!value) throw new Error('RealtimeProvider is missing')
  return value
}
