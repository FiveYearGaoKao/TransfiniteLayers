//可购买的定义与计算
import Decimal from 'break_eternity.js'
import type { LayerId } from '@/data/types'
import { getLayer } from '@/access'
import { initializeDimensions } from '@/data/types'
import { isLayer0 } from '@/tools/ordinal'
import { format } from '@/tools/format'
import { hasUpgrade } from './upgrades'
import { registerEffect } from './effects'

/**可购买的配置 */
export interface BuyableDef {
  id: number
  name: string
  description: string
  /**显示该可购买的层级阶数 */
  order: number
  /**已购n个时下一个的价格 */
  cost(layer: LayerId, n: Decimal): Decimal
  /**购买效果的文字说明 */
  effectText(layer: LayerId, n: Decimal): string
  /**是否解锁该可购买，默认一直解锁 */
  isUnlocked?(layer: LayerId): boolean
  /**购买时的额外效果 */
  onBuy?(layer: LayerId): void
}

/**所有已定义的可购买 */
export const BUYABLES: BuyableDef[] = [
  {
    id: 11,
    name: '加速器',
    description: '所有生成器速度+10%，效果叠乘',
    order: 0,
    cost(_layer: LayerId, n: Decimal): Decimal {
      return new Decimal(10).pow(3).mul(new Decimal(2).pow(n))
    },
    effectText(_layer: LayerId, n: Decimal): string {
      return `所有生成器速度 x${format(new Decimal(1.1).add(buyableAmount(_layer, 13).mul(0.02)).pow(n))}`
    },
  },
  {
    id: 12,
    name: '加倍器',
    description: '层级0:维度1生产*2;其它层级:重置收益*2,效果叠乘',
    order: 0,
    cost(_layer: LayerId, n: Decimal): Decimal {
      return new Decimal(10).pow(n.add(1)).mul(new Decimal(2).pow(n.mul(n)))
    },
    effectText(layer: LayerId, n: Decimal): string {
      if (isLayer0(layer)) return `维度1生产 x${format(new Decimal(2).pow(n))}`
      return `重置收益 x${format(new Decimal(2).pow(n))}`
    },
  },
  {
    id: 13,
    name: '加速器加成',
    description: '使加速器的效果+2%，效果叠加',
    order: 0,
    isUnlocked: (layer: LayerId) => isLayer0(layer) && hasUpgrade(layer, 3),
    cost(_layer: LayerId, n: Decimal): Decimal {
      return new Decimal(10).pow(n.mul(n.add(1)).div(2).add(10))
    },
    effectText(layer: LayerId, n: Decimal): string {
      return `加速器效果 +${format(new Decimal(2).mul(n))}%`
    },
    onBuy(layer: LayerId) {
      const L = getLayer(layer)
      if (!L) return
      L.points = new Decimal(isLayer0(layer) ? 1 : 0)
      initializeDimensions(L)
      L.buyables[11] = new Decimal(0)
      L.buyables[12] = new Decimal(0)
    },
  },
]

/**获取某可购买的购买次数 */
export function buyableAmount(layer: LayerId, id: number): Decimal {
  return getLayer(layer)?.buyables[id] || new Decimal(0)
}
/**获取某可购买的定义 */
export function getBuyable(id: number): BuyableDef | undefined {
  return BUYABLES.find((b) => b.id == id)
}
/**获取某阶层级可显示的所有可购买 */
export function getBuyables(order: number): BuyableDef[] {
  return BUYABLES.filter((b) => b.order == order)
}
/**判断某可购买是否解锁 */
export function isUnlocked(layer: LayerId, id: number): boolean {
  const def = getBuyable(id)
  if (!def) return true
  return def.isUnlocked?.(layer) ?? true
}
/**已购n个时某可购买的价格 */
export function buyableCostAt(layer: LayerId, id: number, n: Decimal): Decimal {
  const def = getBuyable(id)
  if (!def) return Decimal.dInf
  return def.cost(layer, n)
}
/**获取某可购买的成本 */
export function buyableCost(layer: LayerId, id: number): Decimal {
  return buyableCostAt(layer, id, buyableAmount(layer, id))
}
/**判断是否能购买某可购买 */
export function canBuyBuyable(layer: LayerId, id: number): boolean {
  const L = getLayer(layer)
  if (!L) return false
  if (!isUnlocked(layer, id)) return false
  return L.points.gte(buyableCost(layer, id))
}

//将可购买的效果注册到加成管道
//加速器:所有生成器速度+10%，效果受加速器加成(b13)影响
registerEffect('dimensionMult', {
  id: 'buyable-accelerator',
  name: '加速器',
  order: 0,
  apply(value, ctx) {
    const n = buyableAmount(ctx.pos, 11)
    const m = buyableAmount(ctx.pos, 13)
    return value.mul(new Decimal(1.1).add(m.mul(0.02)).pow(n))
  },
})
//加倍器:点数获取*2(层级0为维度1生产，其它层级为重置收益)
registerEffect('pointsGain', {
  id: 'buyable-doubler',
  name: '加倍器',
  order: 0,
  apply(value, ctx) {
    return value.mul(new Decimal(2).pow(buyableAmount(ctx.pos, 12)))
  },
})
