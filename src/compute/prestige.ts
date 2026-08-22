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
        const gain = isLayer0(layer1)
          ? prestigeResource.div(1e16).pow(0.125)
          : prestigeResource.div(1e4).pow(0.25)
        return gain.gte(1) ? gain : new Decimal(0)
      } else {
        return new Decimal(0)
      }
    },
  },
]
/**重置收益的基础公式值(不含点数获取加成),统计页"点数获取"树的初始值用 */
export function resetGainBase(layer: LayerId): Decimal {
  const order = Math.min(getLayerOrder(layer), PRESTIGE.length - 1)
  return PRESTIGE[order]?.resetGain(layer) || new Decimal(0)
}
/**重置资源的获取量 */
export function resetGain(layer: LayerId): Decimal {
  let value = resetGainBase(layer)
  //非层级0的层的重置收益即点数获取，应用点数获取类的加成
  if (!isLayer0(layer)) value = calculate('pointsGain', { pos: layer, id: 0 }, value)
  return value.floor()
}
/**判断层级能否重置 */
export function canReset(layer: LayerId): boolean {
  return resetGain(layer).gt(0) && !isLayer0(layer)
}
