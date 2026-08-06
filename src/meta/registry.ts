//元重置层注册表
//无限/奇点/树/序数等元重置层统一通过这里注册
import Decimal from 'break_eternity.js'
import type { Component } from 'vue'

/**元重置层定义 */
export interface MetaLayerDef {
  id: string
  /**显示名称 */
  name?: string
  /**是否已解锁 */
  isUnlocked(): boolean
  /**每帧更新 */
  onTick(dt: Decimal): void
  /**对应的UI组件 */
  component?: Component
}

const metaLayers: MetaLayerDef[] = []

/**注册一个元重置层 */
export function registerMetaLayer(def: MetaLayerDef) {
  metaLayers.push(def)
}

/**获取所有已注册的元重置层 */
export function getMetaLayers(): MetaLayerDef[] {
  return metaLayers
}
