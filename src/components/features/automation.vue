<script setup lang="ts">
import { computed, ref } from 'vue'
import Decimal from 'break_eternity.js'
import { player } from '@/data/player'
import { getLayer, getLayerName } from '@/access'
import { getLayerOrder, posArray } from '@/tools/ordinal'
import { getBuyables } from '@/compute/buyables'
import type { AutoBuyConfig, AutoConfig, AutoResetConfig } from '@/data/types'
import {
  AUTOMATIONS,
  getLayerAutomation,
  isAllAutoActive,
  isLayerAutoActive,
  toggleLayerAuto,
  toggleAllAuto,
  toggleAutoItem,
  isAutoItem,
} from '@/logic/automations'

/**所有活跃层级 */
const layerKeys = computed(() => Object.keys(player.layers))
/**当前选择的层级 */
const selectedKey = ref<string>('0')
const selectedPos = computed(() => posArray(selectedKey.value))
/**当前层级的自动化配置 */
const auto = computed(() => getLayerAutomation(selectedPos.value))
/**全部层级自动化是否全开 */
const allAutoOn = computed(() => isAllAutoActive())
/**当前层级是否有自动化激活 */
const layerAutoOn = computed(() => isLayerAutoActive(selectedPos.value))
/**当前层维度数量 */
const dimCount = computed(() => getLayer(selectedPos.value)?.dimensions.length ?? 0)
/**当前层可购买列表 */
const buyableList = computed(() => getBuyables(getLayerOrder(selectedPos.value)))
/**类型化的配置访问 */
function cfgOf(id: string): AutoConfig {
  return auto.value.cfgs[id] as AutoConfig
}
function buyCfg(id: string): AutoBuyConfig {
  return auto.value.cfgs[id] as AutoBuyConfig
}
function resetCfg(): AutoResetConfig {
  return auto.value.cfgs.reset as AutoResetConfig
}
/**解析大数字输入，非法时保持原值 */
function parseDecimal(v: string): Decimal {
  const d = new Decimal(v)
  return Decimal.isNaN(d) ? new Decimal(0) : d
}
</script>
<template>
  <div id="automation">
    <div id="subtabRow">
      <button class="subTab selected">内部自动化</button>
    </div>
    <div id="autoHeader">
      <button :class="['toggle', allAutoOn ? 'toggle-on' : 'toggle-off']" @click="toggleAllAuto()">
        全部自动化:{{ allAutoOn ? '开' : '关' }}
      </button>
      <select v-model="selectedKey">
        <option v-for="k in layerKeys" :key="k" :value="k">
          {{ getLayerName(posArray(k)) }}
        </option>
      </select>
      <button
        :class="['toggle', layerAutoOn ? 'toggle-on' : 'toggle-off']"
        @click="toggleLayerAuto(selectedPos)"
      >
        本层:{{ layerAutoOn ? '开' : '关' }}
      </button>
    </div>

    <template v-for="def in AUTOMATIONS" :key="def.id">
      <div v-if="def.isUnlocked(selectedPos)" class="card">
        <span class="text bold">{{ def.name }}</span>
        <div class="row">
          <button
            :class="['toggle', def.isActive(cfgOf(def.id)) ? 'toggle-on' : 'toggle-off']"
            @click="def.setAll(selectedPos, cfgOf(def.id), !def.isActive(cfgOf(def.id)))"
          >
            开关:{{ def.isActive(cfgOf(def.id)) ? '开' : '关' }}
          </button>
          <span class="text">优先级</span>
          <input type="number" v-model.number="cfgOf(def.id).priority" />
        </div>

        <template v-if="def.id == 'dims' || def.id == 'buyables'">
          <div class="row">
            <button @click="buyCfg(def.id).order = buyCfg(def.id).order == 'asc' ? 'desc' : 'asc'">
              {{ buyCfg(def.id).order == 'asc' ? '从低到高' : '从高到低' }}
            </button>
            <span class="text">消耗%</span>
            <input type="number" v-model.number="buyCfg(def.id).percent" />
            <button
              @click="
                buyCfg(def.id).buyAmount = buyCfg(def.id).buyAmount == 'one' ? 'max' : 'one'
              "
            >
              {{ buyCfg(def.id).buyAmount == 'one' ? '买1个' : '买最大' }}
            </button>
          </div>
          <div v-if="def.id == 'dims'" class="row wrap">
            <button
              v-for="i in dimCount"
              :key="i"
              :class="['toggle', isAutoItem(selectedPos, 'dims', i - 1) ? 'toggle-on' : 'toggle-off']"
              @click="toggleAutoItem(selectedPos, 'dims', i - 1)"
            >
              维度{{ i }}:{{ isAutoItem(selectedPos, 'dims', i - 1) ? '开' : '关' }}
            </button>
          </div>
          <div v-if="def.id == 'buyables'" class="row wrap">
            <button
              v-for="b in buyableList"
              :key="b.id"
              :class="[
                'toggle',
                isAutoItem(selectedPos, 'buyables', b.id) ? 'toggle-on' : 'toggle-off',
              ]"
              @click="toggleAutoItem(selectedPos, 'buyables', b.id)"
            >
              {{ b.name }}:{{ isAutoItem(selectedPos, 'buyables', b.id) ? '开' : '关' }}
            </button>
          </div>
        </template>

        <template v-if="def.id == 'reset'">
          <div class="row">
            <button @click="resetCfg().combine = resetCfg().combine == 'any' ? 'all' : 'any'">
              {{ resetCfg().combine == 'any' ? '任一满足' : '全部满足' }}
            </button>
          </div>
          <div class="row">
            <button
              :class="['toggle', resetCfg().useTime ? 'toggle-on' : 'toggle-off']"
              @click="resetCfg().useTime = !resetCfg().useTime"
            >
              时间:{{ resetCfg().useTime ? '开' : '关' }}
            </button>
            <input v-if="resetCfg().useTime" type="number" v-model.number="resetCfg().time" />
            <span class="text">秒</span>
          </div>
          <div class="row">
            <button
              :class="['toggle', resetCfg().usePoint ? 'toggle-on' : 'toggle-off']"
              @click="resetCfg().usePoint = !resetCfg().usePoint"
            >
              点数:{{ resetCfg().usePoint ? '开' : '关' }}
            </button>
            <input
              v-if="resetCfg().usePoint"
              :value="resetCfg().point.toString()"
              @change="resetCfg().point = parseDecimal(($event.target as HTMLInputElement).value)"
            />
          </div>
          <div class="row">
            <button
              :class="['toggle', resetCfg().useMult ? 'toggle-on' : 'toggle-off']"
              @click="resetCfg().useMult = !resetCfg().useMult"
            >
              倍率:{{ resetCfg().useMult ? '开' : '关' }}
            </button>
            <input
              v-if="resetCfg().useMult"
              :value="resetCfg().mult.toString()"
              @change="resetCfg().mult = parseDecimal(($event.target as HTMLInputElement).value)"
            />
            <span class="text">倍</span>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>
<style scoped>
div#automation {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
div#subtabRow {
  display: flex;
  flex-direction: row;
  gap: 6px;
}
div#autoHeader {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
}
select {
  background-color: var(--input-bg);
  color: var(--text);
  border: 1px solid var(--dim);
}
div.card {
  border: 2px solid var(--dim);
  padding: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
div.row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
}
div.row.wrap {
  flex-wrap: wrap;
  justify-content: center;
}
input[type='number'],
input:not([type]) {
  width: 100px;
  background-color: var(--input-bg);
  color: var(--text);
  border: 1px solid var(--dim);
}
</style>
