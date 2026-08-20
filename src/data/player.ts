import Decimal from 'break_eternity.js'
import { reactive } from 'vue'
import { initializeLayer, type LayerList, type LayerAutomation } from './types'
import { gameVersion, INITIAL_BASE, DEFAULT_BOOST_SPEED } from './constants'

//------类型声明------
export type mainTabs =
  | 'layers'
  | 'options'
  | 'achievements'
  | 'knowledge'
  | 'automation'
  | 'challenges'
  | 'infinity'
  | 'singularity'
  | 'tree'
  | 'ordinal'

export interface Player {
  version: string
  firstPlay: number
  lastPlay: number
  seed: number
  /**游玩时间(游戏时间) */
  totalTime: Decimal
  /**游玩时间(现实时间) */
  realTime: Decimal
  /**储存的离线时间 */
  offlineTime: Decimal
  /**加速时间 */
  warpTime: Decimal
  paused: boolean
  /**离线时间的去向:转加速时间/储存为离线时间/离线结束时询问(需升级"离线去向") */
  offlineMode: 'warp' | 'store' | 'ask'
  checkCode: number
  mainTab: mainTabs
  layerSubtab: number[]
  layers: LayerList
  layerDepth: number
  base: number
  achievements: string[]
  knowledge: Decimal
  /**各知识升级的已购数量 */
  knowledgeUpgrades: Record<string, Decimal>
  /**加速的目标倍率(1倍即关闭) */
  boostSpeed: Decimal
  /**各层级的自动化配置 */
  automations: Record<string, LayerAutomation>
  /**各挑战的完成次数 */
  challenges: Record<string, Decimal>
  /**当前激活的挑战(可叠加) */
  activeChallenges: string[]
  /**挑战页当前子标签 */
  challengeTab: string
}
export type playerKey = keyof Player

//------初始化存档------
/**创建一个空白存档 */
export function initializeSave(): Player {
  const player: Player = {
    version: gameVersion,
    firstPlay: Date.now(),
    lastPlay: Date.now(),
    seed: Math.floor(Math.random() * 1e9),
    totalTime: new Decimal(0),
    realTime: new Decimal(0),
    offlineTime: new Decimal(0),
    warpTime: new Decimal(0),
    paused: false,
    offlineMode: 'warp',
    checkCode: 0,
    mainTab: 'layers',
    layerSubtab: [0],
    layers: {
      '0': initializeLayer(0, true),
    },
    layerDepth: 1,
    base: INITIAL_BASE,
    achievements: [],
    knowledge: new Decimal(0),
    knowledgeUpgrades: {},
    boostSpeed: new Decimal(DEFAULT_BOOST_SPEED),
    automations: {},
    challenges: {},
    activeChallenges: [],
    challengeTab: 'normal',
  }
  return player
}
export const emptySave: Player = initializeSave()
export const player: Player = reactive(initializeSave())
