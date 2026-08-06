//维度的计算(只读)
import Decimal from 'break_eternity.js'
import type { LayerId } from '@/data/types'
import { dimensionAmount, getBase } from '@/access'
import { getLayerOrder, isLayer0 } from '@/tools/ordinal'
import { calculate, registerEffect } from './effects'

interface dimensionInfo {
  cost: (layer: LayerId, id: number, n: Decimal) => Decimal
}

/**不同层级维度的公式 */
export const DIMENSIONS: dimensionInfo[] = [
  {
    cost(_layer: LayerId, id: number, n: Decimal): Decimal {
      return new Decimal(getBase()).pow(n.mul(id + 1).add(id))
    },
  },
]

//维度的倍率和指数都属于加成，统一注册到加成管道
registerEffect('dimensionMult', {
  id: 'dimension-self',
  order: -1,
  apply(value, ctx) {
    return value.mul(dimensionAmount(ctx.pos, ctx.id, 1).add(1))
  },
})

/**已购n个时某维度的价格 */
export function dimensionCostAt(layer: LayerId, id: number, n: Decimal): Decimal {
  const order = Math.min(getLayerOrder(layer), DIMENSIONS.length - 1)
  const base = DIMENSIONS[order]?.cost(layer, id, n) || Decimal.dInf
  return calculate('dimensionCost', { pos: layer, id }, base)
}
/**获取某维度的价格 */
export function dimensionCost(layer: LayerId, id: number): Decimal {
  return dimensionCostAt(layer, id, dimensionAmount(layer, id, 1))
}
/**获取某维度的乘数 */
export function dimensionMultiplier(layer: LayerId, id: number): Decimal {
  return calculate('dimensionMult', { pos: layer, id }, new Decimal(1))
}
/**获取某维度的指数 */
export function dimensionExponent(layer: LayerId, id: number): Decimal {
  return calculate('dimensionExponent', { pos: layer, id }, new Decimal(1))
}
/**每秒产量 */
export function productionPerSecond(layer: LayerId, id: number): Decimal {
  let value = dimensionAmount(layer, id)
    .mul(dimensionMultiplier(layer, id))
    .pow(dimensionExponent(layer, id))
  value = calculate('production', { pos: layer, id }, value)
  //层级0的维度1产量即点数获取，应用点数获取类的加成
  if (isLayer0(layer) && id == 0) value = calculate('pointsGain', { pos: layer, id }, value)
  return value
}
