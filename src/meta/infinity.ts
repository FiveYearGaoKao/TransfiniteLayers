//无限元重置层:v0.1.0只做框架,不含升级/重置机制
//解锁条件为成就a48(达到1.79e308点数),成就不会被重置
import { registerMetaLayer } from './registry'
import { hasAchievement } from '@/access'
import InfinityLayer from '@/components/features/infinityLayer.vue'

registerMetaLayer({
  id: 'infinity',
  name: '无限',
  isUnlocked: () => hasAchievement('a48'),
  onTick: () => {},
  component: InfinityLayer,
})
