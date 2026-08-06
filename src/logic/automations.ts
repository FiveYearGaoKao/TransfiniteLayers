//自动化系统
//自动化类型通过注册表(AUTOMATIONS)定义，每个层级的配置相互独立
import Decimal from 'break_eternity.js'
import { player } from '@/data/player'
import { getLayer, higherLayer, prevLayer } from '@/access'
import {
  defaultAutoBuy,
  defaultAutoReset,
  type AutoBuyConfig,
  type AutoConfig,
  type AutomationDef,
  type AutoResetConfig,
  type LayerAutomation,
  type LayerId,
} from '@/data/types'
import { getLayerOrder, posArray } from '@/tools/ordinal'
import { hasUpgrade } from '@/compute/upgrades'
import { canReset, resetGain } from '@/compute/prestige'
import { getBuyables } from '@/compute/buyables'
import { buyBuyable, buyDimension } from './purchase'
import { doReset } from './reset'

//------自动化注册表------
/**所有自动化类型 */
export const AUTOMATIONS: AutomationDef[] = [
  {
    id: 'dims',
    name: '维度自动化',
    defaultCfg: () => defaultAutoBuy(),
    isUnlocked: (pos) => dimsAutoUnlocked(pos),
    isActive: (cfg) => Object.values((cfg as AutoBuyConfig).perItem).some((v) => v),
    setAll: (pos, cfg, on) => {
      const count = getLayer(pos)?.dimensions.length ?? 0
      for (let i = 0; i < count; i++) (cfg as AutoBuyConfig).perItem[i] = on
    },
    onTick: (pos, cfg) => autoBuyDims(pos, cfg as AutoBuyConfig),
  },
  {
    id: 'buyables',
    name: '可购买自动化',
    defaultCfg: () => defaultAutoBuy(),
    isUnlocked: (pos) => buyablesAutoUnlocked(pos),
    isActive: (cfg) => Object.values((cfg as AutoBuyConfig).perItem).some((v) => v),
    setAll: (pos, cfg, on) => {
      for (const b of getBuyables(getLayerOrder(pos))) {
        ;(cfg as AutoBuyConfig).perItem[b.id] = on
      }
    },
    onTick: (pos, cfg) => autoBuyBuyables(pos, cfg as AutoBuyConfig),
  },
  {
    id: 'reset',
    name: '自动重置',
    defaultCfg: () => defaultAutoReset(),
    isUnlocked: (pos) => resetAutoUnlocked(pos),
    isActive: (cfg) => (cfg as AutoResetConfig).enabled,
    setAll: (_pos, cfg, on) => {
      ;(cfg as AutoResetConfig).enabled = on
    },
    onTick: (pos, cfg) => autoReset(pos, cfg as AutoResetConfig),
  },
]

//------配置访问------
/**获取某层的自动化配置，不存在或结构缺失则创建默认 */
export function getLayerAutomation(pos: LayerId): LayerAutomation {
  const key = pos.toString()
  if (!player.automations) player.automations = {}
  let auto = player.automations[key]
  if (!auto) {
    auto = { cfgs: {} }
    player.automations[key] = auto
  }
  //旧结构(dims/buyables/reset直接字段)迁移到cfgs
  if (!auto.cfgs) {
    const old = auto as unknown as Record<string, unknown>
    auto.cfgs = {}
    if (old.dims) auto.cfgs['dims'] = old.dims as AutoConfig
    if (old.buyables) auto.cfgs['buyables'] = old.buyables as AutoConfig
    if (old.reset) auto.cfgs['reset'] = old.reset as AutoConfig
    delete old.dims
    delete old.buyables
    delete old.reset
  }
  //为每个注册的自动化补齐默认配置
  for (const def of AUTOMATIONS) {
    if (!auto.cfgs[def.id]) auto.cfgs[def.id] = def.defaultCfg()
  }
  return auto
}

//------解锁判断------
/**某层维度自动购买是否解锁(上层购买u4) */
export function dimsAutoUnlocked(pos: LayerId): boolean {
  const higher = higherLayer(pos)
  return higher ? hasUpgrade(higher, 4) : false
}
/**某层可购买自动购买是否解锁(上层购买u5) */
export function buyablesAutoUnlocked(pos: LayerId): boolean {
  const higher = higherLayer(pos)
  return higher ? hasUpgrade(higher, 5) : false
}
/**某层自动重置是否解锁(本层购买u6) */
export function resetAutoUnlocked(pos: LayerId): boolean {
  return hasUpgrade(pos, 6)
}

//------开关操作------
/**某层某维度/可购买项是否自动购买 */
export function isAutoItem(pos: LayerId, type: 'dims' | 'buyables', id: number): boolean {
  return (getLayerAutomation(pos).cfgs[type] as AutoBuyConfig | undefined)?.perItem[id] === true
}
/**切换某层某维度/可购买项的自动开关 */
export function toggleAutoItem(pos: LayerId, type: 'dims' | 'buyables', id: number) {
  const cfg = getLayerAutomation(pos).cfgs[type] as AutoBuyConfig
  cfg.perItem[id] = !cfg.perItem[id]
}
/**某层是否有自动化处于激活状态 */
export function isLayerAutoActive(pos: LayerId): boolean {
  const auto = player.automations[pos.toString()]
  if (!auto) return false
  return AUTOMATIONS.some((def) => {
    const cfg = auto.cfgs[def.id]
    return cfg ? def.isActive(cfg) : false
  })
}
/**全部层级是否有自动化处于激活状态 */
export function isAllAutoActive(): boolean {
  const keys = Object.keys(player.layers)
  return keys.some((k) => isLayerAutoActive(posArray(k)))
}
/**本层全部自动化一键开关(至少一个开→全关，全关→全开) */
export function toggleLayerAuto(pos: LayerId) {
  const auto = getLayerAutomation(pos)
  const anyOn = AUTOMATIONS.some((def) => {
    const cfg = auto.cfgs[def.id]
    return cfg ? def.isActive(cfg) : false
  })
  for (const def of AUTOMATIONS) {
    const cfg = auto.cfgs[def.id]
    if (cfg) def.setAll(pos, cfg, !anyOn)
  }
}
/**全部层级自动化一键开关 */
export function toggleAllAuto() {
  const anyOn = isAllAutoActive()
  for (const key of Object.keys(player.layers)) {
    const pos = posArray(key)
    const auto = getLayerAutomation(pos)
    for (const def of AUTOMATIONS) {
      const cfg = auto.cfgs[def.id]
      if (cfg) def.setAll(pos, cfg, !anyOn)
    }
  }
}

//------执行逻辑------
/**更新自动化系统，dt以秒为单位 */
export function updateAutomations(_dt: Decimal) {
  for (const key of Object.keys(player.layers)) {
    updateLayerAutomation(posArray(key))
  }
}
/**更新单个层级的自动化 */
function updateLayerAutomation(pos: LayerId) {
  const auto = player.automations[pos.toString()]
  if (!auto) return
  const L = getLayer(pos)
  if (!L || !L.active) return
  //收集已开启且已解锁的项，按优先级排序
  const items = AUTOMATIONS.filter((def) => {
    if (!def.isUnlocked(pos)) return false
    const cfg = auto.cfgs[def.id]
    if (!cfg) return false
    return def.isActive(cfg)
  }).sort((a, b) => (auto.cfgs[a.id]?.priority ?? 0) - (auto.cfgs[b.id]?.priority ?? 0))
  for (const def of items) {
    const cfg = auto.cfgs[def.id]
    if (cfg) def.onTick(pos, cfg)
  }
}
/**自动购买维度 */
function autoBuyDims(pos: LayerId, cfg: AutoBuyConfig) {
  const L = getLayer(pos)
  if (!L) return
  let remaining = L.points.mul(cfg.percent).div(100)
  if (remaining.lt(1)) return
  const ids: number[] = []
  for (let i = 0; i < L.dimensions.length; i++) {
    if (cfg.perItem[i] === true) ids.push(i)
  }
  if (cfg.order == 'desc') ids.reverse()
  for (const id of ids) {
    if (remaining.lt(1)) break
    const amount = cfg.buyAmount == 'max' ? Decimal.dInf : new Decimal(1)
    const spent = buyDimension(pos, id, amount, remaining)
    //买不起时继续尝试下一个(价格可能不同)
    remaining = remaining.sub(spent)
  }
}
/**自动购买可购买 */
function autoBuyBuyables(pos: LayerId, cfg: AutoBuyConfig) {
  const L = getLayer(pos)
  if (!L) return
  let remaining = L.points.mul(cfg.percent).div(100)
  if (remaining.lt(1)) return
  const ids = getBuyables(getLayerOrder(pos))
    .filter((b) => cfg.perItem[b.id] === true)
    .map((b) => b.id)
  if (cfg.order == 'desc') ids.reverse()
  for (const id of ids) {
    if (remaining.lt(1)) break
    const amount = cfg.buyAmount == 'max' ? Decimal.dInf : new Decimal(1)
    const spent = buyBuyable(pos, id, amount, remaining)
    //买不起时继续尝试下一个(价格可能不同)
    remaining = remaining.sub(spent)
  }
}
/**自动重置 */
function autoReset(pos: LayerId, cfg: AutoResetConfig) {
  const L = getLayer(pos)
  if (!L) return
  const gain = resetGain(pos)
  const conditions: boolean[] = []
  //重置该层会清空下层(prevLayer)，因此时间条件以prevLayer的重置计时为准
  if (cfg.useTime) {
    const prevL = getLayer(prevLayer(pos))
    if (prevL) conditions.push(prevL.resetTime.gte(cfg.time))
  }
  if (cfg.usePoint) conditions.push(gain.gte(cfg.point))
  if (cfg.useMult) conditions.push(gain.gte(L.points.mul(cfg.mult).max(1)))
  if (conditions.length == 0) return
  const ok = cfg.combine == 'all' ? conditions.every((c) => c) : conditions.some((c) => c)
  if (ok && canReset(pos)) doReset(pos)
}
