<script setup lang="ts">
import { format } from '@/format'
import { getLayer } from '@/layers'
import { player } from '@/player'
</script>
<template>
  <div id="resourceBar">
    <span class="text">
      点数{{ format(getLayer([0])?.points || 0)
      }}<span class="softcapped">(受软上限限制)</span></span
    >
  </div>
</template>
<style scoped>
div#resourceBar {
  border: 2px solid #c0c0c0;
  width: 100%;
  height: 120px;
  box-sizing: border-box;
}
</style>
