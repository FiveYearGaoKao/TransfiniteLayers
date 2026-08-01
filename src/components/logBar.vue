<script setup lang="ts">
import { highestActiveLayer } from '@/layers'
import { addLog, logs } from '@/log'
</script>
<template>
  <div id="logBar">
    <div id="logList">
      <div v-for="item in logs" :key="item.time" class="logItem">
        <span style="color: #c0c0c0">[{{ new Date(item.time).toLocaleTimeString() }}]</span>
        <span :class="item.type">{{ item.text }}</span>
      </div>
    </div>
    <button @click="addLog('error', highestActiveLayer([-1], 0).toString())">发一条消息喵</button>
  </div>
</template>
<style scoped>
div#logBar {
  border: 2px solid #c0c0c0;
  margin: 0px;
  width: 300px;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}
div#logList {
  width: 100%;
  height: 100%;
  flex: 1 1 auto;
  overflow-x: hidden;
  overflow-y: scroll;
  scrollbar-width: none;
}
div.logItem {
  border: 1px solid #808080;
  width: 100%;
  font-size: 12px;
  transition: all 200ms;
}
div.logItem:hover {
  background-color: #303030;
}
span.info {
  color: skyblue;
}
span.warning {
  color: orange;
}
span.error {
  color: red;
}
span.progress {
  color: gold;
}
span.automator {
  color: pink;
}
</style>
