<script setup lang="ts">
import { computed } from 'vue'
import { player, type mainTabs } from '@/data/player'
import { hasAchievement, hasAnyUpgrade } from '@/access'
import { getMetaLayers } from '@/meta/registry'

interface tabInfo {
  id: mainTabs
  name: string
  /**是否为元重置层标签 */
  meta: boolean
}
/**导航栏的所有标签(按解锁条件过滤) */
const tabs = computed(() => {
  const list: tabInfo[] = [
    { id: 'layers', name: '层级', meta: false },
    { id: 'options', name: '选项', meta: false },
    { id: 'achievements', name: '成就', meta: false },
  ]
  if (player.knowledgeUnlocked) {
    list.push({ id: 'knowledge', name: '知识', meta: false })
  }
  if (hasAchievement('a28')) {
    list.push({ id: 'challenges', name: '挑战', meta: false })
  }
  if (hasAnyUpgrade(4)) {
    list.push({ id: 'automation', name: '自动化', meta: false })
  }
  for (const m of getMetaLayers()) {
    if (m.isUnlocked()) list.push({ id: m.id as mainTabs, name: m.name ?? m.id, meta: true })
  }
  return list
})
</script>
<template>
  <div id="navigatorBar">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      :class="{ mainTab: true, meta: tab.meta, selected: player.mainTab == tab.id }"
      @click="player.mainTab = tab.id"
    >
      {{ tab.name }}
    </button>
  </div>
</template>
<style lang="css" scoped>
div#navigatorBar {
  border-left: 2px solid var(--dim);
  border-right: 2px solid var(--dim);
  width: 150px;
  height: 100%;
  flex: 0 0 auto;
  box-sizing: border-box;
}
/*窄屏或矮屏(横屏):横向排列，按钮可换行，高度至少为固定值*/
@media (max-width: 700px), (max-height: 500px) {
  div#navigatorBar {
    width: 100%;
    height: auto;
    min-height: 40px;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    border: none;
    border-bottom: 2px solid var(--dim);
  }
  button.mainTab {
    width: auto;
    flex: 0 0 auto;
    height: 36px;
    padding: 0 8px;
    font-size: 14px;
    white-space: nowrap;
  }
}
</style>
