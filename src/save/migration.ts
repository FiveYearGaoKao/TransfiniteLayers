//存档迁移机制
//职责:对旧存档做"数据转换"(如重命名、重算字段),而不是补默认字段
//补字段由 initializeSave + Object.assign 负责,迁移只处理需要变换的数据
//注意:迁移函数运行在无默认值的原始存档对象上,必须自包含,不能假设字段已存在
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
    if (
      versionComp(save.version, m.from) >= 0 &&
      versionComp(save.version, m.to) < 0
    ) {
      m.apply(save)
      save.version = m.to
    }
  }
}
