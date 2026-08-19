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
  knowledgeAmount,
} from '@/compute/knowledge'
import {
  buyOfflineTime,
  buyOfflineTimePct,
  convertOfflineToWarp,
  convertOfflineToWarpPct,
  offlineTimeCost,
} from '@/logic/knowledge'
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

/**固定时长预设(秒与显示名) */
const fixedPresets: { sec: Decimal; label: string }[] = [
  { sec: new Decimal(60), label: '1分钟' },
  { sec: new Decimal(600), label: '10分钟' },
  { sec: new Decimal(3600), label: '1小时' },
  { sec: new Decimal(21600), label: '6小时' },
]
/**消耗/转换的比例预设 */
const pctPresets: number[] = [0.1, 0.5, 1]
/**解锁加速倍率的知识升级id */
const BOOST_UPGRADE_ID = 'qol-boost'
/**加速倍率档位(升级已购数0-3) */
const boostTier = computed(() => knowledgeAmount(BOOST_UPGRADE_ID).toNumber())
/**按档位过滤可见的加速倍率按钮 */
const boostPresets = computed(() => {
  const tier = boostTier.value
  return [
    { mult: 1, unlocked: true },
    { mult: 2, unlocked: true },
    { mult: 5, unlocked: tier >= 1 },
    { mult: 10, unlocked: tier >= 2 },
    { mult: 60, unlocked: tier >= 3 },
  ].filter((p) => p.unlocked)
})
/**当前全局速度 */
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

    <div v-if="subtab == 'offline'" id="offline" class="section">
      <div class="section">
        <span class="text bold">时间资源</span>
        <span class="text">离线时间: {{ formatTime(player.offlineTime) }}</span>
        <span v-if="player.warpTime.gte(1)" class="text">
          时间扭曲剩余: {{ formatTime(player.warpTime) }}
        </span>
        <span v-else class="text">时间扭曲未开启</span>
      </div>

      <div class="section">
        <span class="text bold">兑换离线时间</span>
        <span class="text">汇率: 1知识 = 1分钟离线时间</span>
        <div class="row">
          <button
            v-for="p in fixedPresets"
            :key="p.label"
            :class="['toggle', { affordable: player.knowledge.gte(offlineTimeCost(p.sec)) }]"
            :disabled="player.knowledge.lt(offlineTimeCost(p.sec))"
            @click="buyOfflineTime(p.sec)"
          >
            {{ p.label }}
          </button>
          <button
            v-for="pct in pctPresets"
            :key="pct"
            :class="['toggle', { affordable: player.knowledge.gt(0) }]"
            :disabled="player.knowledge.lte(0)"
            @click="buyOfflineTimePct(pct)"
          >
            {{ pct * 100 }}%
          </button>
        </div>
      </div>

      <div class="section">
        <span class="text bold">时间扭曲</span>
        <span class="text">消耗离线时间以获得等量的加速时间</span>
        <div class="row">
          <button
            v-for="p in fixedPresets"
            :key="p.label"
            :class="['toggle', { affordable: player.offlineTime.gte(p.sec) }]"
            :disabled="player.offlineTime.lt(p.sec)"
            @click="convertOfflineToWarp(p.sec)"
          >
            {{ p.label }}
          </button>
          <button
            v-for="pct in pctPresets"
            :key="pct"
            :class="['toggle', { affordable: player.offlineTime.gt(0) }]"
            :disabled="player.offlineTime.lte(0)"
            @click="convertOfflineToWarpPct(pct)"
          >
            {{ pct * 100 }}%
          </button>
        </div>
      </div>

      <div class="section" v-if="hasKnowledge('qol-offline-boost')">
        <span class="text bold">加速</span>
        <span class="text">加速消耗离线时间,稳定提升全局速度</span>
        <span class="text">当前全局速度: x{{ format(psdSpeed) }}</span>
        <div class="row">
          <button
            v-for="p in boostPresets"
            :key="p.mult"
            :class="['subTab', { selected: player.boostSpeed.eq(p.mult) }]"
            @click="player.boostSpeed = new Decimal(p.mult)"
          >
            x{{ p.mult }}
          </button>
        </div>
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
div#knowledgeUpgrades {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}
</style>
