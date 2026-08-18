<script setup lang="ts">
import { pause, tick } from '@/core'
import { player } from '@/data/player'
import { hasKnowledge } from '@/compute/knowledge'
import { hardReset, localLoad, localSave } from '@/save/save'
import { openConfirm } from '@/dialog'

/**硬重置(二次确认) */
async function doHardReset() {
  const confirmed = await openConfirm({
    title: '硬重置',
    text: '将清空所有进度并重新开始!\n此操作不可撤销,建议先导出存档。',
    confirmText: '确认重置',
    cancelText: '取消',
  })
  if (confirmed) hardReset()
}
</script>
<template>
  <div id="toolBar">
    <button :disabled="!hasKnowledge('qol-pause')" title="需购买知识升级:暂停功能" @click="pause()">
      {{ player.paused ? '恢复' : '暂停' }}
    </button>
    <button
      :disabled="!hasKnowledge('qol-tick')"
      title="需购买知识升级:时间流逝1帧"
      @click="tick()"
    >
      时间流逝1帧
    </button>
    <button @click="localSave()">存档</button>
    <button @click="localLoad()">读档</button>
    <button @click="doHardReset()">硬重置</button>
  </div>
</template>
<style scoped>
div#toolBar {
  border: 2px solid var(--dim);
  width: 100%;
  height: 40px;
  box-sizing: border-box;
}
</style>
