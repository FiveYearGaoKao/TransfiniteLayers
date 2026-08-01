//更新层级
import { player } from '@/player'
import {
  getLayer,
  highestActiveLayer,
  isActive,
  isLayer0,
  posArray,
  shiftLayer,
  tempLayers,
} from '.'
import Decimal from 'break_eternity.js'
import { addAmount } from './easyAccess'
import { productionPerSecond } from './dimensions'
import { initializeLayer, type LayerId } from './types'

/**更新指定的层级 */
function updateLayer(pos: LayerId, dt: Decimal) {
  const layer = getLayer(pos)
  if (!layer) return
  if (!isActive(pos)) return
  const l = layer.dimensions.length
  //从上到下更新每一维度
  for (let i = l - 2; i >= 0; --i) {
    const produced = productionPerSecond(pos, i + 1).mul(dt)
    addAmount(layer, i, produced)
  }
  //第1维度生产点数或能量
  const dim1Production = productionPerSecond(pos, 0).mul(dt)
  if (isLayer0(pos)) layer.points = layer.points.add(dim1Production)
  else layer.energy = layer.energy.add(dim1Production)
}
/**更新所有层级 */
export function updateLayers(dt: Decimal) {
  for (const i of Object.keys(player.layers).toReversed()) {
    updateLayer(posArray(i), dt)
  }
  updateTempLayers([0], player.layerDepth - 1)
}

/**基于最高层更新临时层级 */
function updateTempLayer(pos: LayerId, n: number = 0) {
  let L = getLayer(pos)
  if (L) {
    let pos1 = shiftLayer(pos, n, -1)
    let newLevel = L.level.add(1)
    let tempL = getLayer(pos1)
    if (!tempL) {
      tempL = tempLayers[pos1.toString()] = initializeLayer(newLevel)
    } else {
      tempL.level = newLevel
    }
  }
}

/**递归更新所有临时层级*/
export function updateTempLayers(pos: LayerId, n: number = 0) {
  if (n > 0) {
    for (let i = 0; i < player.base; i++) {
      let pos1 = shiftLayer(pos, n, i)
      if (isActive(pos1)) updateTempLayers(pos1, n - 1)
    }
  }
  let posh = highestActiveLayer(pos, n)
  updateTempLayer(posh, n)
}
