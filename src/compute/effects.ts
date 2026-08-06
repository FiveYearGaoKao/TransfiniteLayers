//加成效果管道
//所有数值点的加成统一通过这里应用，新机制只需注册修改器，无需改动核心公式
import Decimal, { type DecimalSource } from 'break_eternity.js'
import type { LayerId } from '@/data/types'

/**加成作用的数值点 */
export type EffectTarget =
  | 'dimensionCost'
  | 'dimensionMult'
  | 'dimensionExponent'
  | 'production'
  | 'pointsGain'
  | 'resetGain'
  | 'upgradeCost'

/**计算加成时的上下文 */
export interface EffectContext {
  pos: LayerId
  id: number
}

/**一个加成修改器，apply将当前值映射为加成后的值 */
export interface EffectModifier {
  id: string
  /**用于显示的名称，可省略 */
  name?: string
  /**应用顺序，值越小越先应用 */
  order: number
  apply(value: Decimal, ctx: EffectContext): Decimal
}

/**已注册的加成修改器 */
const registered: Partial<Record<EffectTarget, EffectModifier[]>> = {}

/**注册一个加成修改器 */
export function registerEffect(target: EffectTarget, modifier: EffectModifier) {
  const list = (registered[target] ||= [])
  list.push(modifier)
  list.sort((a, b) => a.order - b.order)
}

/**按注册顺序应用某个数值点的所有加成 */
export function calculate(target: EffectTarget, ctx: EffectContext, base: DecimalSource): Decimal {
  let value = new Decimal(base)
  for (const modifier of registered[target] || []) {
    value = modifier.apply(value, ctx)
  }
  return value
}

/**获取某个数值点已注册的所有加成修改器 */
export function getEffects(target: EffectTarget): EffectModifier[] {
  return registered[target] || []
}
