<script setup lang="ts">
import { formatWhole } from '@/tools/format'
import type { LayerId } from '@/data/types'
import type { UpgradeDef } from '@/compute/upgrades'
import { canBuyUpgrade, hasUpgrade, upgradeCost } from '@/compute/upgrades'
import { buyUpgrade } from '@/logic/purchase'

const props = defineProps<{
  pos: LayerId
  def: UpgradeDef
}>()
</script>
<template>
  <button
    :class="[
      'upgrade',
      hasUpgrade(props.pos, props.def.id) ? 'bought' : '',
      canBuyUpgrade(props.pos, props.def.id) ? 'affordable' : '',
    ]"
    :disabled="!canBuyUpgrade(props.pos, props.def.id)"
    @click="buyUpgrade(props.pos, props.def.id)"
  >
    <span class="text bold">{{ props.def.name }}</span>
    <span class="text">{{ props.def.description }}</span>
    <span class="text">{{ props.def.effectText(props.pos) }}</span>
    <span class="text" v-if="hasUpgrade(props.pos, props.def.id)">已购买</span>
    <span class="text" v-else>价格: {{ formatWhole(upgradeCost(props.pos, props.def.id)) }}</span>
  </button>
</template>
