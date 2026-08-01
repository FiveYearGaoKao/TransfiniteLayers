//关于层级读写的一些函数
import { player } from '@/player'
import Decimal from 'break_eternity.js'
import { initializeLayer, type Layer, type LayerId, type LayerList } from './types'
import { formatWhole } from '@/format'
import { reactive } from 'vue'

//------一些定义------
//本游戏一共有ω^ω个常规层级
//每个层级的等级可由任意长数组表示：[a1,a2,...,an]=ω^{n-1}*a_1+ω^{n-2}*a_2+...+ω*a_{n-1}+a_n
//阶:若序数α<ω^ω可写成ω^n*A+ω^n，则称α的阶为n
//子层级:层级ω^n*A+ω^n的子层级定义为ω^n*A+ω^{n-1}*m
//--n阶层级的子层级为n-1阶，0阶层级(后继序数层级)没有子层级
//--受内存限制，每个层级至多存储10个子层级(5个最大的和5个最小的)，因子转换会降低这个限制
//路径层级:ω^(n+1)*A+ω^n*B的路径层级递归定义为ω^(n+1)*A和它的路径层级

/**临时层级(每层的即将被插入的层级) */
export const tempLayers = reactive({} as LayerList)

/**将字符串转化为坐标数组 */
export function posArray(str: string): LayerId {
  return str.split(',').map((x) => parseInt(x))
}
/**
 * 对层级编号进行偏移
 * 具体来说，将pos的右边第order位改为value,并将这一位以后设为0
 * @returns 偏移后的层级编号，其阶至少为order
 */
export function shiftLayer(pos: LayerId, order: number, value: number): LayerId {
  const l = pos.length
  if (order >= l - 1) {
    if (value == 0) return [0]
    else {
      const res: LayerId = new Array(order + 1).fill(0)
      res[0] = value
      return res
    }
  } else {
    const res = pos.slice()
    res[l - order - 1] = value
    for (let i = l - order; i < l; ++i) {
      res[i] = 0
    }
    return res
  }
}
/**获取一个层级的前驱层级 */
export function prevLayer(pos: LayerId): LayerId {
  let n = getLayerOrder(pos)
  let idx = getLayerIndex(pos, n)
  if (idx > 0) {
    return shiftLayer(pos, n, idx - 1)
  } else if (idx < 0) {
    return highestActiveLayer(pos, n)
  } else {
    return pos.slice()
  }
}
/**
 * 获取一个层级的后继层级
 * @param n 表示层级编号增加ω^n
 * */
export function nextLayer(pos: LayerId, n: number = 0): LayerId {
  let idx = getLayerIndex(pos, n)
  return shiftLayer(pos, n, idx + 1)
}

/**获取层级从右往左数某一位 */
export function getLayerIndex(pos: LayerId, n: number): number {
  return pos[pos.length - n - 1] || 0
}
/**判断是否为层级0 */
export function isLayer0(pos: LayerId): boolean {
  return pos.every((x) => x == 0)
}
/**获取一个层级的阶 */
export function getLayerOrder(pos: LayerId): number {
  const i = pos.findLastIndex((x) => x > 0)
  return i < 0 ? 0 : pos.length - i - 1
}

/**获取某一层的引用 */
export function getLayer(pos: LayerId | string): Layer | undefined {
  let pos1 = pos.toString()
  if (pos1.indexOf('-1') >= 0) return tempLayers[pos1] || undefined
  else return player.layers[pos1] || undefined
}

/**判断某层是否启用 */
export function isActive(pos: LayerId): boolean {
  return getLayer(pos)?.active || false
}
/**如果某层不存在，则尝试添加一个空白层级 */
function addLayer(pos: LayerId, level: Decimal) {
  if (getLayer(pos) == undefined) {
    player.layers[pos.toString()] = initializeLayer(level)
  }
}
/**
 * 删除一个层级(层级0永远不会删除)
 * 并不是真正的删除，只是将其设为null
 */
function removeLayer(pos: LayerId) {
  if (!isLayer0(pos)) player.layers[pos.toString()] = null
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
