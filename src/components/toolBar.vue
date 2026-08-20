<script setup lang="ts">
import Decimal from 'break_eternity.js'
import { computed } from 'vue'
import { pause, tick } from '@/core'
import { player } from '@/data/player'
import { getBoostPresets, hasKnowledge } from '@/compute/knowledge'
import { doLoad, doSave } from '@/saveActions'

/**当前已解锁的加速倍率档位 */
const boostPresets = computed(() => getBoostPresets())
/**循环切换加速倍速(在已解锁档位间轮转) */
function cycleBoost() {
  const presets = boostPresets.value
  const cur = player.boostSpeed.toNumber()
  player.boostSpeed = new Decimal(presets[(presets.indexOf(cur) + 1) % presets.length] ?? 1)
}
</script>
<template>
  <div id="toolBar">
    <button
      v-if="hasKnowledge('time-pause')"
      class="tool"
      :title="player.paused ? '恢复(需购买知识升级:暂停功能)' : '暂停(需购买知识升级:暂停功能)'"
      @click="pause()"
    >
      <svg v-if="!player.paused" viewBox="0 0 16 16" width="20" height="20" fill="currentColor">
        <path d="M3 2 L13 8 L3 14 Z" />
      </svg>
      <svg v-else viewBox="0 0 16 16" width="20" height="20" fill="currentColor">
        <rect x="3" y="2" width="3.5" height="12" rx="1" />
        <rect x="9.5" y="2" width="3.5" height="12" rx="1" />
      </svg>
    </button>
    <button
      v-if="hasKnowledge('time-tick')"
      class="tool"
      title="时间流逝1帧(需购买知识升级:TAS)"
      @click="tick()"
    >
      <svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor">
        <rect x="2.5" y="2.5" width="3" height="11" rx="1" />
        <path d="M8.5 3 L14.5 8 L8.5 13 Z" />
      </svg>
    </button>
    <button
      v-if="hasKnowledge('time-boost')"
      class="tool boost"
      title="加速倍速,消耗离线时间,点击循环切换(需购买知识升级:离线加速)"
      @click="cycleBoost()"
    >
      <svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor">
        <path d="M9 1 L3 9 H7 L6 15 L13 6 H8.5 Z" />
      </svg>
      <span class="boostMult">x{{ player.boostSpeed.toNumber() }}</span>
    </button>
    <button class="tool" title="存档(选择槽位)" @click="doSave()">
      <svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor">
        <path d="M3 2 H11 L14 5 V14 H2 V2 Z" />
        <rect x="4" y="2" width="5" height="4" />
        <rect x="4" y="9" width="8" height="5" />
      </svg>
    </button>
    <button class="tool" title="读档(选择槽位)" @click="doLoad()">
      <svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor">
        <path d="M1 4 H8 L10 6 H15 V13 H1 Z" />
      </svg>
    </button>
  </div>
</template>
<style scoped>
div#toolBar {
  border: 2px solid var(--dim);
  width: 100%;
  height: 32px;
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 2px;
  padding: 0 4px;
}
button.tool {
  margin: 0px;
  width: 32px;
  border: 0px;
  height: 100%;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
button.tool.boost {
  width: auto;
  gap: 3px;
  padding: 0 5px;
}
span.boostMult {
  font-size: 14px;
}
</style>
