<script setup lang="ts">
import { player } from './player'
import layers from './components/features/layers.vue'
import options from './components/features/options.vue'
import newsBar from './components/newsBar.vue'
import resourceBar from './components/resourceBar.vue'
import navigatorBar from './components/navigatorBar.vue'
import logBar from './components/logBar.vue'
import toolBar from './components/toolBar.vue'
</script>

<template>
  <div id="main">
    <div id="header">
      <newsBar />
      <resourceBar />
    </div>
    <div id="center">
      <navigatorBar />
      <div id="realMain">
        <layers v-if="player.mainTab == 'layers'" />
        <options v-if="player.mainTab == 'options'" />
      </div>
      <logBar />
    </div>
    <div id="footer">
      <toolBar />
    </div>
  </div>
</template>

<style scoped>
div#main {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
div#center {
  flex: 1 1 auto;
  height: 0px;
  display: flex;
  flex-direction: row;
}
div#realMain {
  flex: 1 1 auto;
  margin: 0px;
}
</style>
