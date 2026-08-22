//维度的计算(只读)
import Decimal from 'break_eternity.js'
import type { LayerId } from '@/data/types'
import { c4BoughtOffset, dimensionAmount, getBase } from '@/access'
import { getLayerOrder, isLayer0 } from '@/tools/ordinal'
import { softCapValue } from '@/tools/softCap'
import { calculate } from './effects'
import { softCap } from './softCap'
import './energy'

interface dimensionInfo {
  cost: (layer: LayerId, id: number, n: Decimal) => Decimal
}

/**不同层级维度的公式 */
export const DIMENSIONS: dimensionInfo[] = [
  {
    cost(_layer: LayerId, id: number, n: Decimal): Decimal {
      // 价格公式为 B^(a+b*n)
      const base = new Decimal(id)
      const increment = new Decimal(id + 1)
      return new Decimal(getBase()).pow(increment.mul(n).add(base))
    },
  },
]

/**已购n个时某维度的价格 */
export function dimensionCostAt(layer: LayerId, id: number, n: Decimal): Decimal {
  const order = Math.min(getLayerOrder(layer), DIMENSIONS.length - 1)
  const formula = DIMENSIONS[order]?.cost
  if (!formula) return Decimal.dInf
  //挑战C4:购买任何东西都使价格视为多购买1次(偏移量=本层购买总数)
  const n2 = c4BoughtOffset(layer, n)
  const base = softCap(formula(layer, id, n2))
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
  if (isLayer0(layer) && id == 0) {
    value = calculate('pointsGain', { pos: layer, id }, value)
    //层级0点数生产软上限:产量超过1e300后增长变缓(power<1),减缓逼近1.79e308的终局
    value = softCapValue(value, new Decimal(1e300), 0.5)
  }
  return value
}
