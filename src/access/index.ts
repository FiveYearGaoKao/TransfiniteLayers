//只读访问层级数据(以及少量写入维度的便捷函数)
import Decimal, { type DecimalSource } from 'break_eternity.js'
import { player } from '@/data/player'
import { type Layer, type LayerId, type _Layer } from '@/data/types'
import { formatWhole } from '@/tools/format'
import { getLayerIndex, getLayerOrder, isLayer0, posArray, shiftLayer } from '@/tools/ordinal'
import { temp } from '@/temp'

/**获取某一层的引用 */
export function getLayer(pos: LayerId | string): Layer | undefined {
  const pos1 = pos.toString()
  if (pos1.indexOf('-1') >= 0) return temp.tempLayers[pos1] || undefined
  else return player.layers[pos1] || undefined
}

/**判断某层是否启用 */
export function isActive(pos: LayerId): boolean {
  return getLayer(pos)?.active || false
}
/**
 * 获取层级的名称
 * @param hide 最后多少位用星号"*"代替,至少有hide个星号
 */
export function getLayerName(pos: LayerId, hide: number = 0): string {
  const l = pos.length
  const layerNames: string[] = new Array(Math.max(l, hide)).fill('*')
  const pos1: LayerId = new Array(l).fill(0)
  for (let i = 0; i < l - hide; ++i) {
    if (pos[i] != 0) {
      pos1[i] = pos[i] || 0
      const layer1 = getLayer(pos1)
      if (layer1 == undefined) {
        //如果任意一个父层级不存在，则返回层级未解锁
        return '层级未解锁'
      } else {
        layerNames[i] = formatWhole(layer1.level)
      }
    } else {
      layerNames[i] = '0'
    }
  }
  return '层级' + layerNames.join(',')
}

/**获取某个层级的点数，层级0的点数即玩家的总点数 */
export function getPoints(pos: LayerId): Decimal {
  return getLayer(pos)?.points || new Decimal(0)
}
/**获取某个层级的能量，层级0的能量恒为0 */
export function getEnergy(pos: LayerId): Decimal {
  if (isLayer0(pos)) return new Decimal(0)
  return getLayer(pos)?.energy || new Decimal(0)
}
/**
 * 获取某维度的数量
 * @param type 0表示总数，1表示购买数量
 */
export function dimensionAmount(layer: _Layer, id: number, type: number = 0): Decimal {
  if (layer instanceof Array) layer = getLayer(layer)
  return layer?.dimensions[id]?.[type] || new Decimal(0)
}
/**
 * 增加某维度的数量
 * @param type 0表示总数，1表示购买数量
 */
export function addAmount(layer: _Layer, id: number, amount: DecimalSource, type: number = 0) {
  if (layer instanceof Array) layer = getLayer(layer)
  const dim = layer?.dimensions[id]
  if (dim) dim[type] = dimensionAmount(layer, id, type).add(amount)
}
/**获取某层所有维度的已购买数量总和 */
export function dimensionTotalBought(layer: _Layer): Decimal {
  const L = layer instanceof Array ? getLayer(layer) : layer
  if (!L) return new Decimal(0)
  let total = new Decimal(0)
  for (let i = 0; i < L.dimensions.length; ++i) {
    const dim = L.dimensions[i]
    if (dim) total = total.add(dim[1])
  }
  return total
}
/**获取某层所有可购买的已购买数量总和 */
export function buyableTotalBought(layer: _Layer): Decimal {
  const L = layer instanceof Array ? getLayer(layer) : layer
  if (!L) return new Decimal(0)
  let total = new Decimal(0)
  for (const key of Object.keys(L.buyables)) {
    total = total.add(L.buyables[Number(key)] || 0)
  }
  return total
}
/**获取序数进制 */
export function getBase(): number {
  return player.base
}
/**获取编号最大的形如pos+ω^n*k的层级 */
export function highestActiveLayer(pos: LayerId, n: number = 0): LayerId {
  let k = player.base - 1
  let pos1: LayerId = shiftLayer(pos, n, 0)
  while (k >= 0) {
    pos1 = shiftLayer(pos, n, k)
    if (isActive(pos1)) break
    k--
  }
  return pos1
}
/**获取一个层级的前驱层级 */
export function prevLayer(pos: LayerId): LayerId {
  const n = getLayerOrder(pos)
  const idx = getLayerIndex(pos, n)
  if (idx > 0) {
    return shiftLayer(pos, n, idx - 1)
  } else if (idx < 0) {
    return highestActiveLayer(pos, n)
  } else {
    return pos.slice()
  }
}
/**获取层级在层级链中的深度(从层级0沿prevLayer数) */
export function getLayerDepth(pos: LayerId): number {
  let depth = 0
  let p = pos
  while (!isLayer0(p)) {
    const prev = prevLayer(p)
    if (prev.toString() == p.toString()) break
    p = prev
    depth++
  }
  return depth
}
/**获取以pos为下层的上层层级(游戏当前为线性链，至多一个) */
export function higherLayer(pos: LayerId): LayerId | undefined {
  for (const key of Object.keys(player.layers)) {
    const p = posArray(key)
    if (p.toString() == pos.toString()) continue
    if (prevLayer(p).toString() == pos.toString()) return p
  }
  return undefined
}
/**是否有任意层购买了指定升级 */
export function hasAnyUpgrade(id: number): boolean {
  for (const key of Object.keys(player.layers)) {
    if (getLayer(posArray(key))?.upgrades.includes(id)) return true
  }
  return false
}
/**是否已解锁指定成就 */
export function hasAchievement(id: string): boolean {
  return player.achievements.includes(id)
}
