<script setup lang="ts">
import { format, formatWhole } from '@/format'
import { getLayer, getLayerIndex, getLayerName, isLayer0, shiftLayer } from '@/layers'
import {
  buyDimension,
  canAfford,
  dimensionCost,
  dimensionExponent,
  dimensionMultiplier,
} from '@/layers/dimensions'
import { dimensionAmount } from '@/layers/easyAccess'
import { canReset, doReset, resetGain } from '@/layers/prestige'
import { player } from '@/player'
import { addValue } from '@/save'
import { computed } from 'vue'
interface layerName {
  pos: number[]
  name: string
  selected: boolean
}
/**层级表显示的所有层级 */
let layerList = computed(() => {
  const res: layerName[][] = []
  for (let i = player.layerDepth - 1; i >= 0; --i) {
    const layerRow: layerName[] = []
    for (let j = 0; j <= player.base; ++j) {
      let k = j < player.base ? j : -1
      const pos = shiftLayer(player.layerSubtab, i, k)
      layerRow.push({
        pos: pos,
        name: getLayerName(pos, i),
        selected: k == getLayerIndex(player.layerSubtab, i),
      })
    }
    res.push(layerRow)
  }
  //console.log('layerList Updated')
  return res
})
/**当前选择的层级 */
let selectedLayer = computed(() => {
  return getLayer(player.layerSubtab)
})
</script>
<template>
  <div id="layers" style="height: 100%">
    <div v-for="i in layerList">
      <template v-for="j in i">
        <button
          :class="{ subTab: true, selected: j.selected }"
          v-if="getLayer(j.pos)"
          @click="player.layerSubtab = j.pos"
        >
          {{ j.name }}
        </button>
      </template>
    </div>
    <button
      :class="{ prestige: true, affordable: canReset(player.layerSubtab) }"
      v-if="!isLayer0(player.layerSubtab)"
      @click="doReset(player.layerSubtab)"
    >
      +{{ resetGain(player.layerSubtab) }} {{ getLayerName(player.layerSubtab) }}点数
    </button>

    <span v-if="!isLayer0(player.layerSubtab)" class="text"
      >你有<span class="text-highlight">{{ formatWhole(selectedLayer?.points ?? 0) }} </span
      >{{ getLayerName(player.layerSubtab) }}点数
    </span>
    <span v-if="!isLayer0(player.layerSubtab)" class="text"
      >你有<span class="text-highlight">{{ format(selectedLayer?.energy ?? 0) }} </span
      >{{ getLayerName(player.layerSubtab) }}能量
    </span>

    <br />
    <template v-for="i in 4">
      <div class="dimensionItem" :class="{ even: i % 2 == 0, odd: i % 2 == 1 }">
        <div>
          <span class="text">{{ getLayerName(player.layerSubtab) }}维度{{ i }}</span>
          <span class="text"
            >x{{ format(dimensionMultiplier(player.layerSubtab, i - 1), 3) }} ^{{
              format(dimensionExponent(player.layerSubtab, i - 1), 3)
            }}</span
          >
        </div>
        <div>
          <span class="text"
            >{{ format(dimensionAmount(selectedLayer, i - 1)) }}({{
              formatWhole(dimensionAmount(selectedLayer, i - 1, 1))
            }})
          </span>
        </div>
        <div>
          <button
            :class="{ buyable: true, affordable: canAfford(player.layerSubtab, i - 1) }"
            @click="buyDimension(player.layerSubtab, i - 1)"
          >
            价格: {{ formatWhole(dimensionCost(player.layerSubtab, i - 1)) }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>
<style scoped>
div#layers {
  display: flex;
  flex-direction: column;
  align-items: center;
}
div.dimensionItem {
  display: grid;
  grid-template-columns: 120px 160px 180px;
  grid-template-rows: 40px;
  > div {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
}
div.even {
  background-color: #777777;
  height: 40px;
}
div.odd {
  background-color: #333333;
  height: 40px;
}
button.subTab {
  /* width: 100px; */
  height: 28px;
  border-color: #c0c0c0;
  padding: 2px 10px;
  background-color: #181818;
  color: #c0c0c0;
  &.selected {
    border-color: #ffffff;
    background-color: #484848;
    color: #ffffff;
  }
}
button.subTab:hover {
  background-color: #303030;
  cursor: pointer;
}
/*重置按钮*/
button.prestige {
  width: 160px;
  height: 80px;
  border-color: #c0c0c0;
  background-color: #181818;
  color: #c0c0c0;
  &.affordable {
    border-color: #ffffff;
    background-color: #484848;
    color: #ffffff;
    cursor: pointer;
  }
}
button.prestige:hover {
  background-color: #303030;
}

/*可购买按钮类*/
button.buyable {
  width: 160px;
  height: 32px;
  border-color: #c0c0c0;
  background-color: #181818;
  color: #c0c0c0;
  cursor: not-allowed;
  &.affordable {
    border-color: #ffffff;
    background-color: #484848;
    color: #ffffff;
    cursor: pointer;
  }
}
button.buyable:hover {
  background-color: #303030;
}

button.affordable:hover {
  background-color: #606060;
  cursor: pointer;
}
button.affordable:active {
  transform: scale(0.98, 0.98);
}
</style>
