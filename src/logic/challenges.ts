//挑战注册表
import Decimal from 'break_eternity.js'
import type { Layer, LayerId } from '@/data/types'
import type { EffectModifier } from '@/compute/effects'

/**挑战的所属重置层，'normal'为常规层级，其余为元层id */
export type ChallengeLayer = 'normal' | string

/**挑战定义 */
export interface ChallengeDef {
  id: string
  /**所属重置层，决定在挑战页面的哪个子标签页显示 */
  layer: ChallengeLayer
  /**进入挑战时执行重置的对象，元层格式为{meta:'infinity'} */
  resetTarget: LayerId | { meta: string }
  /**挑战期间生效的静态加成 */
  effects: EffectModifier[]
  /**是否已解锁 */
  isUnlocked(): boolean
  /**完成目标 */
  goal(): Decimal
  /**完成奖励 */
  reward(): Decimal
  /**是否已完成 */
  isCompleted(): boolean
}

const challenges: ChallengeDef[] = []

/**注册一个挑战 */
export function registerChallenge(def: ChallengeDef) {
  challenges.push(def)
}

/**获取某重置层的所有挑战 */
export function getChallenges(layer: ChallengeLayer): ChallengeDef[] {
  return challenges.filter((c) => c.layer == layer)
}

/**应用当前激活挑战的动态效果(如每帧损失)，默认无效果 */
export function applyChallengeEffects(_layer: Layer, _pos: LayerId, _dt: Decimal): void {}
