//种子随机数生成器
//可玩性相关的随机数应由存档种子决定,不能被SL或Math.random控制
//随机状态随player.rngState持久化,刷新/读档后从上次状态继续,避免随机序列重置
import { player } from '@/data/player'
let state = 0
/**用种子初始化随机数生成器(同时写回存档状态) */
export function seedRng(seed: number) {
  state = seed >>> 0
  player.rngState = state
}
/**生成下一个[0,1)的伪随机数 */
export function rng(): number {
  state = (state + 0x6d2b79f5) >>> 0
  let t = state
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  const res = ((t ^ (t >>> 14)) >>> 0) / 4294967296
  player.rngState = state
  return res
}
/**种子随机整数，左闭右开 */
export function seedInt(left: number, right: number): number {
  return left + Math.floor(rng() * (right - left))
}
