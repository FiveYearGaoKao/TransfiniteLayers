//价格软上限
//维度与加速器价格达到阈值后,对价格对数做幂次放大呈超指数增长;阈值可被挑战奖励(C4)提升以延迟软上限
import Decimal from 'break_eternity.js'
import { softCapValue } from '@/tools/softCap'
import { slotValue } from './effects'

/**软上限的基准阈值 */
const SOFT_CAP_BASE = 1e100
/**软上限后的对数幂次 */
const SOFT_CAP_EXP = 2

/**当前软上限阈值(被C4奖励等效果修饰) */
export function softCapThreshold(): Decimal {
  return slotValue({ target: 'softCap:base', init: () => SOFT_CAP_BASE }, { pos: [0], id: 0 })
}

/**对价格应用软上限:低于阈值不处理,高于阈值价格呈超指数增长 */
export function softCap(value: Decimal, power = SOFT_CAP_EXP): Decimal {
  return softCapValue(value, softCapThreshold(), power)
}
