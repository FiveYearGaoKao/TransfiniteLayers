//数字格式化函数
import Decimal, { type DecimalSource } from 'break_eternity.js'

//一般的格式化
export function format(x: DecimalSource, precision: number = 3): string {
  const xd: Decimal = new Decimal(x)
  if (xd.isNan()) return 'NaN'
  else if (xd.sign < 0) return '-' + format(xd.neg(), precision)
  else if (!xd.isFinite()) return 'Infinity'
  else if (xd.layer >= 1e6) return 'F' + format(xd.slog(), precision)
  else if (xd.layer >= 5) return xd.mag.toFixed(precision) + 'F' + xd.layer
  else if (xd.layer >= 1) {
    if (xd.mag >= 1e6) {
      return 'e'.repeat(xd.layer) + format(xd.mag, precision)
    } else {
      const exp = Math.floor(xd.mag)
      const mag = Math.pow(10, xd.mag - exp)
      return 'e'.repeat(xd.layer - 1) + mag.toFixed(precision) + 'e' + exp.toFixed(0)
    }
  } else if (xd.gte(1e6)) {
    const exp = Math.floor(Math.log10(xd.mag))
    const mag = xd.mag / Math.pow(10, exp)
    return mag.toFixed(precision) + 'e' + exp.toFixed(0)
  } else if (xd.gte(1000)) return xd.mag.toFixed(0)
  else if (xd.gte(0.001)) return xd.mag.toFixed(precision)
  return (0).toFixed(precision)
}
//格式化整数
//Copied from "The moddin tree"
export function formatWhole(x: DecimalSource) {
  const xd: Decimal = new Decimal(x)
  if (xd.gte(1e9)) return format(xd, 2)
  if (xd.lte(0.99) && !xd.eq(0)) return format(xd, 2)
  return format(xd, 0)
}
//格式化时间
export function formatTime(x: DecimalSource): string {
  const xd = new Decimal(x)
  if (xd.eq(0)) return '0秒'
  else if (xd.lt(0)) return '-' + formatTime(xd.neg())
  else if (xd.gte(3.1536e9)) return format(xd.div(31536000)) + '年'
  else {
    const xn = xd.toNumber()
    if (xn >= 31536000) return (xn / 31536000).toFixed(0) + '年' + (xn % 31536000).toFixed(2) + '天'
    else if (xn >= 1) {
      const seconds = xn % 60
      const minutes = Math.floor(xn / 60) % 60
      const hours = Math.floor(xn / 3600) % 24
      const days = Math.floor(xn / 86400)
      return (
        (xn >= 86400 ? days + '天' : '') +
        (xn >= 3600 ? hours + '小时' : '') +
        (xn >= 60 ? minutes + '分' : '') +
        (seconds.toFixed(3) + '秒')
      )
    } else if (xn > 1e-3) return (xn * 1000).toFixed(0) + '毫秒'
    else return '<1毫秒'
  }
}
