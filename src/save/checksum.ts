//存档校验码
import type { Player } from '@/data/player'
/**随便用多项式生成一个校验码 */
export function checkCode(s: string, x: number): number {
  const M = 257
  const P = 10000019
  let S = 114514
  const l = s.length
  const A: number[] = new Array(M).fill(0)
  let p = 1
  for (let i = 0; i < l; ++i) {
    const c = s.charCodeAt(i) * s.charCodeAt(i >> 1)
    S ^= c
    p = (p + c + i) % M
    A[p] = ((A[p] || 0) + S) % P
  }
  x = x % P
  let res = 0
  for (let i = 0; i < M; ++i) {
    res = (res * x + (A[i] || 0)) % P
  }
  return res
}
/**生成存档的校验码并和原来的校验码比较 */
export function check(p: Player): boolean {
  const previousCheckCode = p.checkCode
  p.checkCode = 0
  p.checkCode = checkCode(JSON.stringify(p), p.firstPlay)
  return previousCheckCode == p.checkCode
}
