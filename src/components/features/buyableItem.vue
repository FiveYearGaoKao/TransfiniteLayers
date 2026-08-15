<script setup lang="ts">
import { formatWhole } from '@/tools/format'
import type { LayerId } from '@/data/types'
import type { BuyableDef } from '@/compute/buyables'
import {
  buyableAmount,
  buyableCost,
  buyableDescription,
  buyableEffectText,
  buyableFreeLevels,
  canBuyBuyable,
} from '@/compute/buyables'
import { buyBuyable } from '@/logic/purchase'
import { buyablesAutoUnlocked, isAutoItem, toggleAutoItem } from '@/logic/automations'

const props = defineProps<{
  pos: LayerId
  def: BuyableDef
}>()
/**已购等级 */
const bought = () => buyableAmount(props.pos, props.def.id)
/**免费等级 */
const free = () => buyableFreeLevels(props.pos, props.def.id)
/**描述(支持模板) */
const description = () => buyableDescription(props.def, props.pos)
/**总效果文字 */
const effectText = () => buyableEffectText(props.def, props.pos)
</script>
<template>
  <div class="buyableItem">
    <div class="buyableInfo">
      <span class="text name">{{ props.def.name }}({{ formatWhole(bought()) }}<template
          v-if="free().gt(0)"
          ><span class="freeLevel">+{{ formatWhole(free()) }}</span></template
        >)</span
      >
      <span class="text">{{ description() }}</span>
      <span class="text">{{ effectText() }}</span>
    </div>
    <div class="row">
      <button
        :class="['buyable', canBuyBuyable(props.pos, props.def.id) ? 'affordable' : '']"
        @click="buyBuyable(props.pos, props.def.id)"
      >
        价格: {{ formatWhole(buyableCost(props.pos, props.def.id)) }}
      </button>
      <button
        v-if="buyablesAutoUnlocked(props.pos)"
        :class="[
          'toggle',
          isAutoItem(props.pos, 'buyables', props.def.id) ? 'toggle-on' : 'toggle-off',
        ]"
        @click="toggleAutoItem(props.pos, 'buyables', props.def.id)"
      >
        自动:{{ isAutoItem(props.pos, 'buyables', props.def.id) ? '开' : '关' }}
      </button>
    </div>
  </div>
</template>
<style scoped>
div.buyableItem {
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 2px solid var(--dim);
  padding: 4px;
  gap: 4px;
}
div.buyableInfo {
  display: flex;
  flex-direction: column;
  align-items: center;
}
span.name {
  font-size: 16px;
}
div.row {
  display: flex;
  flex-direction: row;
  gap: 2px;
}
button.buyable {
  width: 88px;
  height: 26px;
  font-size: 11px;
}
button.toggle {
  width: 72px;
  min-width: 0;
  padding: 0 4px;
  height: 26px;
  font-size: 11px;
}
</style>
