<script setup lang="ts">
import { format } from '@/tools/format'
import { getPoints } from '@/access'
</script>
<template>
  <div id="infinity">
    <span class="text bold">无限</span>
    <span class="text">你拥有 {{ format(getPoints([0])) }} 点数,终于触碰到 1.79e308。</span>
    <span class="text">但 1.79e308 并不是真正的无限——它只是一个精度的终点。</span>
    <span class="text">无限层正在建设中。进行第一次无限重置后,这里将解锁无限升级。</span>
  </div>
</template>
<style scoped>
div#infinity {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px;
}
</style>
