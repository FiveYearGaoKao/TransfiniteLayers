//各层级的维度
import Decimal, { type DecimalSource } from 'break_eternity.js'
import type { Layer, LayerId } from './types'
import { player } from '@/player'
import { getLayerOrder, getLayer } from '.'
import { dimensionAmount, addAmount } from './easyAccess'

interface dimensionInfo {
  cost: (layer: LayerId, id: number) => Decimal
  multiplier: (layer: LayerId, id: number) => Decimal
  exponent: (layer: LayerId, id: number) => Decimal
}

/**不同层级维度的公式 */
export const DIMENSIONS: dimensionInfo[] = [
  {
    cost: function (layer: LayerId, id: number): Decimal {
      let amount = dimensionAmount(layer, id, 1)
      return new Decimal(player.base).pow(amount.mul(id + 1).add(id))
    },
    multiplier(layer: LayerId, id: number): Decimal {
      let amount = dimensionAmount(layer, id, 1)
      return new Decimal(amount).add(1)
    },
    exponent(layer: LayerId, id: number): Decimal {
      return new Decimal(1)
    },
  },
]

/**获取某维度的价格 */
export function dimensionCost(layer: LayerId, id: number): Decimal {
  let order = Math.min(getLayerOrder(layer), DIMENSIONS.length - 1)
  return DIMENSIONS[order]?.cost(layer, id) || Decimal.dInf
}
/**获取某维度的乘数 */
export function dimensionMultiplier(layer: LayerId, id: number): Decimal {
  let order = Math.min(getLayerOrder(layer), DIMENSIONS.length - 1)
  return DIMENSIONS[order]?.multiplier(layer, id) || new Decimal(1)
}
/**获取某维度的指数 */
export function dimensionExponent(layer: LayerId, id: number): Decimal {
  let order = Math.min(getLayerOrder(layer), DIMENSIONS.length - 1)
  return DIMENSIONS[order]?.exponent(layer, id) || new Decimal(1)
}
/**判断是否能购买某维度 */
export function canAfford(layer: LayerId, id: number): boolean {
  let L = getLayer(layer)
  if (!L) return false
  return L.points.gte(dimensionCost(layer, id))
}
/**购买维度 */
export function buyDimension(layer: LayerId, id: number) {
  let L = getLayer(layer)
  if (L && canAfford(layer, id)) {
    L.points = L.points.sub(dimensionCost(layer, id))
    addAmount(layer, id, 1, 0)
    addAmount(layer, id, 1, 1)
  }
}
/**每秒产量 */
export function productionPerSecond(layer: LayerId, id: number): Decimal {
  return dimensionAmount(layer, id)
    .mul(dimensionMultiplier(layer, id))
    .pow(dimensionExponent(layer, id))
}
