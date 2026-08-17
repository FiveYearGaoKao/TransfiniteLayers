//关于存档读取、导入的一些函数
import Decimal, { type DecimalSource } from 'break_eternity.js'
import { compressToBase64, decompressFromBase64 } from 'lz-string'
import { player, type Player, initializeSave } from '@/data/player'
import { gameName, gameVersion } from '@/data/constants'
import { getLayer } from '@/access'
import { seedRng } from './rng'
import { migrate } from './migration'
import { check } from './checksum'
import { addLog } from '@/log'

//------修改存档------
/**player中类型为Decimal的属性名 */
type decimalKey = { [K in keyof Player]: Player[K] extends Decimal ? K : never }[keyof Player]
/**将player中类型为Decimal的属性key增加value */
export function addValue(key: decimalKey, value: DecimalSource) {
  player[key] = player[key].add(value)
}

//------存档和读档------
/**将对象中的Decimal替换为{$d:字符串}标记(序列化用) */
function markDecimals(obj: unknown): unknown {
  if (obj instanceof Decimal) return { $d: obj.toString() }
  if (Array.isArray(obj)) return obj.map(markDecimals)
  if (obj != null && typeof obj == 'object') {
    const res: Record<string, unknown> = {}
    for (const key of Object.keys(obj)) {
      res[key] = markDecimals((obj as Record<string, unknown>)[key])
    }
    return res
  }
  return obj
}
/**将{$d:字符串}标记还原为Decimal(读档用) */
function unmarkDecimals(obj: unknown): unknown {
  if (obj != null && typeof obj == 'object' && '$d' in obj) {
    return new Decimal((obj as { $d: string }).$d)
  }
  if (Array.isArray(obj)) return obj.map(unmarkDecimals)
  if (obj != null && typeof obj == 'object') {
    const res: Record<string, unknown> = {}
    for (const key of Object.keys(obj)) {
      res[key] = unmarkDecimals((obj as Record<string, unknown>)[key])
    }
    return res
  }
  return obj
}
/**将存档转化为字符串 */
function stringify(): string {
  check(player)
  const saveFile = compressToBase64(JSON.stringify(markDecimals(player)))
  return saveFile
}
/**将字符串转化为Player对象 */
function parse(s1: string): Player {
  return unmarkDecimals(JSON.parse(s1)) as Player
}
/**尝试从字符串导入存档，并返回错误码 */
function load(s: string): number {
  const s1 = decompressFromBase64(s) || 'null'
  const saveFile = parse(s1)
  console.log(saveFile)
  if (saveFile == null || typeof saveFile != 'object') {
    addLog('error', '导入失败!存档格式不正确![错误代码:101]')
    return 100
  } else if (0 && !check(saveFile)) {
    addLog('error', '导入失败!存档疑似被修改过![错误代码:250]')
    return 250
  } else if (saveFile.lastPlay > Date.now()) {
    addLog('error', '导入失败!存档来自未来，加载它可能导致时空错乱![错误代码:301]')
    return 301
  } else if (saveFile.firstPlay > saveFile.lastPlay) {
    addLog('error', '导入失败!存档时间异常，加载它可能导致时空错乱![错误代码:302]')
    return 302
  } else if (saveFile.firstPlay < new Date('2026/1/1').getTime()) {
    addLog('error', '导入失败!存档创建时间过早，加载它可能导致时空错乱![错误代码:303]')
    return 303
  } else {
    migrate(saveFile)
    Object.assign(player, saveFile)
    player.version = gameVersion
    if (!(player.seed >= 0)) player.seed = 0
    if (!player.achievements) player.achievements = []
    if (!player.knowledge) player.knowledge = new Decimal(0)
    if (!player.automations) player.automations = {}
    if (!player.challenges) player.challenges = {}
    if (!player.activeChallenges) player.activeChallenges = []
    if (!player.challengeTab) player.challengeTab = 'normal'
    if (getLayer(player.layerSubtab) == null) player.layerSubtab = [0]
    seedRng(player.seed)
    return 0
  }
}
/**保存存档到本地存储 */
export function localSave(slot: number = 0) {
  localStorage.setItem(gameName + '-save' + slot, stringify())
}
/**从本地存储导入存档 */
export function localLoad(slot: number = 0): boolean {
  const s = localStorage.getItem(gameName + '-save' + slot)
  if (s == null) {
    return false
  } else {
    return load(s) == 0
  }
}
/**获取当前存档的字符串(用于导出) */
export function exportSaveString(): string {
  return stringify()
}
/**从字符串导入存档 */
export function importSaveString(s: string): boolean {
  return load(s) == 0
}
/**硬重置 */
export function hardReset() {
  Object.assign(player, initializeSave())
  addLog('info', '游戏已重置')
  localSave()
}
