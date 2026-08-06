//层级编号(序数)的纯函数运算，不依赖任何游戏状态
import type { CompareResult } from 'break_eternity.js'
import type { LayerId } from '@/data/types'
import { arrayOrder, numComp } from './utils'

//------一些定义------
//本游戏一共有ω^ω个常规层级
//每个层级的等级可由任意长数组表示：[a1,a2,...,an]=ω^{n-1}*a_1+ω^{n-2}*a_2+...+ω*a_{n-1}+a_n
//阶:若序数α<ω^ω可写成ω^n*A+ω^n，则称α的阶为n
//子层级:层级ω^n*A+ω^n的子层级定义为ω^n*A+ω^{n-1}*m
//--n阶层级的子层级为n-1阶，0阶层级(后继序数层级)没有子层级
//--受内存限制，每个层级至多存储10个子层级(5个最大的和5个最小的)，因子转换会降低这个限制
//路径层级:ω^(n+1)*A+ω^n*B的路径层级递归定义为ω^(n+1)*A和它的路径层级

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
/**
 * 获取一个层级的后继层级
 * @param n 表示层级编号增加ω^n
 * */
export function nextLayer(pos: LayerId, n: number = 0): LayerId {
  const idx = getLayerIndex(pos, n)
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
/**比较两个层级编号的大小，按序数大小排序 */
export function compareLayer(a: LayerId, b: LayerId): CompareResult {
  return arrayOrder(a, b, numComp)
}
