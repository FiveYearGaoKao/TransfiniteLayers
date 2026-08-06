//升级的定义与计算
//升级是一次性的，每个升级有三种状态:无法购买、可以购买、已购买
//通用升级默认在层级1及以上出现，层级0只出现u2、u3，u9需层级2及以上解锁
import Decimal from 'break_eternity.js'
import type { LayerId } from '@/data/types'
import {
  dimensionAmount,
  getLayer,
  getPoints,
  higherLayer,
  getBase,
} from '@/access'
import { compareLayer, isLayer0 } from '@/tools/ordinal'
import { format } from '@/tools/format'
import { resetGain } from './prestige'
import { registerEffect, type EffectContext, type EffectTarget } from './effects'

/**升级的配置 */
export interface UpgradeDef {
  id: number
  name: string
  description: string
  /**该升级适用的层级阶数 */
  order: number
  cost(layer: LayerId): Decimal
  /**购买效果的文字说明 */
  effectText(layer: LayerId): string
  /**是否解锁该升级，默认一直解锁 */
  isUnlocked?(layer: LayerId): boolean
  /**前置升级，需先在本层购买 */
  requires?: number[]
}

/**所有已定义的升级 */
export const UPGRADES: UpgradeDef[] = [
  {
    id: 1,
    name: '点数作用',
    description: '根据本层点数，加成下层点数获取',
    order: 0,
    cost(): Decimal {
      return new Decimal(getBase())
    },
    effectText(layer: LayerId): string {
      return `下层点数获取 x${format(getPoints(layer).add(1).pow(0.25))}`
    },
    isUnlocked: (layer: LayerId) => !isLayer0(layer),
  },
  {
    id: 2,
    name: '自协同',
    description: '本层每个维度的产量 x(该维度已购+1)',
    order: 0,
    cost(): Decimal {
      return new Decimal(getBase()).pow(2)
    },
    effectText(): string {
      return '维度产量 x(该维度已购+1)'
    },
    isUnlocked: (layer: LayerId) => isLayer0(layer),
  },
  {
    id: 3,
    name: '加速升级',
    description: '解锁加速器加成',
    order: 0,
    cost(): Decimal {
      return new Decimal(10).pow(10)
    },
    effectText(): string {
      return '解锁加速器加成(b13)'
    },
    isUnlocked: (layer: LayerId) => isLayer0(layer),
  },
  {
    id: 4,
    name: '自动化1',
    description: '解锁层级k-1维度自动购买',
    order: 0,
    cost(): Decimal {
      return new Decimal(200)
    },
    effectText(): string {
      return '解锁层级k-1维度自动购买'
    },
    isUnlocked: (layer: LayerId) => !isLayer0(layer),
  },
  {
    id: 5,
    name: '自动化2',
    description: '解锁层级k-1加速器和加倍器自动购买',
    order: 0,
    cost(): Decimal {
      return new Decimal(2000)
    },
    effectText(): string {
      return '解锁层级k-1加速器和加倍器自动购买'
    },
    isUnlocked: (layer: LayerId) => !isLayer0(layer),
    requires: [4],
  },
  {
    id: 6,
    name: '自动重置',
    description: '解锁层级k自动重置',
    order: 0,
    cost(): Decimal {
      return new Decimal(10).pow(5)
    },
    effectText(): string {
      return '解锁层级k自动重置'
    },
    isUnlocked: (layer: LayerId) => !isLayer0(layer),
    requires: [5],
  },
  {
    id: 7,
    name: '能量保留',
    description: '本层重置时不重置本层能量和维度数量',
    order: 0,
    cost(): Decimal {
      return new Decimal(1000)
    },
    effectText(): string {
      return '本层重置时保留能量和维度数量'
    },
    isUnlocked: (layer: LayerId) => !isLayer0(layer),
  },
  {
    id: 8,
    name: '升级保留',
    description: '本层重置时保留下层升级',
    order: 0,
    cost(): Decimal {
      return new Decimal(10).pow(4)
    },
    effectText(): string {
      return '本层重置时保留下层升级'
    },
    isUnlocked: (layer: LayerId) => !isLayer0(layer),
    requires: [7],
  },
  {
    id: 9,
    name: '软重置',
    description: '每秒获得100%重置时获得的层级k-1点数',
    order: 0,
    cost(): Decimal {
      return new Decimal(10).pow(6)
    },
    effectText(layer: LayerId): string {
      return `每秒获得${format(resetGain(layer))}点数`
    },
    isUnlocked: (layer: LayerId) => compareLayer(layer, [2]) >= 0,
    requires: [8],
  },
]

/**获取某升级的定义 */
export function getUpgrade(id: number): UpgradeDef | undefined {
  return UPGRADES.find((u) => u.id == id)
}
/**获取某阶层级可显示的所有升级 */
export function getUpgrades(order: number): UpgradeDef[] {
  return UPGRADES.filter((u) => u.order == order)
}
/**判断某升级是否已购买 */
export function hasUpgrade(layer: LayerId, id: number): boolean {
  return getLayer(layer)?.upgrades.includes(id) || false
}
/**获取某升级的成本 */
export function upgradeCost(layer: LayerId, id: number): Decimal {
  const def = getUpgrade(id)
  if (!def) return Decimal.dInf
  return def.cost(layer)
}
/**判断某升级是否已解锁 */
export function isUnlocked(layer: LayerId, id: number): boolean {
  const def = getUpgrade(id)
  if (!def) return true
  return def.isUnlocked?.(layer) ?? true
}
/**判断某升级能否购买(未购买、已解锁、前置已购买、点数足够) */
export function canBuyUpgrade(layer: LayerId, id: number): boolean {
  const def = getUpgrade(id)
  if (!def) return false
  const L = getLayer(layer)
  if (!L) return false
  if (hasUpgrade(layer, id)) return false
  if (!isUnlocked(layer, id)) return false
  if (def.requires?.some((r) => !hasUpgrade(layer, r))) return false
  return L.points.gte(upgradeCost(layer, id))
}
/**
 * 注册一个购买后生效的升级效果
 * 升级未购买时效果无效，购买后永久生效
 * @param name 用于在加成面板中显示的名称
 */
export function registerUpgradeEffect(
  target: EffectTarget,
  upgradeId: number,
  apply: (value: Decimal, ctx: EffectContext) => Decimal,
  name?: string,
) {
  registerEffect(target, {
    id: `upgrade-${upgradeId}`,
    name,
    order: 0,
    apply(value, ctx) {
      if (!hasUpgrade(ctx.pos, upgradeId)) return value
      return apply(value, ctx)
    },
  })
}

//------升级效果注册------
//u1 点数作用:根据本层点数加成下层点数获取
registerEffect('pointsGain', {
  id: 'upgrade-1',
  name: '点数作用',
  order: 0,
  apply(value, ctx) {
    const higher = higherLayer(ctx.pos)
    if (!higher || !hasUpgrade(higher, 1)) return value
    return value.mul(getPoints(higher).add(1).pow(0.25))
  },
})
//u2 自协同:本层每个维度的产量 x(该维度已购+1)
registerUpgradeEffect('dimensionMult', 2, (value, ctx) => {
  return value.mul(dimensionAmount(ctx.pos, ctx.id, 1).add(1))
}, '自协同')
