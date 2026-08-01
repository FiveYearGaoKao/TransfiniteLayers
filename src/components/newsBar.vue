<script setup lang="ts">
import { randomNews } from '@/news'
</script>
<template>
  <div id="newsBar">
    <div class="newsContainer">
      <span class="newsText" v-html="randomNews()"></span>
    </div>
  </div>
</template>
<style lang="css" scoped>
div#newsBar {
  width: 100%;
  height: 32px;
}
div.newsContainer {
  width: 90%;
  left: 5%;
  height: 100%;
  padding: 4px;
  box-sizing: border-box;
  border: 2px solid #ffffff;
  border-radius: 6px;
  overflow: hidden;
  position: relative;
}
.newsText {
  font-size: 16px;
  color: #ffffff;
  position: absolute;
  height: 20.8px;
}
</style>
