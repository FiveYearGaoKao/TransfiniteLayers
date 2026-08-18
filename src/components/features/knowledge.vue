<script setup lang="ts">
import { computed, ref } from 'vue'
import Decimal from 'break_eternity.js'
import { format, formatTime } from '@/tools/format'
import { player } from '@/data/player'
import { settings, saveSettings } from '@/settings'
import {
  canShow,
  getKnowledgeCategories,
  getPsdSpeed,
  getUpgradesByCategory,
  hasKnowledge,
} from '@/compute/knowledge'
import { buyOfflineTime } from '@/logic/knowledge'
import KnowledgeItem from './knowledgeItem.vue'

/**类别的显示名(未知类别显示原始id) */
const CATEGORY_NAMES: Record<string, string> = {
  offline: '离线时间',
  qol: 'QoL',
  bonus: '加成',
}
/**知识页的所有子标签:离线时间为特殊页,其余来自升级定义 */
const cats = computed(() => ['offline', ...getKnowledgeCategories()])
/**类别的显示名 */
function catName(c: string): string {
  return CATEGORY_NAMES[c] ?? c
}
const subtab = ref('offline')
/**当前类别下按显示规则过滤的升级 */
const visibleUpgrades = computed(() =>
  getUpgradesByCategory(subtab.value).filter((def) => canShow(def, settings.hideMaxedKnowledge)),
)
/**切换"隐藏已满级升级" */
function toggleHideMaxed() {
  settings.hideMaxedKnowledge = !settings.hideMaxedKnowledge
  saveSettings()
}

/**自定义兑换的分钟数 */
const minutesInput = ref(1)
/**按分钟购买离线时间 */
function buyMinutes() {
  buyOfflineTime(minutesInput.value * 60)
}
/**加速倍率预设 */
const boostPresets = [2, 5, 10, 60]
/**解析加速倍率输入,非法时保持原值 */
function setBoostSpeed(v: string) {
  const d = new Decimal(v)
  if (!Decimal.isNaN(d) && d.gt(1)) player.boostSpeed = d
}
/**当前伪现实速度 */
const psdSpeed = computed(() => getPsdSpeed())
</script>
<template>
  <div id="knowledge">
    <span class="text bold">知识: {{ format(player.knowledge) }}</span>
    <div class="subtabRow">
      <button
        v-for="c in cats"
        :key="c"
        :class="{ subTab: true, selected: subtab == c }"
        @click="subtab = c"
      >
        {{ catName(c) }}
      </button>
    </div>

    <div v-if="subtab == 'offline'" id="offline" class="section box">
      <div class="section box">
        <span class="text bold">兑换离线时间</span>
        <span class="text">汇率: 1知识 = 1分钟离线时间</span>
        <div class="row">
          <button class="buyable" @click="buyOfflineTime(60)">1分钟</button>
          <button class="buyable" @click="buyOfflineTime(600)">10分钟</button>
          <button class="buyable" @click="buyOfflineTime(3600)">1小时</button>
          <button class="buyable" @click="buyOfflineTime(21600)">6小时</button>
        </div>
        <div class="row">
          <input type="number" min="1" v-model.number="minutesInput" />
          <span class="text">分钟</span>
          <button class="buyable" :disabled="minutesInput <= 0" @click="buyMinutes()">购买</button>
        </div>
      </div>

      <div class="section box">
        <span class="text bold">时间资源</span>
        <span class="text">离线时间: {{ formatTime(player.offlineTime) }}</span>
        <span class="text">加速时间: {{ formatTime(player.warpTime) }}</span>
        <span v-if="player.warpTime.gte(1)" class="text">
          时间扭曲消耗中(加速时间>=1秒时自动开启)...
        </span>
        <span v-else class="text">时间扭曲:加速时间>=1秒时自动开启</span>
      </div>

      <div class="section box">
        <span class="text bold">加速</span>
        <template v-if="hasKnowledge('qol-offline-boost')">
          <span class="text">加速消耗离线时间,稳定提升伪现实速度</span>
          <span class="text">当前伪现实速度: x{{ format(psdSpeed) }}</span>
          <div class="row">
            <button
              :class="['toggle', player.boostActive ? 'toggle-on' : 'toggle-off']"
              @click="player.boostActive = !player.boostActive"
            >
              加速:{{ player.boostActive ? '开' : '关' }}
            </button>
            <button
              v-for="p in boostPresets"
              :key="p"
              class="subTab"
              @click="player.boostSpeed = new Decimal(p)"
            >
              x{{ p }}
            </button>
            <input
              :value="player.boostSpeed.toString()"
              @change="setBoostSpeed(($event.target as HTMLInputElement).value)"
            />
          </div>
        </template>
        <span v-else class="text">需购买知识升级:离线加速</span>
      </div>
    </div>

    <template v-else>
      <div class="row">
        <button
          :class="['toggle', settings.hideMaxedKnowledge ? 'toggle-on' : 'toggle-off']"
          @click="toggleHideMaxed()"
        >
          隐藏已满级:{{ settings.hideMaxedKnowledge ? '开' : '关' }}
        </button>
      </div>
      <div id="knowledgeUpgrades">
        <KnowledgeItem v-for="def in visibleUpgrades" :key="def.id" :def="def" />
      </div>
    </template>
  </div>
</template>
<style scoped>
div#knowledge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
input {
  width: 90px;
}
div#knowledgeUpgrades {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}
</style>
