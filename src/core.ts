//游戏循环的核心函数
import Decimal from 'break_eternity.js'
import { player } from '@/data/player'
import { addValue, localSave } from '@/save/save'
import { updateLayers } from '@/logic/update'
import { updateAutomations } from '@/logic/automations'
import { getMetaLayers } from '@/meta/registry'
import { updateAchievements } from '@/logic/achievements'
import { addLog } from '@/log'
import { formatTime } from '@/tools/format'
import { temp } from '@/temp'
import { settings } from '@/settings'
import { OFFLINE_THRESHOLD } from '@/data/constants'

const FPS: number = 30
let saveTimer = 0
/**自动保存循环，每秒检测一次 */
export function autoSaveLoop() {
  saveTimer++
  if (saveTimer >= settings.autoSaveInterval) {
    saveTimer = 0
    localSave()
    addLog('info', '游戏已保存')
  }
}
/**游戏循环，dt以秒为单位 */
function gameLoop(dt: Decimal) {
  addValue('totalTime', dt)
  dt = dt.mul(temp.psdSpeed)
  updateLayers(dt)
  for (const meta of getMetaLayers()) meta.onTick(dt)
  updateAutomations(dt)
  updateAchievements()
}
/**游戏暂停和恢复 */
export function pause() {
  player.paused = !player.paused
}
/**游戏前进1帧 */
export function tick() {
  gameLoop(new Decimal(1 / FPS))
}
/**真·主循环 */
export function mainLoop() {
  let dt = new Decimal((Date.now() - player.lastPlay) / 1000)
  player.lastPlay = Date.now()
  if (player.paused) {
    //检测游戏是否暂停
    addValue('offlineTime', dt)
  } else if (dt.gte(OFFLINE_THRESHOLD)) {
    //若距上一次加载超过一定时间，则认为玩家离线
    addLog('info', `欢迎回来!你离线了${formatTime(dt)}.`)
    addValue(player.enableOfflineProgress ? 'warpTime' : 'offlineTime', dt)
  } else {
    //每帧消耗1%的加速时间，直到小于1秒
    if (player.warpTime.gte(1)) {
      const consumeWarpTime: Decimal = player.warpTime.mul(0.01)
      addValue('warpTime', consumeWarpTime.neg())
      dt = dt.add(consumeWarpTime)
    }
    gameLoop(dt)
  }
  setTimeout(mainLoop, 1000 / FPS)
}
