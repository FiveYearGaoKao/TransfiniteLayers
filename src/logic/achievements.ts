//成就注册表
import Decimal, { type DecimalSource } from 'break_eternity.js'
import { player } from '@/data/player'
import {
  dimensionAmount,
  getEnergy,
  getLayer,
  getPoints,
  hasAchievement,
  hasAnyUpgrade,
} from '@/access'
import { buyableAmount } from '@/compute/buyables'
import { dimensionMultiplier } from '@/compute/dimensions'
import { KNOWLEDGE_UNLOCK_AMOUNT } from '@/data/constants'
import { registerEffect, type EffectDef, type RegisteredEffect } from '@/compute/effects'
import { addLog } from '@/log'
import type { LayerId } from '@/data/types'
import { compareLayer } from '@/tools/ordinal'

/**成就定义 */
export interface AchievementDef {
  id: string
  name: string
  description: string
  /**知识奖励 */
  reward: number
  /**数值效果(声明式,解锁后全局生效) */
  effect?: EffectDef
  /**额外效果的文字说明(tooltip第二行) */
  effectText?: string
  /**是否达成 */
  isCompleted(): boolean
  /**在层L重置取得gain时的判定(仅用于只在重置瞬间成立的成就) */
  onReset?(layer: LayerId, gain: DecimalSource): boolean
}

const achievements: AchievementDef[] = [
  {
    id: 'a11',
    name: '第一桶金',
    description: '购买层级0维度1',
    reward: 1,
    isCompleted: () => dimensionAmount([0], 0, 1).gte(1),
  },
  {
    id: 'a12',
    name: '梅开二度',
    description: '购买层级0维度2',
    reward: 1,
    isCompleted: () => dimensionAmount([0], 1, 1).gte(1),
  },
  {
    id: 'a13',
    name: '三生万物',
    description: '购买层级0维度3',
    reward: 1,
    isCompleted: () => dimensionAmount([0], 2, 1).gte(1),
  },
  {
    id: 'a14',
    name: '四维时空',
    description: '购买层级0维度4',
    reward: 1,
    isCompleted: () => dimensionAmount([0], 3, 1).gte(1),
  },
  {
    id: 'a15',
    name: '后面没了?',
    description: '购买4个层级0维度4',
    reward: 2,
    isCompleted: () => dimensionAmount([0], 3, 1).gte(4),
  },
  {
    id: 'a16',
    name: '转生!',
    description: '获得至少1个层级1点数',
    reward: 2,
    effectText: '解锁升级：额外加速器',
    isCompleted: () => getPoints([1]).gte(1),
  },
  {
    id: 'a17',
    name: '充满力量',
    description: '获得至少100层级1能量',
    reward: 2,
    isCompleted: () => getEnergy([1]).gte(100),
  },
  {
    id: 'a18',
    name: '还是维度?',
    description: '购买层级1维度2',
    reward: 2,
    isCompleted: () => dimensionAmount([1], 1, 1).gte(1),
  },
  {
    id: 'a21',
    name: '解放双手',
    description: '解锁全部类型的自动化',
    reward: 3,
    isCompleted: () => hasAnyUpgrade(4) && hasAnyUpgrade(5) && hasAnyUpgrade(6),
  },
  {
    id: 'a22',
    name: '加速器满仓',
    description: '购买至少75个层级0加速器',
    reward: 3,
    effectText: '解锁可购买：加速器加成',
    isCompleted: () => buyableAmount([0], 11).gte(75),
  },
  {
    id: 'a23',
    name: '反客为主1',
    description: '在层级0中，使维度1的乘数<维度2的乘数<...<维度4的乘数',
    reward: 3,
    isCompleted: () =>
      [0, 1, 2].every((x) => dimensionMultiplier([0], x).lt(dimensionMultiplier([0], x + 1))),
    effect: {
      target: 'dimensionMult',
      type: 'mul',
      value: (ctx) => ctx.id + 1,
      text: '维度乘数 x{value}',
    },
    effectText: '使每个维度获得等于其编号的乘数',
  },
  {
    id: 'a24',
    name: '速通高手',
    description: '在1秒内进行层级1的重置',
    reward: 4,
    effectText: '每层重置后保留1点数',
    isCompleted: () => false,
    onReset: (layer) => compareLayer(layer, [1]) == 0 && (getLayer([0])?.resetTime.lt(1) ?? false),
  },
  {
    id: 'a25',
    name: '转生，再一次',
    description: '获得至少1个层级2点数',
    reward: 5,
    isCompleted: () => getPoints([2]).gte(1),
  },
  {
    id: 'a26',
    name: '能量过载',
    description: '拥有至少1e16层级1能量',
    reward: 6,
    isCompleted: () => getEnergy([1]).gte(1e16),
  },
  {
    id: 'a27',
    name: '我需要能量吗',
    description: '在没有层级1能量时一次性获得100层级1点数',
    reward: 8,
    isCompleted: () => false,
    onReset: (layer, gain) =>
      compareLayer(layer, [1]) == 0 && getEnergy([1]).lte(0) && new Decimal(gain).gte(100),
    effect: {
      target: 'energy:base',
      type: 'add',
      value: () => 0.02,
      text: '能量加成指数 +{value}',
    },
    effectText: '能量加成指数+0.02',
  },
  {
    id: 'a28',
    name: 'Googol',
    description: '拥有至少1e100层级0点数',
    reward: 10,
    isCompleted: () => getPoints([0]).gte(1e100),
    effectText: '解锁挑战',
  },
]

/**注册一个成就 */
export function registerAchievement(def: AchievementDef) {
  achievements.push(def)
  const e = achievementEffect(def)
  if (e) registerEffect(e)
}

/**获取所有成就 */
export function getAchievements(): AchievementDef[] {
  return achievements
}

/**已解锁成就的数量 */
export function getAchievementCount(): number {
  return player.achievements.length
}

/**解锁一个成就并发放知识奖励 */
function unlockAchievement(def: AchievementDef) {
  player.achievements.push(def.id)
  player.knowledge = player.knowledge.add(def.reward)
  addLog('progress', `已解锁成就：${def.name}`)
}

/**把成就定义转换为注册效果(解锁后全局生效) */
function achievementEffect(def: AchievementDef): RegisteredEffect | undefined {
  if (!def.effect) return undefined
  return {
    ...def.effect,
    id: `achievement-${def.id}`,
    name: def.name,
    isActive: () => hasAchievement(def.id),
  }
}

//自动注册各成就的数值效果
for (const a of achievements) {
  const e = achievementEffect(a)
  if (e) registerEffect(e)
}

/**检查所有未解锁成就，达成则解锁并获得知识奖励 */
export function updateAchievements() {
  for (const def of achievements) {
    if (!player.achievements.includes(def.id) && def.isCompleted()) unlockAchievement(def)
  }
  //知识达到一定数量后永久解锁知识标签
  if (!player.knowledgeUnlocked && player.knowledge.gte(KNOWLEDGE_UNLOCK_AMOUNT)) {
    player.knowledgeUnlocked = true
  }
}

/**检查所有重置瞬间成就(在doReset中调用,此时尚未清空能量/重置时间) */
export function checkResetAchievements(layer: LayerId, gain: DecimalSource) {
  for (const def of achievements) {
    if (!player.achievements.includes(def.id) && def.onReset?.(layer, gain)) unlockAchievement(def)
  }
}
