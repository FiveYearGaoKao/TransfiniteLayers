//知识购买行为
import Decimal, { type DecimalSource } from 'break_eternity.js'
import { player } from '@/data/player'
import { addValue } from '@/save/save'
import { KNOWLEDGE_TIME_RATE } from '@/data/constants'
import {
  canBuyKnowledgeUpgrade,
  getKnowledgeUpgrade,
  knowledgeAmount,
  type KnowledgeUpgradeDef,
} from '@/compute/knowledge'
import { maxBuyable, sumCost, type BuyableItem } from '@/compute/buying'

/**知识升级作为可购买项(复用统一的购买数量计算) */
function knowledgeItem(def: KnowledgeUpgradeDef): BuyableItem {
  return {
    amount: () => knowledgeAmount(def.id),
    cost: (n: Decimal) => def.cost(n),
  }
}
/**
 * 购买知识升级
 * @param amount 一次性购买的数量上限,默认1
 * @returns 实际花费的知识
 */
export function buyKnowledgeUpgrade(id: string, amount: DecimalSource = 1): Decimal {
  const def = getKnowledgeUpgrade(id)
  if (!def || !canBuyKnowledgeUpgrade(def)) return new Decimal(0)
  const item = knowledgeItem(def)
  const n = Decimal.min(
    Decimal.min(new Decimal(amount), maxBuyable(item, player.knowledge)),
    def.maxAmount.sub(item.amount()),
  )
  if (n.lte(0)) return new Decimal(0)
  const cost = sumCost(item, n)
  if (cost.gt(player.knowledge)) return new Decimal(0)
  player.knowledge = player.knowledge.sub(cost)
  player.knowledgeUpgrades[id] = item.amount().add(n)
  return cost
}
/**
 * 用知识购买离线时间
 * @param seconds 购买的离线时间(秒),按1知识=1分钟折算
 * @returns 实际花费的知识
 */
export function buyOfflineTime(seconds: DecimalSource): Decimal {
  const s = new Decimal(seconds)
  if (s.lt(1)) return new Decimal(0)
  const cost = s.div(KNOWLEDGE_TIME_RATE)
  if (player.knowledge.lt(cost)) return new Decimal(0)
  player.knowledge = player.knowledge.sub(cost)
  addValue('offlineTime', s)
  return cost
}
