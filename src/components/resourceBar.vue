<script setup lang="ts">
import { format } from '@/tools/format'
import { getLayer } from '@/access'
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
  border: 2px solid var(--dim);
  width: 100%;
  height: 120px;
  box-sizing: border-box;
}
</style>
