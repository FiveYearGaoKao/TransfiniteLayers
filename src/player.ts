import Decimal from 'break_eternity.js'
import { reactive } from 'vue'
import { initializeLayer, type LayerList } from './layers/types'

export const gameName: string = 'TransfiniteLayers'
export const gameVersion: string = 'v0.0.1'

//------类型声明------
type mainTabs =
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
  totalTime: Decimal
  offlineTime: Decimal //储存的离线时间
  warpTime: Decimal //加速时间
  paused: boolean
  enableOfflineProgress: boolean
  checkCode: number
  mainTab: mainTabs
  layerSubtab: number[]
  points: Decimal
  layers: LayerList
  layerDepth: number
  base: number
}
export type playerKey = keyof Player

//------初始化存档------
/**创建一个空白存档 */
export function initializeSave(): Player {
  let player: Player = {
    version: gameVersion,
    firstPlay: Date.now(),
    lastPlay: Date.now(),
    totalTime: new Decimal(0),
    offlineTime: new Decimal(0),
    warpTime: new Decimal(0),
    paused: false,
    enableOfflineProgress: false,
    checkCode: 0,
    mainTab: 'layers',
    layerSubtab: [0],
    points: new Decimal(0),
    layers: {
      '0': initializeLayer(0, true),
    },
    layerDepth: 1,
    base: 10,
  }
  return player
}
export const emptySave: Player = initializeSave()
export const player: Player = reactive(initializeSave())
