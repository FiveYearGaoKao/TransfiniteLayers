//储存游戏日志
import { reactive } from 'vue'
const MAX_LOG_COUNT = 100
type logType = 'info' | 'warning' | 'error' | 'progress' | 'automator'
export interface log {
  time: number
  type: logType
  text: string
  show: boolean
}
export const logs = reactive([] as log[])
export function addLog(type: logType, text: string) {
  let l: log = { time: Date.now(), type: type, text: text, show: true }
  logs.push(l)
  if (logs.length > MAX_LOG_COUNT) logs.shift()
}
