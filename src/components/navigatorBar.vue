<script setup lang="ts">
import { computed } from 'vue'
import { player } from '@/player'
</script>
<template>
  <div id="navigatorBar">
    <button
      :class="{ mainTab: true, selected: player.mainTab == 'layers' }"
      @click="player.mainTab = 'layers'"
    >
      层级
    </button>
    <button
      :class="{ mainTab: true, selected: player.mainTab == 'options' }"
      @click="player.mainTab = 'options'"
    >
      选项
    </button>
  </div>
</template>
<style lang="css" scoped>
div#navigatorBar {
  border: 2px solid #c0c0c0;
  width: 150px;
  height: 100%;
  box-sizing: border-box;
}
button.mainTab {
  width: 100%;
  height: 40px;
  border-color: #c0c0c0;
  background-color: #181818;
  color: #c0c0c0;
  font-size: 16px;
  &.selected {
    border-color: #ffffff;
    background-color: #484848;
    color: #ffffff;
  }
}
button.mainTab:hover {
  background-color: #303030;
  cursor: pointer;
}
</style>
