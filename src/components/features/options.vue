<script setup lang="ts">
import { formatTime } from '@/format'
import { player } from '@/player'
</script>
<template>
  <span class="text">此存档于{{ new Date(player.firstPlay).toTimeString() }}创建</span><br />
  <span class="text">你有{{ formatTime(player.offlineTime) }}的离线时间</span><br />
  <span class="text">你一共玩了{{ formatTime(player.totalTime) }}.</span><br />
  <span class="text" v-if="player.warpTime.gte(1)"
    >时间扭曲剩余:{{ formatTime(player.warpTime) }}.</span
  ><br />
</template>
