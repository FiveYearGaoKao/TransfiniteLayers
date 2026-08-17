//价格软上限的纯函数变换(与存档/效果无关,故置于tools)
//低于阈值不处理;高于阈值时对价格的"对数"做幂次放大,使价格呈超指数增长
import Decimal from 'break_eternity.js'

/**对价格应用对数软上限:value<=threshold原样返回,否则对数按power次方放大(幂越大越陡) */
export function softCapValue(value: Decimal, threshold: Decimal, power = 2): Decimal {
  if (value.lte(threshold)) return value
  const L = threshold.log10()
  const y = value.log10().div(L).pow(power).mul(L)
  return Decimal.pow(10, y)
}
