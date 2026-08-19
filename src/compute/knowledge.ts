//知识升级的定义与计算
//知识升级可多次购买(有数量上限),分为QoL/加成等类别,价格与显示均由声明驱动
import Decimal from 'break_eternity.js'
import { player } from '@/data/player'
import { getPoints } from '@/access'
import { temp } from '@/temp'
import {
  calculate,
  effectText,
  registerEffect,
  type EffectDef,
  type RegisteredEffect,
} from './effects'

/**知识升级的配置 */
export interface KnowledgeUpgradeDef {
  /**唯一id */
  id: string
  name: string
  /**类别(如'qol'/'bonus'),知识页按类别分页 */
  category: string
  description: string
  /**最大购买数 */
  maxAmount: Decimal
  /**已购n个时下一个的价格(单位:知识) */
  cost(n: Decimal): Decimal
  /**前置升级,每一项为[升级id, 至少需要的数量] */
  require: [string, Decimal][]
  /**除前置升级外还需满足的额外条件(如点数需求),不满足时升级隐藏 */
  canBuy(): boolean
  /**数值效果(声明式,可省略) */
  effect?: EffectDef
  /**购买效果的文字说明(缺省从effect自动生成) */
  effectText?(): string
}

/**所有已定义的知识升级 */
export const KNOWLEDGE_UPGRADES: KnowledgeUpgradeDef[] = [
  {
    id: 'qol-offline',
    name: '时间感知',
    category: 'qol',
    description: '解锁离线时间和时间扭曲',
    maxAmount: new Decimal(1),
    cost: () => new Decimal(10),
    require: [],
    canBuy: () => true,
  },
  {
    id: 'qol-offline-store',
    name: '时间存储',
    category: 'qol',
    description: '允许储存离线时间(选项页可切换)',
    maxAmount: new Decimal(1),
    cost: () => new Decimal(10),
    require: [['qol-offline', new Decimal(1)]],
    canBuy: () => true,
  },
  {
    id: 'qol-offline-boost',
    name: '离线加速',
    category: 'qol',
    description: '离线时间可用于加速(稳定提升全局速度)',
    maxAmount: new Decimal(1),
    cost: () => new Decimal(4),
    require: [['qol-offline-store', new Decimal(1)]],
    canBuy: () => true,
  },
  {
    id: 'qol-pause',
    name: '时间暂停',
    category: 'qol',
    description: '允许主动暂停游戏,暂停期间时间储存为离线时间',
    maxAmount: new Decimal(1),
    cost: () => new Decimal(2),
    require: [['qol-offline-store', new Decimal(1)]],
    canBuy: () => true,
  },
  {
    id: 'qol-tick',
    name: 'TAS',
    category: 'qol',
    description: '解锁工具栏的时间流逝1帧按钮',
    maxAmount: new Decimal(1),
    cost: () => new Decimal(1),
    require: [['qol-pause', new Decimal(1)]],
    canBuy: () => true,
  },
  {
    id: 'qol-boost',
    name: '超频',
    category: 'qol',
    description: '加速倍率升级,每级开放更高倍率(x5/x10/x60)',
    maxAmount: new Decimal(3),
    cost(n: Decimal): Decimal {
      return new Decimal(10).pow(n)
    },
    require: [['qol-offline-boost', new Decimal(1)]],
    canBuy: () => true,
  },
  {
    id: 'bonus-points',
    name: '点数增幅',
    category: 'bonus',
    description: '所有点数获取x1.5^数量,效果叠乘',
    maxAmount: new Decimal(10),
    cost(n: Decimal): Decimal {
      return new Decimal(10).mul(n.add(1)).pow(2).floor()
    },
    require: [],
    canBuy: () => true,
    effect: {
      target: 'pointsGain',
      type: 'mul',
      value: () => new Decimal(1.5).pow(knowledgeAmount('bonus-points')),
      text: '点数获取 x{value}',
    },
  },
  {
    id: 'bonus-energy',
    name: '能量共振',
    category: 'bonus',
    description: '能量加成指数+0.01x数量',
    maxAmount: new Decimal(5),
    cost(n: Decimal): Decimal {
      return new Decimal(50).mul(n.add(1)).floor()
    },
    require: [['bonus-points', new Decimal(3)]],
    canBuy: () => getPoints([0]).gte(1e100),
    effect: {
      target: 'energy:base',
      type: 'add',
      value: () => knowledgeAmount('bonus-energy').mul(0.01),
      text: '能量加成指数+{value}',
    },
  },
]

/**获取某知识升级的定义 */
export function getKnowledgeUpgrade(id: string): KnowledgeUpgradeDef | undefined {
  return KNOWLEDGE_UPGRADES.find((k) => k.id == id)
}
/**某知识升级的已购数量 */
export function knowledgeAmount(id: string): Decimal {
  return player.knowledgeUpgrades[id] || new Decimal(0)
}
/**某知识升级是否已购买至少1次 */
export function hasKnowledge(id: string): boolean {
  return knowledgeAmount(id).gte(1)
}
/**某知识升级已购n个时下一个的价格 */
export function knowledgeCost(id: string): Decimal {
  const def = getKnowledgeUpgrade(id)
  if (!def) return Decimal.dInf
  return def.cost(knowledgeAmount(id))
}
/**某知识升级是否已满级 */
export function isMaxed(def: KnowledgeUpgradeDef): boolean {
  return knowledgeAmount(def.id).gte(def.maxAmount)
}
/**某知识升级的前置是否满足 */
export function meetsRequire(def: KnowledgeUpgradeDef): boolean {
  return def.require.every(([id, n]) => knowledgeAmount(id).gte(n))
}
/**某知识升级当前是否可购买(前置/条件/满级/知识足够) */
export function canBuyKnowledgeUpgrade(def: KnowledgeUpgradeDef): boolean {
  if (!meetsRequire(def)) return false
  if (!def.canBuy()) return false
  if (isMaxed(def)) return false
  return player.knowledge.gte(knowledgeCost(def.id))
}
/**某知识升级当前是否显示(满级且隐藏时不显示,前置/条件不满足时不显示) */
export function canShow(def: KnowledgeUpgradeDef, hideMaxed: boolean): boolean {
  if (isMaxed(def) && hideMaxed) return false
  if (!meetsRequire(def)) return false
  if (!def.canBuy()) return false
  return true
}
/**所有已使用的升级类别(去重,保持定义顺序) */
export function getKnowledgeCategories(): string[] {
  const cats: string[] = []
  for (const k of KNOWLEDGE_UPGRADES) {
    if (!cats.includes(k.category)) cats.push(k.category)
  }
  return cats
}
/**获取某类别的所有知识升级 */
export function getUpgradesByCategory(cat: string): KnowledgeUpgradeDef[] {
  return KNOWLEDGE_UPGRADES.filter((k) => k.category == cat)
}

//------效果注册------
/**把知识升级定义转换为注册效果(购买后生效,数量可参与公式) */
function knowledgeEffect(def: KnowledgeUpgradeDef): RegisteredEffect | undefined {
  if (!def.effect) return undefined
  return {
    ...def.effect,
    id: `knowledge-${def.id}`,
    name: def.name,
    isActive: (ctx) => def.effect!.isActive?.(ctx) ?? hasKnowledge(def.id),
  }
}

//自动注册各知识升级的数值效果
for (const def of KNOWLEDGE_UPGRADES) {
  const e = knowledgeEffect(def)
  if (e) registerEffect(e)
}

/**某知识升级的效果文字(自定义优先,否则从效果自动生成) */
export function knowledgeEffectText(def: KnowledgeUpgradeDef): string {
  if (def.effectText) return def.effectText()
  const e = knowledgeEffect(def)
  return e ? effectText(e, { pos: [0], id: 0 }) : ''
}

//------全局速度------
//加速的效果经加成管道注册,可在统计页查看明细

registerEffect({
  id: 'debug',
  name: '调试',
  target: 'psdSpeed',
  type: 'mul',
  value: () => temp.debugSpeed,
  isActive: () => temp.debugSpeed.gt(1),
  text: '全局速度 x{value}',
})

registerEffect({
  id: 'speed-boost',
  name: '加速',
  target: 'psdSpeed',
  type: 'mul',
  value: () => player.boostSpeed,
  isActive: () => player.boostSpeed.gt(1),
  text: '全局速度 x{value}',
})

/**当前全局速度(调试初始值经加成管道后的结果) */
export function getPsdSpeed(): Decimal {
  return calculate('psdSpeed', { pos: [0], id: 0 }, new Decimal(1))
}
