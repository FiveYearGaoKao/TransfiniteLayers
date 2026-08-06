//成就注册表
import { player } from '@/data/player'
import { dimensionAmount, getLayer, hasAnyUpgrade } from '@/access'
import { KNOWLEDGE_UNLOCK_AMOUNT } from '@/data/constants'
import { addLog } from '@/log'

/**成就定义 */
export interface AchievementDef {
  id: string
  name: string
  description: string
  /**知识奖励 */
  reward: number
  /**是否达成 */
  isCompleted(): boolean
}

const achievements: AchievementDef[] = []

/**注册一个成就 */
export function registerAchievement(def: AchievementDef) {
  achievements.push(def)
}

/**获取所有成就 */
export function getAchievements(): AchievementDef[] {
  return achievements
}

/**已解锁成就的数量 */
export function getAchievementCount(): number {
  return player.achievements.length
}

/**检查所有未解锁成就，达成则解锁并获得知识奖励 */
export function updateAchievements() {
  for (const def of achievements) {
    if (!player.achievements.includes(def.id) && def.isCompleted()) {
      player.achievements.push(def.id)
      player.knowledge = player.knowledge.add(def.reward)
      addLog('progress', `已解锁成就：${def.name}`)
    }
  }
  //知识达到一定数量后永久解锁知识标签
  if (!player.knowledgeUnlocked && player.knowledge.gte(KNOWLEDGE_UNLOCK_AMOUNT)) {
    player.knowledgeUnlocked = true
  }
}

//------成就注册------
registerAchievement({
  id: 'a11',
  name: '第一桶金',
  description: '购买层级0维度1',
  reward: 1,
  isCompleted: () => dimensionAmount([0], 0, 1).gte(1),
})
registerAchievement({
  id: 'a12',
  name: '梅开二度',
  description: '购买层级0维度2',
  reward: 1,
  isCompleted: () => dimensionAmount([0], 1, 1).gte(1),
})
registerAchievement({
  id: 'a13',
  name: '三生万物',
  description: '购买层级0维度3',
  reward: 1,
  isCompleted: () => dimensionAmount([0], 2, 1).gte(1),
})
registerAchievement({
  id: 'a14',
  name: '四维时空',
  description: '购买层级0维度4',
  reward: 1,
  isCompleted: () => dimensionAmount([0], 3, 1).gte(1),
})
registerAchievement({
  id: 'a15',
  name: '后面没了?',
  description: '拥有3个层级0维度4',
  reward: 2,
  isCompleted: () => dimensionAmount([0], 3, 0).gte(3),
})
registerAchievement({
  id: 'a16',
  name: '转生!',
  description: '获得至少1个层级1点数',
  reward: 2,
  isCompleted: () => getLayer([1])?.points.gte(1) || false,
})
registerAchievement({
  id: 'a17',
  name: '充能',
  description: '获得至少100层级1能量',
  reward: 2,
  isCompleted: () => getLayer([1])?.energy.gte(100) || false,
})
registerAchievement({
  id: 'a18',
  name: '解放双手',
  description: '解锁自动化(购买u4)',
  reward: 3,
  isCompleted: () => hasAnyUpgrade(4),
})
