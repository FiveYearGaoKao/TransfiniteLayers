import Decimal, { type DecimalSource } from 'break_eternity.js'

//------类型声明------
export interface Layer {
  active: boolean
  level: Decimal
  points: Decimal
  energy: Decimal
  totalPoints: Decimal
  resetTime: Decimal
  upgrades: number[]
  buyables: Record<number, Decimal>
  /**第一项为总数，第二项为购买数量*/
  dimensions: [Decimal, Decimal][]
}
export type LayerList = Record<string, Layer | null>
export type LayerId = number[]
export type _Layer = number[] | Layer | undefined
/**初始化一个层级的维度*/
export function initializeDimensions(layer: Layer) {
  layer.dimensions = []
  for (let i = 0; i < 4; ++i) layer.dimensions.push([new Decimal(0), new Decimal(0)])
}
/**
 * 创建一个空白层级
 * @param isLayer0 层级0初始有1点数，其他层级为0
 */
export function initializeLayer(level: DecimalSource, isLayer0: boolean = false): Layer {
  const layer: Layer = {
    active: true,
    level: new Decimal(level),
    points: isLayer0 ? new Decimal(1) : new Decimal(0),
    energy: new Decimal(0),
    totalPoints: new Decimal(0),
    resetTime: new Decimal(0),
    upgrades: [],
    buyables: {},
    dimensions: [],
  }
  initializeDimensions(layer)
  return layer
}
/**一个空层级，防止getLayer返回undefined */
export const nullLayer = initializeLayer(0)
nullLayer.active = false
