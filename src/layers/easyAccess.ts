//快速访问层级的属性
import Decimal, { type DecimalSource } from 'break_eternity.js'
import type { Layer, _Layer } from './types'
import { getLayer } from '.'

/**
 * 获取某维度的数量
 * @param type 0表示总数，1表示购买数量
 */
export function dimensionAmount(layer: _Layer, id: number, type: number = 0): Decimal {
  if (layer instanceof Array) layer = getLayer(layer)
  return layer?.dimensions[id]?.[type] || new Decimal(0)
}
/**
 * 增加某维度的数量
 * @param type 0表示总数，1表示购买数量
 */
export function addAmount(layer: _Layer, id: number, amount: DecimalSource, type: number = 0) {
  if (layer instanceof Array) layer = getLayer(layer)
  let dim = layer?.dimensions[id]
  if (dim) dim[type] = dimensionAmount(layer, id, type).add(amount)
}
/**
 * 设置某维度的数量
 * @param type 0表示总数，1表示购买数量
 */
export function setAmount(layer: _Layer, id: number, amount: DecimalSource, type: number = 0) {
  if (layer instanceof Array) layer = getLayer(layer)
  let dim = layer?.dimensions[id]
  if (dim) dim[type] = new Decimal(amount)
}
