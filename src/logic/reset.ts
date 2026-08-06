//进行重置
import Decimal from 'break_eternity.js'
import { initializeDimensions, initializeLayer, type LayerId } from '@/data/types'
import { getLayer, highestActiveLayer, prevLayer } from '@/access'
import { getLayerIndex, getLayerOrder, isLayer0, nextLayer, shiftLayer } from '@/tools/ordinal'
import { canReset, resetGain } from '@/compute/prestige'
import { hasUpgrade } from '@/compute/upgrades'
import { player } from '@/data/player'
import { temp } from '@/temp'

/**重置选项 */
interface ResetOptions {
  /**保留本层能量和维度数量(升级u7) */
  keepProgress?: boolean
  /**保留下层升级(升级u8) */
  keepUpgrades?: boolean
}

/**重置一个层级的数据(清除维度/升级/可购买等) */
export function resetData(layer: LayerId, opts: ResetOptions = {}) {
  const L = getLayer(layer)
  if (L) {
    const keepProgress = opts.keepProgress ?? hasUpgrade(layer, 7)
    const keepUpgrades = opts.keepUpgrades ?? false
    L.points = isLayer0(layer) ? new Decimal(1) : new Decimal(0)
    L.totalPoints = new Decimal(0)
    if (!keepProgress) L.energy = new Decimal(0)
    L.resetTime = new Decimal(0)
    if (!keepUpgrades) L.buyables = {}
    if (!keepUpgrades) L.upgrades = []
    if (!keepProgress) initializeDimensions(L)
  }
}

/**
 * 点击重置按钮
 * @param forced 是否为强制重置
 * @param gainResource 是否获得资源
 */
export function doReset(layer: LayerId, forced: boolean = false, gainResource: boolean = true) {
  if (forced || canReset(layer)) {
    if (isLayer0(layer)) return
    const L = getLayer(layer)
    //获得本层级资源
    if (gainResource && L && L.active) {
      const gain = resetGain(layer)
      L.points = L.points.add(gain)
      L.totalPoints = L.totalPoints.add(gain)
    }
    //重置前面的层级
    const prev = prevLayer(layer)
    doReset(prev, true, gainResource)
    resetData(prev, { keepUpgrades: hasUpgrade(layer, 8) })
    //如果是临时层级，则添加一个新层级
    if (layer.indexOf(-1) >= 0) {
      const n = getLayerOrder(layer)
      const posh = highestActiveLayer(layer, n)
      const highestLevel = getLayer(posh)?.level || new Decimal(0)
      const idx = getLayerIndex(posh, n)
      if (idx < player.base - 1) {
        //直接将新层级加在原层级后面
        player.layers[nextLayer(posh).toString()] = L || null
      } else {
        //后面的层级向前平移
        for (let i = Math.floor(player.base / 2); i < player.base - 1; i++) {
          const pos1 = shiftLayer(layer, n, i).toString()
          const pos2 = shiftLayer(layer, n, i + 1).toString()
          player.layers[pos1] = getLayer(pos2) || null
        }
        player.layers[posh.toString()] = L || null
      }
      temp.tempLayers[layer.toString()] = initializeLayer(highestLevel.add(1))
    }
  }
}
