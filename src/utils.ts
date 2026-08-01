//游戏中用到的辅助函数
import Decimal, { type CompareResult } from 'break_eternity.js'
/**硬拷贝 */
export function hardCopy(obj: any): any {
  return JSON.parse(JSON.stringify(obj))
}
//------随机数相关------
/**可SL的随机整数，左闭右开 */
export function randInt(left: number, right: number): number {
  return left + Math.floor(Math.random() * (right - left))
}

//------比较相关------
type compFunc<T> = (arg0: T, arg1: T) => CompareResult
type greaterFunc<T> = (arg0: T, arg1: T) => boolean
export const numComp = (a: number, b: number) => (a > b ? 1 : a < b ? -1 : 0)
export function greaterToCompFunc<T>(gt: greaterFunc<T>): compFunc<T> {
  return (a: T, b: T) => (gt(a, b) ? 1 : gt(b, a) ? -1 : 0)
}
/**字典序比较 */
export function lexOrder<T>(seq1: T[], seq2: T[], comp: compFunc<T>): CompareResult {
  for (let i = 0; i < seq1.length; ++i) {
    const a = seq1[i]
    const b = seq2[i]
    if (b == null) {
      return 1
    } else if (a == null) {
      return -1
    } else {
      const res: CompareResult = comp(a, b)
      if (res != 0) return res
    }
  }
  return seq2.length > seq1.length ? -1 : 0
}
/**先比较长度，再从高到低依次比较 */
export function arrayOrder<T>(seq1: T[], seq2: T[], comp: compFunc<T>): CompareResult {
  if (seq1.length > seq2.length) return 1
  else if (seq2.length > seq1.length) return -1
  else return lexOrder<T>(seq1, seq2, comp)
}
//------版本号相关------
/**将版本号字符串转化为数组 */
export function parseVersion(v: string): number[] {
  return v.slice(1).split('.').map(parseInt)
}
/**比较版本号 */
export function versionComp(a: string, b: string): CompareResult {
  const arrayA: number[] = parseVersion(a)
  const arrayB: number[] = parseVersion(b)
  return lexOrder<number>(arrayA, arrayB, numComp)
}
