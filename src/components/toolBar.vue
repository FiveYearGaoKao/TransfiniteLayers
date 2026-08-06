<script setup lang="ts">
import { pause, tick } from '@/core'
import { player } from '@/data/player'
import { hardReset, localLoad, localSave } from '@/save/save'
</script>
<template>
  <div id="toolBar">
    <button @click="pause()">{{ player.paused ? '恢复' : '暂停' }}</button>
    <button @click="tick()">时间流逝1帧</button>
    <button @click="localSave()">存档</button>
    <button @click="localLoad()">读档</button>
    <button @click="hardReset()">硬重置</button>
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
