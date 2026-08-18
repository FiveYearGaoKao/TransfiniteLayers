<script setup lang="ts">
import { format, formatWhole } from '@/tools/format'
import { getLayer, getLayerName, dimensionAmount, prevLayer } from '@/access'
import { getLayerIndex, getLayerOrder, isLayer0, shiftLayer } from '@/tools/ordinal'
import { dimensionCost, dimensionExponent, dimensionMultiplier } from '@/compute/dimensions'
import { getBuyables, isUnlocked as isBuyableUnlocked } from '@/compute/buyables'
import { getUpgrades, isUnlocked as isUpgradeUnlocked } from '@/compute/upgrades'
import { energyBonus } from '@/compute/energy'
import { buyDimension, canAfford } from '@/logic/purchase'
import { dimsAutoUnlocked, isAutoItem, toggleAutoItem } from '@/logic/automations'
import { canReset, resetGain } from '@/compute/prestige'
import { doReset } from '@/logic/reset'
import { player } from '@/data/player'
import { openConfirm } from '@/dialog'
import { settings } from '@/settings'
import { computed } from 'vue'
import BuyableItem from './buyableItem.vue'
import UpgradeItem from './upgradeItem.vue'
interface layerName {
  pos: number[]
  name: string
  selected: boolean
}
/**层级表显示的所有层级 */
const layerList = computed(() => {
  const res: layerName[][] = []
  for (let i = player.layerDepth - 1; i >= 0; --i) {
    const layerRow: layerName[] = []
    for (let j = 0; j <= player.base; ++j) {
      const k = j < player.base ? j : -1
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
const selectedLayer = computed(() => {
  return getLayer(player.layerSubtab)
})
/**当前层能量给低层维度的加成数值 */
const layerEnergyBonus = computed(() => energyBonus(player.layerSubtab))
/**当前层级可显示的可购买 */
const buyableList = computed(() =>
  getBuyables(getLayerOrder(player.layerSubtab)).filter((b) =>
    isBuyableUnlocked(player.layerSubtab, b.id),
  ),
)
/**当前层级可显示的升级(按升级的解锁条件过滤) */
const upgradeList = computed(() =>
  getUpgrades(getLayerOrder(player.layerSubtab)).filter((u) =>
    isUpgradeUnlocked(player.layerSubtab, u.id),
  ),
)
/**点击晋升按钮:按设置决定是否二次确认 */
async function doResetConfirm() {
  const pos = player.layerSubtab
  const confirmed =
    !settings.resetConfirm ||
    (await openConfirm({
      title: '重置确认',
      text: `晋升并获得 ${formatWhole(resetGain(pos))} ${getLayerName(pos)}点数?\n这将重置下层进度。`,
      confirmText: '确认重置',
      cancelText: '取消',
    }))
  if (confirmed) doReset(pos)
}
</script>
<template>
  <div id="layers" style="height: 100%">
    <div class="subtabRow" v-for="(i, rowIndex) in layerList" :key="rowIndex">
      <template v-for="(j, colIndex) in i" :key="colIndex">
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
      @click="doResetConfirm()"
    >
      +{{ formatWhole(resetGain(player.layerSubtab)) }} {{ getLayerName(player.layerSubtab) }}点数
    </button>

    <span v-if="!isLayer0(player.layerSubtab)" class="text"
      >你有<span class="text-highlight">{{ formatWhole(selectedLayer?.points ?? 0) }} </span
      >{{ getLayerName(player.layerSubtab) }}点数
    </span>
    <span v-if="!isLayer0(player.layerSubtab)" class="text"
      >你有<span class="text-highlight">{{ format(selectedLayer?.energy ?? 0) }} </span
      >{{ getLayerName(player.layerSubtab) }}能量，使{{
        getLayerName(prevLayer(player.layerSubtab))
      }}维度生产 <span class="text-highlight">x{{ format(layerEnergyBonus) }}</span></span
    >

    <br />
    <div id="dimensionTable">
      <template v-for="i in 4" :key="i">
        <div class="cell">
          <span class="text">{{ getLayerName(player.layerSubtab) }}维度{{ i }}</span>
          <span class="text"
            >x{{ format(dimensionMultiplier(player.layerSubtab, i - 1), 3) }} ^{{
              format(dimensionExponent(player.layerSubtab, i - 1), 3)
            }}</span
          >
        </div>
        <div class="cell">
          <span class="text"
            >{{ format(dimensionAmount(selectedLayer, i - 1)) }}({{
              formatWhole(dimensionAmount(selectedLayer, i - 1, 1))
            }})
          </span>
        </div>
        <div class="cell" :class="{ horizontal: dimsAutoUnlocked(player.layerSubtab) }">
          <button
            :class="['buyable', canAfford(player.layerSubtab, i - 1) ? 'affordable' : '']"
            @click="buyDimension(player.layerSubtab, i - 1)"
          >
            价格: {{ formatWhole(dimensionCost(player.layerSubtab, i - 1)) }}
          </button>
          <button
            v-if="dimsAutoUnlocked(player.layerSubtab)"
            :class="[
              'toggle',
              'compact',
              isAutoItem(player.layerSubtab, 'dims', i - 1) ? 'toggle-on' : 'toggle-off',
            ]"
            @click="toggleAutoItem(player.layerSubtab, 'dims', i - 1)"
          >
            自动:{{ isAutoItem(player.layerSubtab, 'dims', i - 1) ? '开' : '关' }}
          </button>
        </div>
      </template>
    </div>
    <div id="upgrades">
      <UpgradeItem
        v-for="upgrade in upgradeList"
        :key="upgrade.id"
        :pos="player.layerSubtab"
        :def="upgrade"
      />
    </div>
    <div id="buyables">
      <BuyableItem
        v-for="buyable in buyableList"
        :key="buyable.id"
        :pos="player.layerSubtab"
        :def="buyable"
      />
    </div>
  </div>
</template>
<style scoped>
.text-highlight {
  font-size: 18px;
  color: var(--text);
  text-shadow: 1px 1px var(--shadow);
}
div#layers {
  display: flex;
  flex-direction: column;
  align-items: center;
}
div#dimensionTable {
  display: grid;
  grid-template-columns: 110px 140px 150px;
  grid-auto-rows: 32px;
  .cell {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    &.horizontal {
      flex-direction: row;
      gap: 2px;
    }
    .text {
      font-size: 12px;
    }
  }
  /*奇数维度行与偶数维度行颜色不同*/
  .cell:nth-child(6n + 1),
  .cell:nth-child(6n + 2),
  .cell:nth-child(6n + 3) {
    background-color: var(--dim-odd-bg);
  }
  .cell:nth-child(6n + 4),
  .cell:nth-child(6n + 5),
  .cell:nth-child(6n + 6) {
    background-color: var(--dim-even-bg);
  }
}
/*可购买行*/
div#buyables {
  display: flex;
  flex-direction: row;
  gap: 10px;
  margin-top: 10px;
}
/*升级区*/
div#upgrades {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 10px;
}
/*窄屏:统一表格列宽自适应，所有行列宽一致*/
@media (max-width: 700px) {
  div#dimensionTable {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  div#dimensionTable button {
    width: 100%;
  }
}
</style>
