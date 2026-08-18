<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import Decimal, { type DecimalSource } from 'break_eternity.js'
import { formatTime, format } from '@/tools/format'
import { player } from '@/data/player'
import { hardReset, importSaveString, exportSaveString, localSave, localLoad, setCurrentSlot, hasSlotSave } from '@/save/save'
import { openConfirm, openSlots } from '@/dialog'
import { settings, saveSettings, cycleTheme, THEMES } from '@/settings'
import { temp } from '@/temp'
import { type logType, addLog } from '@/log'
import { gameVersion, DIMENSION_COUNT } from '@/data/constants'
import { CHANGELOG } from '@/data/changelog'
import {
  effectBreakdown,
  slotBreakdown,
  type EffectSlot,
  type EffectType,
  type RegisteredEffect,
} from '@/compute/effects'
import { getLayerName } from '@/access'
import type { LayerId } from '@/data/types'
import { hasKnowledge } from '@/compute/knowledge'

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
/**保存到所选槽位(弹出槽位选择框) */
async function doSave() {
  const slot = await openSlots({ title: '选择保存槽位', mode: 'save' })
  if (slot != null) {
    localSave(slot)
    setCurrentSlot(slot)
    addLog('info', `已保存到槽位 ${slot + 1}`)
  }
}
/**从所选槽位读档(读档前自动保存当前进度;空槽位自动创建新存档) */
async function doLoad() {
  const slot = await openSlots({ title: '选择读档槽位', mode: 'load' })
  if (slot == null) return
  localSave()
  let ok = false
  try {
    ok = localLoad(slot)
  } catch {
    ok = false
  }
  if (ok) {
    setCurrentSlot(slot)
    addLog('info', `已从槽位 ${slot + 1} 读档`)
  } else if (hasSlotSave(slot)) {
    addLog('error', `槽位 ${slot + 1} 读档失败,存档内容可能无效`)
  } else {
    setCurrentSlot(slot)
    hardReset()
    addLog('info', `槽位 ${slot + 1} 为空,已自动创建新存档`)
  }
}
/**硬重置(始终二次确认) */
async function doHardReset() {
  const confirmed = await openConfirm({
    title: '硬重置',
    text: '将清空所有进度并重新开始!\n此操作不可撤销,建议先导出存档。',
    confirmText: '确认重置',
    cancelText: '取消',
  })
  if (confirmed) hardReset()
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
/**切换工具栏显示 */
function toggleToolBar() {
  settings.showToolBar = !settings.showToolBar
  saveSettings()
}
/**所有日志类型 */
const logTypes: logType[] = ['info', 'warning', 'error', 'progress', 'automator']
/**切换某类型日志的显示 */
function toggleLogType(t: logType) {
  settings.logFilter[t] = !settings.logFilter[t]
  saveSettings()
}
/**离线时间去向的三种模式 */
const OFFLINE_MODES: ('warp' | 'store' | 'ask')[] = ['warp', 'store', 'ask']
/**离线时间去向模式的显示名称 */
function offlineModeName(m: string): string {
  return m == 'store' ? '储存' : m == 'ask' ? '询问' : '加速'
}
/**循环切换离线时间去向模式 */
function cycleOfflineMode() {
  const idx = OFFLINE_MODES.indexOf(player.offlineMode)
  player.offlineMode = OFFLINE_MODES[(idx + 1) % OFFLINE_MODES.length] ?? 'warp'
}
/**手动保存到当前槽位 */
function doManualSave() {
  localSave()
  addLog('info', '游戏已保存')
}
/**切换自动保存 */
function toggleAutoSave() {
  settings.autoSave = !settings.autoSave
  saveSettings()
}
/**设置自动保存间隔(秒),非法输入保持原值 */
function setAutoSaveInterval(v: string) {
  const n = Math.floor(Number(v))
  if (Number.isFinite(n) && n > 0) {
    settings.autoSaveInterval = n
    saveSettings()
  }
}
/**解析伪现实速度初始值输入,非法时保持原值 */
function setDebugSpeed(v: string) {
  const d = new Decimal(v)
  if (!Decimal.isNaN(d) && d.gt(0)) temp.debugSpeed = d
}
/**统计页:数值点定义 */
interface StatTargetDef {
  target: string
  /**是否按维度区分为多行 */
  perDim: boolean
  /**总值前显示的符号 */
  sign: string
  label: (id: number) => string
  /**计算时的初始值(缺省1) */
  base?: () => DecimalSource
}
const statDefs: StatTargetDef[] = [
  { target: 'dimensionMult', perDim: true, sign: 'x', label: (i: number) => `维度${i + 1}乘数` },
  { target: 'dimensionExponent', perDim: true, sign: '', label: (i: number) => `维度${i + 1}指数` },
  { target: 'pointsGain', perDim: false, sign: 'x', label: () => '点数获取' },
  { target: 'resetGain', perDim: false, sign: 'x', label: () => '重置收益' },
  {
    target: 'psdSpeed',
    perDim: false,
    sign: 'x',
    label: () => '伪现实速度',
    base: () => temp.debugSpeed,
  },
]
/**效果作用方式的符号 */
function opSign(type: EffectType): string {
  return type == 'mul' ? 'x' : type == 'add' ? '+' : type == 'exp' ? '^' : ''
}
/**统计明细的可折叠树节点 */
interface StatNode {
  key: string
  label: string
  sign: string
  value: Decimal
  children: StatNode[]
}
/**效果来源明细转节点列表 */
function statNodes(
  parts: { e: RegisteredEffect; value: Decimal }[],
  parentKey: string,
  pos: LayerId,
  id: number,
): StatNode[] {
  return parts.map((p) => {
    const key = `${parentKey}:${p.e.id}`
    const children: StatNode[] = []
    if (p.e.base) children.push(statSlot(p.e.base, '底数', `${key}:base`, pos, id))
    if (p.e.amount) children.push(statSlot(p.e.amount, '数量', `${key}:amount`, pos, id))
    return { key, label: p.e.name ?? p.e.id, sign: opSign(p.e.type), value: p.value, children }
  })
}
/**槽位节点:初始值 + 各修饰来源 */
function statSlot(
  slot: EffectSlot,
  label: string,
  key: string,
  pos: LayerId,
  id: number,
): StatNode {
  const ctx = { pos, id }
  const b = slotBreakdown(slot, ctx)
  return {
    key,
    label,
    sign: '',
    value: b.total,
    children: [
      {
        key: `${key}:init`,
        label: '初始值',
        sign: '',
        value: new Decimal(slot.init(ctx)),
        children: [],
      },
      ...statNodes(b.parts, key, pos, id),
    ],
  }
}
/**根节点 */
function statRoot(sd: StatTargetDef, id: number, pos: LayerId): StatNode {
  const b = effectBreakdown(sd.target, { pos, id }, sd.base ? sd.base() : 1)
  const key = `${sd.target}:${id}`
  return {
    key,
    label: sd.label(id),
    sign: sd.sign,
    value: b.total,
    children: statNodes(b.parts, key, pos, id),
  }
}
/**当前层级的根节点列表 */
const rootNodes = computed<StatNode[]>(() => {
  const pos = player.layerSubtab
  const nodes: StatNode[] = []
  for (const sd of statDefs) {
    const ids = sd.perDim ? Array.from({ length: DIMENSION_COUNT }, (_, i) => i) : [0]
    for (const id of ids) nodes.push(statRoot(sd, id, pos))
  }
  return nodes
})
/**已展开的节点key */
const expanded = reactive(new Set<string>())
/**切换某节点的展开状态 */
function toggle(key: string) {
  if (expanded.has(key)) expanded.delete(key)
  else expanded.add(key)
}
/**展开状态下的拍平行 */
interface FlatRow {
  key: string
  label: string
  sign: string
  value: Decimal
  depth: number
  hasChildren: boolean
}
const flatTree = computed<FlatRow[]>(() => {
  const out: FlatRow[] = []
  const walk = (nodes: StatNode[], depth: number) => {
    for (const n of nodes) {
      out.push({
        key: n.key,
        label: n.label,
        sign: n.sign,
        value: n.value,
        depth,
        hasChildren: n.children.length > 0,
      })
      if (expanded.has(n.key)) walk(n.children, depth + 1)
    }
  }
  walk(rootNodes.value, 0)
  return out
})
</script>
<template>
  <div id="options">
    <div class="subtabRow">
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
        <span class="text bold">界面</span>
        <div class="row">
          <button :class="{ toggle: true, selected: true }" @click="cycleTheme()">
            主题：{{ themeName }}
          </button>
          <button
            :class="['toggle', settings.showToolBar ? 'toggle-on' : 'toggle-off']"
            @click="toggleToolBar()"
          >
            工具栏：{{ settings.showToolBar ? '开' : '关' }}
          </button>
          <button
            :class="['toggle', settings.showLog ? 'toggle-on' : 'toggle-off']"
            @click="toggleLog()"
          >
            日志栏：{{ settings.showLog ? '开' : '关' }}
          </button>
          <button
            :class="['toggle', settings.showNews ? 'toggle-on' : 'toggle-off']"
            @click="toggleNews()"
          >
            滚动新闻：{{ settings.showNews ? '开' : '关' }}
          </button>
        </div>
      </div>
      <div class="section">
        <span class="text bold">日志</span>
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
        <span class="text bold">确认</span>
        <div class="row">
          <button
            :class="['toggle', settings.resetConfirm ? 'toggle-on' : 'toggle-off']"
            @click="settings.resetConfirm = !settings.resetConfirm; saveSettings()"
          >
            重置二次确认：{{ settings.resetConfirm ? '开' : '关' }}
          </button>
          <button
            v-if="hasKnowledge('qol-offline-store')"
            class="toggle"
            title="询问模式会在离线结束时弹出选择"
            @click="cycleOfflineMode()"
          >
            离线时间去向:{{ offlineModeName(player.offlineMode) }}
          </button>
        </div>
      </div>
      <div class="section">
        <span class="text bold">存档</span>
        <div class="row">
          <button @click="doManualSave()">手动保存</button>
          <button @click="doSave()">存档</button>
          <button @click="doLoad()">读档</button>
        </div>
        <div class="row">
          <button
            :class="['toggle', settings.autoSave ? 'toggle-on' : 'toggle-off']"
            @click="toggleAutoSave()"
          >
            自动保存：{{ settings.autoSave ? '开' : '关' }}
          </button>
          <span class="text">间隔</span>
          <input
            type="number"
            :value="settings.autoSaveInterval"
            :disabled="!settings.autoSave"
            @change="setAutoSaveInterval(($event.target as HTMLInputElement).value)"
          />
          <span class="text">秒</span>
        </div>
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
        <div class="row">
          <button class="bad" @click="doHardReset()">硬重置</button>
        </div>
      </div>
      <div class="section">
        <span class="text bold">调试</span>
        <div class="row">
          <span class="text">伪现实速度初始值(不存档)</span>
          <input
            :value="temp.debugSpeed.toString()"
            @change="setDebugSpeed(($event.target as HTMLInputElement).value)"
          />
        </div>
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
        <span class="text bold">加成明细 · 当前层级 {{ getLayerName(player.layerSubtab) }}</span>
        <div class="statTree">
          <div
            v-for="row in flatTree"
            :key="row.key"
            class="statRow"
            :class="{ clickable: row.hasChildren }"
            :style="{ paddingLeft: row.depth * 18 + 'px' }"
            @click="row.hasChildren && toggle(row.key)"
          >
            <span class="text">
              <span class="statArrow">{{
                row.hasChildren ? (expanded.has(row.key) ? '▼' : '▶') : '·'
              }}</span
              >{{ row.label }} {{ row.sign }}{{ format(row.value) }}
            </span>
          </div>
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
textarea {
  width: 320px;
  resize: none;
  color: var(--dim);
  border-color: var(--faint);
  padding: 4px;
}
input {
  width: 120px;
  padding: 4px;
}
/*加成明细树*/
div.statTree {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 260px;
}
div.statRow {
  cursor: default;
  width: 100%;
  padding: 1px 4px;
  transition: all 200ms;
}
div.statRow.clickable {
  cursor: pointer;
}
div.statRow.clickable:hover {
  background-color: var(--hover);
}
span.statArrow {
  display: inline-block;
  width: 14px;
  color: var(--dim);
}
</style>
