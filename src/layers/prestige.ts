//进行重置

import Decimal from 'break_eternity.js'
import { initializeDimensions, initializeLayer, type LayerId } from './types'
import {
  getLayer,
  getLayerIndex,
  getLayerOrder,
  highestActiveLayer,
  isActive,
  isLayer0,
  nextLayer,
  prevLayer,
  shiftLayer,
  tempLayers,
} from '.'
import { player } from '@/player'

interface prestigeInfo {
  resetGain(layer: LayerId): Decimal
  reset(layer: LayerId): void
}

export const PRESTIGE: prestigeInfo[] = [
  {
    resetGain(layer: LayerId): Decimal {
      if (!isLayer0(layer)) {
        let layer1 = prevLayer(layer)
        let prestigeResource = getLayer(layer1)?.points || new Decimal(0)
        return prestigeResource.div(10000).pow(0.5).floor()
      } else {
        return new Decimal(0)
      }
    },
    reset(layer: LayerId) {
      let L = getLayer(layer)
      if (L) {
        L.points = isLayer0(layer) ? new Decimal(1) : new Decimal(0)
        L.totalPoints = new Decimal(0)
        L.energy = new Decimal(0)
        L.resetTime = new Decimal(0)
        L.buyables = {}
        L.upgrades = []
        L.dimensions = []
        for (let i = 0; i < 4; ++i) L.dimensions.push([new Decimal(0), new Decimal(0)])
      }
    },
  },
]
/**重置资源的获取量 */
export function resetGain(layer: LayerId): Decimal {
  let order = Math.min(getLayerOrder(layer), PRESTIGE.length - 1)
  return PRESTIGE[order]?.resetGain(layer) || new Decimal(0)
}
/**判断层级能否重置 */
export function canReset(layer: LayerId): boolean {
  return resetGain(layer).gt(0) && !isLayer0(layer)
}

/**重置层级 */
export function resetData(layer: LayerId) {
  let order = Math.min(getLayerOrder(layer), PRESTIGE.length - 1)
  PRESTIGE[order]?.reset(layer)
}

/**
 * 点击重置按钮
 * @param forced 是否为强制重置
 * @param gainResource 是否获得资源
 */
export function doReset(layer: LayerId, forced: boolean = false, gainResource: boolean = true) {
  if (forced || canReset(layer)) {
    if (isLayer0(layer)) return
    let L = getLayer(layer)
    //获得本层级资源
    if (gainResource && L && L.active) {
      let gain = resetGain(layer)
      L.points = L.points.add(gain)
      L.totalPoints = L.totalPoints.add(gain)
    }
    //重置前面的层级
    let prev = prevLayer(layer)
    doReset(prev, true, gainResource)
    resetData(prev)
    //如果是临时层级，则添加一个新层级
    if (layer.indexOf(-1) >= 0) {
      let n = getLayerOrder(layer)
      let posh = highestActiveLayer(layer, n)
      let highestLevel = getLayer(posh)?.level || new Decimal(0)
      let idx = getLayerIndex(posh, n)
      if (idx < player.base - 1) {
        //直接将新层级加在原层级后面
        player.layers[nextLayer(posh).toString()] = L || null
      } else {
        //后面的层级向前平移
        for (let i = Math.floor(player.base / 2); i < player.base - 1; i++) {
          let pos1 = shiftLayer(layer, n, i).toString()
          let pos2 = shiftLayer(layer, n, i + 1).toString()
          player.layers[pos1] = getLayer(pos2) || null
        }
        player.layers[posh.toString()] = L || null
      }
      tempLayers[layer.toString()] = initializeLayer(highestLevel.add(1))
    }
  }
}
