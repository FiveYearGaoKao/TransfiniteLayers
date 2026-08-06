<script setup lang="ts">
import { player } from '@/data/player'
import { format } from '@/tools/format'
</script>
<template>
  <div id="knowledge">
    <span class="text">知识: {{ format(player.knowledge) }}</span>
    <span class="text">知识购买功能开发中</span>
  </div>
</template>
