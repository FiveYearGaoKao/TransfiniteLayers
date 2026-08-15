//储存各种不写入存档的缓存数据
import { reactive, computed } from 'vue'
import type { LayerList } from '@/data/types'
import Decimal from 'break_eternity.js'
export const temp = reactive({
  tempLayers: {} as LayerList,
  /**伪现实速度 */
  psdSpeed: computed(() => {
    return new Decimal(10)
  }),
})
