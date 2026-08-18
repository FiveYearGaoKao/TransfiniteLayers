<script setup lang="ts">
import { format, formatWhole } from '@/tools/format'
import type { KnowledgeUpgradeDef } from '@/compute/knowledge'
import {
  canBuyKnowledgeUpgrade,
  isMaxed,
  knowledgeAmount,
  knowledgeCost,
  knowledgeEffectText,
} from '@/compute/knowledge'
import { buyKnowledgeUpgrade } from '@/logic/knowledge'

const props = defineProps<{
  def: KnowledgeUpgradeDef
}>()
/**是否已满级 */
const maxed = () => isMaxed(props.def)
/**是否可购买 */
const affordable = () => canBuyKnowledgeUpgrade(props.def)
/**效果文字 */
const effectText = () => knowledgeEffectText(props.def)
/**购买1个 */
function buyOne() {
  buyKnowledgeUpgrade(props.def.id, 1)
}
/**购买至多maxAmount个 */
function buyMax() {
  buyKnowledgeUpgrade(props.def.id, props.def.maxAmount)
}
</script>
<template>
  <div class="knowledgeItem">
    <span class="text bold"
      >{{ props.def.name }}({{ formatWhole(knowledgeAmount(props.def.id)) }}/{{
        formatWhole(props.def.maxAmount)
      }})</span
    >
    <span class="text">{{ props.def.description }}</span>
    <span class="text" v-if="effectText()">{{ effectText() }}</span>
    <div class="row tight">
      <button
        :class="['buyable', maxed() ? 'bought' : '', affordable() ? 'affordable' : '']"
        :disabled="!affordable() && !maxed()"
        @click="buyOne()"
      >
        {{ maxed() ? '已满级' : `价格:${format(knowledgeCost(props.def.id))}知识` }}
      </button>
      <button
        v-if="!maxed() && props.def.maxAmount.gt(1)"
        :class="['buyable', affordable() ? 'affordable' : '']"
        :disabled="!affordable()"
        @click="buyMax()"
      >
        买最大
      </button>
    </div>
  </div>
</template>
<style scoped>
div.knowledgeItem {
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 2px solid var(--dim);
  padding: 4px;
  gap: 4px;
  width: 190px;
}
</style>
