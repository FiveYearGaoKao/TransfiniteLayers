//购买行为
import Decimal, { type DecimalSource } from 'break_eternity.js'
import type { LayerId } from '@/data/types'
import { addAmount, dimensionAmount, getLayer } from '@/access'
import { dimensionCost, dimensionCostAt } from '@/compute/dimensions'
import {
  buyableAmount,
  buyableCostAt,
  getBuyable,
} from '@/compute/buyables'
import { canBuyUpgrade, upgradeCost } from '@/compute/upgrades'
import { type BuyableItem, maxBuyable, sumCost } from '@/compute/buying'

/**维度作为可购买项 */
function dimItem(layer: LayerId, id: number): BuyableItem {
  return {
    amount: () => dimensionAmount(layer, id, 1),
    cost: (n) => dimensionCostAt(layer, id, n),
  }
}
/**可购买作为可购买项 */
function buyableItem(layer: LayerId, id: number): BuyableItem {
  return {
    amount: () => buyableAmount(layer, id),
    cost: (n) => buyableCostAt(layer, id, n),
  }
}

/**判断是否能购买某维度 */
export function canAfford(layer: LayerId, id: number): boolean {
  const L = getLayer(layer)
  if (!L) return false
  return L.points.gte(dimensionCost(layer, id))
}
/**
 * 购买维度
 * @param amount 一次性购买的数量上限，默认1
 * @param budget 至多花费的本层点数
 * @returns 实际花费的点数
 */
export function buyDimension(
  layer: LayerId,
  id: number,
  amount: DecimalSource = 1,
  budget?: DecimalSource,
): Decimal {
  const L = getLayer(layer)
  if (!L) return new Decimal(0)
  const item = dimItem(layer, id)
  const limit = budget != null ? new Decimal(budget) : L.points
  const n = Decimal.min(new Decimal(amount), maxBuyable(item, limit))
  if (n.lte(0)) return new Decimal(0)
  const cost = sumCost(item, n)
  if (cost.gt(L.points)) return new Decimal(0)
  L.points = L.points.sub(cost)
  addAmount(layer, id, n, 0)
  addAmount(layer, id, n, 1)
  return cost
}
/**
 * 购买可购买
 * @param amount 一次性购买的数量上限，默认1
 * @param budget 至多花费的本层点数
 * @returns 实际花费的点数
 */
export function buyBuyable(
  layer: LayerId,
  id: number,
  amount: DecimalSource = 1,
  budget?: DecimalSource,
): Decimal {
  const L = getLayer(layer)
  const def = getBuyable(id)
  if (!L || !def) return new Decimal(0)
  const item = buyableItem(layer, id)
  const limit = budget != null ? new Decimal(budget) : L.points
  const n = Decimal.min(new Decimal(amount), maxBuyable(item, limit))
  if (n.lte(0)) return new Decimal(0)
  const cost = sumCost(item, n)
  if (cost.gt(L.points)) return new Decimal(0)
  L.points = L.points.sub(cost)
  L.buyables[id] = buyableAmount(layer, id).add(n)
  //购买了至少一个，onBuy至多触发一次
  def.onBuy?.(layer)
  return cost
}
/**购买升级 */
export function buyUpgrade(layer: LayerId, id: number) {
  const L = getLayer(layer)
  if (L && canBuyUpgrade(layer, id)) {
    L.points = L.points.sub(upgradeCost(layer, id))
    L.upgrades.push(id)
  }
}
