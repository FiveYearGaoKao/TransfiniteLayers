//关于存档读取、导入的一些函数
import Decimal, { type DecimalSource } from 'break_eternity.js'
import { compressToBase64, decompressFromBase64 } from 'lz-string'
import {
  type playerKey,
  player,
  type Player,
  gameVersion,
  gameName,
  initializeSave,
} from './player'
import { addLog } from './log'

//------修改存档------
/**将player中类型为Decimal的属性key增加value */
export function addValue(key: playerKey, value: DecimalSource) {
  if (player[key] instanceof Decimal) {
    ;(player as any)[key] = (player[key] as Decimal).add(value)
  }
}

//------存档校验码------
/**随便用多项式生成一个校验码 */
function checkCode(s: string, x: number): number {
  const M = 257
  const P = 10000019
  let S = 114514
  const l = s.length
  const A: number[] = new Array(M).fill(0)
  let p = 1
  for (let i = 0; i < l; ++i) {
    const c = s.charCodeAt(i) * s.charCodeAt(i >> 1)
    S ^= c
    p = (p + c + i) % M
    A[p] = ((A[p] || 0) + S) % P
  }
  x = x % P
  let res = 0
  for (let i = 0; i < M; ++i) {
    res = (res * x + (A[i] || 0)) % P
  }
  return res
}
/**生成存档的校验码并和原来的校验码比较 */
function check(p: Player): boolean {
  const previousCheckCode = p.checkCode
  p.checkCode = 0
  p.checkCode = checkCode(JSON.stringify(p), p.firstPlay)
  return previousCheckCode == p.checkCode
}

//------存档和读档------
/**不需要转化的key */
const doNotConvert = ['version', 'mainTab']
/**将所有可以化为Decimal的字符串化为Decimal */
function convertDecimal(key: string, value: any): any {
  if (!doNotConvert.includes(key) && typeof value == 'string') {
    const a = new Decimal(value)
    if (!Decimal.isNaN(a)) return a
  }
  return value
}
/**将存档转化为字符串 */
function stringify(): string {
  check(player)
  const saveFile = compressToBase64(JSON.stringify(player))
  return saveFile
}
/**将字符串转化为Player对象 */
function parse(s: string): Player {
  const s1 = decompressFromBase64(s) || 'null'
  return JSON.parse(s1, convertDecimal)
}
/**尝试从字符串导入存档，并返回错误码 */
function load(s: string): number {
  const saveFile = parse(s)
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
    Object.assign(player, saveFile)
    player.version = gameVersion
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
/**硬重置 */
export function hardReset() {
  Object.assign(player, initializeSave())
  addLog('info', '游戏已重置')
  localSave()
}
