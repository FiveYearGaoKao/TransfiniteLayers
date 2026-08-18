<script setup lang="ts">
import { ref } from 'vue'
import { player } from '@/data/player'
import { getAchievements, type AchievementDef } from '@/logic/achievements'
import { format } from '@/tools/format'
import { STORY } from '@/data/story'

type achTab = 'achievements' | 'story'
const subtab = ref<achTab>('achievements')
/**当前悬停的成就及其tooltip位置 */
const tip = ref<{ def: AchievementDef; x: number; y: number } | null>(null)
/**显示成就tooltip(定位在卡片上方) */
function showTip(def: AchievementDef, e: MouseEvent) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  tip.value = { def, x: rect.left + rect.width / 2, y: rect.top }
}
</script>
<template>
  <div id="achievements">
    <div class="subtabRow">
      <button
        :class="{ subTab: true, selected: subtab == 'achievements' }"
        @click="subtab = 'achievements'"
      >
        成就
      </button>
      <button :class="{ subTab: true, selected: subtab == 'story' }" @click="subtab = 'story'">
        剧情
      </button>
    </div>

    <div v-if="subtab == 'achievements'">
      <span class="text"
        >已解锁成就: {{ player.achievements.length }} / {{ getAchievements().length }}，知识:
        {{ format(player.knowledge) }}</span
      >
      <div id="achievementList">
        <div
          v-for="a in getAchievements()"
          :key="a.id"
          :class="['achievement', player.achievements.includes(a.id) ? 'bought' : '']"
          @mouseenter="showTip(a, $event)"
          @mouseleave="tip = null"
        >
          <span class="text name">{{ a.name }}</span>
          <span class="text reward">+{{ a.reward }} 知识</span>
        </div>
      </div>
    </div>

    <div v-if="subtab == 'story'" id="storyList">
      <span v-if="STORY.length == 0" class="text">暂无剧情</span>
      <div v-for="c in STORY" :key="c.id" class="story" :class="{ locked: !c.isUnlocked() }">
        <span class="text bold">{{ c.title }}</span>
        <span class="text" v-if="c.isUnlocked()">{{ c.text }}</span>
        <span class="text" v-else>未解锁</span>
      </div>
    </div>
  </div>
  <Teleport to="body">
    <div v-if="tip" class="achievementTip" :style="{ left: tip.x + 'px', top: tip.y + 'px' }">
      {{ tip.def.description }}
      <div v-if="tip.def.effectText" class="effect">{{ tip.def.effectText }}</div>
    </div>
  </Teleport>
</template>
<style scoped>
div#achievements {
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
div#achievementList {
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  gap: 4px;
  padding: 4px;
  width: 100%;
  box-sizing: border-box;
}
div.achievement {
  border: 2px solid var(--faint);
  padding: 4px;
  background-color: var(--panel);
  color: var(--faint);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  &.bought {
    border-color: var(--good-border);
    background-color: var(--good-bg);
    color: var(--text);
  }
}
div.achievement .name {
  font-size: 13px;
}
div.achievement .reward {
  font-size: 11px;
}
div.achievementTip {
  position: fixed;
  transform: translate(-50%, -100%);
  background-color: var(--panel);
  border: 1px solid var(--dim);
  color: var(--text);
  padding: 4px;
  z-index: 1000;
  max-width: 260px;
  font-size: 12px;
  pointer-events: none;
}
div.achievementTip .effect {
  color: var(--good-border);
  margin-top: 2px;
}
div.story {
  border: 2px solid var(--faint);
  width: 360px;
  padding: 4px;
  &.locked {
    color: var(--faint);
  }
}
/*按主体实际宽度调整列数(容器查询,而非视口宽度)*/
@container (max-width: 900px) {
  div#achievementList {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
}
@container (max-width: 680px) {
  div#achievementList {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
@container (max-width: 460px) {
  div#achievementList {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
