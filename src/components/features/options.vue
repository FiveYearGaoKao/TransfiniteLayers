<script setup lang="ts">
import { computed, ref } from 'vue'
import { formatTime } from '@/tools/format'
import { player } from '@/data/player'
import { hardReset, importSaveString, exportSaveString, localSave } from '@/save/save'
import { settings, saveSettings, cycleTheme, THEMES } from '@/settings'
import { type logType } from '@/log'
import { gameVersion } from '@/data/constants'
import { CHANGELOG } from '@/data/changelog'
import { getEffects, type EffectTarget } from '@/compute/effects'

type optionsTab = 'settings' | 'about' | 'statistics'
const subtab = ref<optionsTab>('settings')

/**导出存档 */
const exportText = ref('')
function doExport() {
  localSave()
  exportText.value = exportSaveString()
}
async function copyExport() {
  if (!exportText.value) return
  try {
    await navigator.clipboard.writeText(exportText.value)
  } catch {
    //剪贴板不可用时忽略
  }
}
/**导入存档(从同一文本框读取) */
function doImport() {
  if (importSaveString(exportText.value)) {
    exportText.value = ''
  }
}
/**当前主题的名称 */
const themeName = computed(() => THEMES.find((t) => t.id == settings.theme)?.name ?? settings.theme)
/**切换滚动新闻 */
function toggleNews() {
  settings.showNews = !settings.showNews
  saveSettings()
}
/**切换日志栏显示 */
function toggleLog() {
  settings.showLog = !settings.showLog
  saveSettings()
}
/**所有日志类型 */
const logTypes: logType[] = ['info', 'warning', 'error', 'progress', 'automator']
/**切换某类型日志的显示 */
function toggleLogType(t: logType) {
  settings.logFilter[t] = !settings.logFilter[t]
  saveSettings()
}
/**各数值点的加成来源(用于统计页) */
const effectTargets: EffectTarget[] = [
  'dimensionCost',
  'dimensionMult',
  'dimensionExponent',
  'production',
  'pointsGain',
  'resetGain',
  'upgradeCost',
]
</script>
<template>
  <div id="options">
    <div id="subtabRow">
      <button
        :class="{ subTab: true, selected: subtab == 'settings' }"
        @click="subtab = 'settings'"
      >
        设置
      </button>
      <button :class="{ subTab: true, selected: subtab == 'about' }" @click="subtab = 'about'">
        关于游戏
      </button>
      <button
        :class="{ subTab: true, selected: subtab == 'statistics' }"
        @click="subtab = 'statistics'"
      >
        统计
      </button>
    </div>

    <div v-if="subtab == 'settings'" id="settings">
      <div class="section">
        <span class="text bold">偏好</span>
        <div class="row">
          <button :class="{ toggle: true, selected: true }" @click="cycleTheme()">
            主题：{{ themeName }}
          </button>
          <button
            :class="['toggle', settings.showNews ? 'toggle-on' : 'toggle-off']"
            @click="toggleNews()"
          >
            滚动新闻：{{ settings.showNews ? '开' : '关' }}
          </button>
          <button
            :class="['toggle', settings.showLog ? 'toggle-on' : 'toggle-off']"
            @click="toggleLog()"
          >
            日志栏：{{ settings.showLog ? '开' : '关' }}
          </button>
        </div>
      </div>
      <div class="section">
        <span class="text bold">日志过滤</span>
        <div class="row">
          <button
            v-for="t in logTypes"
            :key="t"
            :class="['toggle', settings.logFilter[t] ? 'toggle-on' : 'toggle-off']"
            @click="toggleLogType(t)"
          >
            {{ t }}
          </button>
        </div>
      </div>
      <div class="section">
        <span class="text bold">存档</span>
        <textarea
          v-model="exportText"
          placeholder="点击导出生成存档，或粘贴存档后导入"
          rows="5"
        ></textarea>
        <div class="row">
          <button @click="doExport()">导出</button>
          <button @click="copyExport()">复制</button>
          <button @click="doImport()">导入</button>
        </div>
      </div>
      <div class="section">
        <span class="text bold">硬重置</span>
        <button @click="hardReset()">硬重置</button>
      </div>
    </div>

    <div v-if="subtab == 'about'" id="about">
      <span class="text">版本: {{ gameVersion }}</span>
      <div v-for="c in CHANGELOG" :key="c.version" class="section">
        <span class="text bold">{{ c.version }}</span>
        <p v-for="note in c.notes" :key="note" class="text">{{ note }}</p>
      </div>
    </div>

    <div v-if="subtab == 'statistics'" id="statistics">
      <span class="text">存档创建时间: {{ new Date(player.firstPlay).toLocaleString() }}</span>
      <span class="text">游玩时间: {{ formatTime(player.totalTime) }}</span>
      <span class="text">离线时间: {{ formatTime(player.offlineTime) }}</span>
      <span class="text">加速时间: {{ formatTime(player.warpTime) }}</span>
      <div class="section">
        <span class="text bold">加成来源</span>
        <div v-for="target in effectTargets" :key="target" class="section">
          <span class="text">{{ target }}</span>
          <span v-for="m in getEffects(target)" :key="m.id" class="text"
            >{{ m.name ?? m.id }}(order {{ m.order }})
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
div#options {
  display: flex;
  flex-direction: column;
  align-items: center;
}
div#subtabRow {
  display: flex;
  flex-direction: row;
  gap: 6px;
}
div.section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
}
div.row {
  display: flex;
  flex-direction: row;
  gap: 6px;
}
textarea {
  width: 320px;
  resize: none;
  background-color: var(--input-bg);
  color: var(--dim);
  border: 1px solid var(--faint);
  padding: 4px;
}
</style>
