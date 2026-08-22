<script setup lang="ts">
import { computed } from 'vue'
import type { LayerId } from '@/data/types'
import { getLayer, getLayerRows } from '@/access'

const props = defineProps<{
  modelValue: LayerId
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: LayerId): void
}>()

/**层级选择表(与快捷键循环共用同一矩阵,见access.getLayerRows) */
const layerList = computed(() => getLayerRows(props.modelValue))

/**选择层级 */
function select(pos: LayerId) {
  emit('update:modelValue', pos)
}
</script>
<template>
  <div class="layerSelect">
    <div class="subtabRow" v-for="(row, ri) in layerList" :key="ri">
      <template v-for="(col, ci) in row" :key="ci">
        <button
          :class="{ subTab: true, selected: col.selected }"
          v-if="getLayer(col.pos)"
          @click="select(col.pos)"
        >
          {{ col.name }}
        </button>
      </template>
    </div>
  </div>
</template>
<style scoped>
div.layerSelect {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
</style>
