//关于存档读取、导入的一些函数
import Decimal, { type DecimalSource } from 'break_eternity.js'
import { compressToBase64, decompressFromBase64 } from 'lz-string'
import { player, type Player, initializeSave } from '@/data/player'
import { gameName, gameVersion, DEFAULT_BOOST_SPEED, SAVE_SLOT_COUNT } from '@/data/constants'
import { getLayer } from '@/access'
import { seedRng } from './rng'
import { migrate } from './migration'
import { check } from './checksum'
import { addLog } from '@/log'

//------存档槽位------
const CURRENT_SLOT_KEY = gameName + '-slot'
let currentSlot = 0

/**恢复上次使用的存档槽位(启动时调用) */
export function loadSlotChoice() {
  const n = Number(localStorage.getItem(CURRENT_SLOT_KEY))
  if (Number.isInteger(n) && n >= 0 && n < SAVE_SLOT_COUNT) currentSlot = n
}
/**获取当前存档槽位 */
export function getCurrentSlot(): number {
  return currentSlot
}
/**设置当前存档槽位并持久化 */
export function setCurrentSlot(slot: number) {
  if (slot >= 0 && slot < SAVE_SLOT_COUNT) {
    currentSlot = slot
    localStorage.setItem(CURRENT_SLOT_KEY, String(slot))
  }
}

/**单个存档槽位的摘要信息 */
export interface SlotSummary {
  /**槽位序号 */
  slot: number
  /**该槽位是否有存档 */
  exists: boolean
  /**游戏时长(秒) */
  totalTime: Decimal
  /**层级0点数(总点数) */
  points: Decimal
  /**已解锁的成就数 */
  achievements: number
  /**存档版本 */
  version: string
}

/**读取指定槽位的摘要,槽位为空或存档损坏时返回exists=false */
export function getSlotSummary(slot: number): SlotSummary {
  const res: SlotSummary = {
    slot,
    exists: false,
    totalTime: new Decimal(0),
    points: new Decimal(0),
    achievements: 0,
    version: '',
  }
  const s = localStorage.getItem(gameName + '-save' + slot)
  if (s == null) return res
  try {
    const saveFile = parse(decompressFromBase64(s) || 'null')
    if (saveFile == null || typeof saveFile != 'object') return res
    res.exists = true
    res.totalTime = new Decimal(saveFile.totalTime ?? 0)
    res.points = new Decimal(saveFile.layers?.['0']?.points ?? 0)
    res.achievements = saveFile.achievements?.length ?? 0
    res.version = saveFile.version ?? ''
  } catch {
    //存档损坏时按空槽位处理
  }
  return res
}
/**获取全部存档槽位的摘要 */
export function getSlotSummaries(): SlotSummary[] {
  return Array.from({ length: SAVE_SLOT_COUNT }, (_, i) => getSlotSummary(i))
}
/**指定槽位是否存在存档记录(无论内容是否有效) */
export function hasSlotSave(slot: number): boolean {
  return localStorage.getItem(gameName + '-save' + slot) != null
}

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
    if (!player.knowledgeUnlocked) player.knowledgeUnlocked = false
    if (!player.knowledgeUpgrades) player.knowledgeUpgrades = {}
    if (
      player.offlineMode != 'warp' &&
      player.offlineMode != 'store' &&
      player.offlineMode != 'ask'
    )
      player.offlineMode = 'warp'
    if (!player.boostActive) player.boostActive = false
    if (!player.boostSpeed) player.boostSpeed = new Decimal(DEFAULT_BOOST_SPEED)
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
export function localSave(slot: number = currentSlot) {
  localStorage.setItem(gameName + '-save' + slot, stringify())
}
/**从本地存储导入存档 */
export function localLoad(slot: number = currentSlot): boolean {
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
