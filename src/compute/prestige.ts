//重置收益的计算(只读)
import Decimal from 'break_eternity.js'
import type { LayerId } from '@/data/types'
import { getPoints, prevLayer } from '@/access'
import { getLayerOrder, isLayer0 } from '@/tools/ordinal'
import { calculate } from './effects'

interface prestigeFormula {
  resetGain(layer: LayerId): Decimal
}

/**不同阶的重置公式 */
export const PRESTIGE: prestigeFormula[] = [
  {
    resetGain(layer: LayerId): Decimal {
      if (!isLayer0(layer)) {
        const layer1 = prevLayer(layer)
        const prestigeResource = getPoints(layer1)
        if (isLayer0(layer1)) return prestigeResource.div(1e20).pow(0.125).floor()
        else return prestigeResource.div(1e5).pow(0.25).floor()
      } else {
        return new Decimal(0)
      }
    },
  },
]
/**重置资源的获取量 */
export function resetGain(layer: LayerId): Decimal {
  const order = Math.min(getLayerOrder(layer), PRESTIGE.length - 1)
  let value = PRESTIGE[order]?.resetGain(layer) || new Decimal(0)
  value = calculate('resetGain', { pos: layer, id: 0 }, value)
  //非层级0的层的重置收益即点数获取，应用点数获取类的加成
  if (!isLayer0(layer)) value = calculate('pointsGain', { pos: layer, id: 0 }, value)
  return value
}
/**判断层级能否重置 */
export function canReset(layer: LayerId): boolean {
  return resetGain(layer).gt(0) && !isLayer0(layer)
}
