//存档迁移机制
//新的内容加入后，旧存档可能缺少某些字段，需要通过迁移来补齐
import type { Player } from '@/data/player'
import { versionComp } from '@/tools/utils'

/**一次迁移，将存档从from版本升级到to版本 */
export interface Migration {
  from: string
  to: string
  apply(save: Player): void
}
/**所有已注册的迁移，按注册顺序应用 */
export const migrations: Migration[] = []
/**应用所有比当前版本更新的迁移 */
export function migrate(save: Player): void {
  for (const m of migrations) {
    if (versionComp(save.version, m.to) < 0) {
      m.apply(save)
      save.version = m.to
    }
  }
}
