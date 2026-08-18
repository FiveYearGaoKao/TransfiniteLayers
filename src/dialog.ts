//全局对话框系统:队列 + Promise API,悬浮于所有业务UI之上(不暂停游戏)
import { computed, reactive } from 'vue'

/**确认框选项 */
export interface ConfirmDialogOptions {
  /**标题 */
  title: string
  /**说明文字 */
  text: string
  /**确认按钮文字 */
  confirmText?: string
  /**取消按钮文字 */
  cancelText?: string
}

/**槽位选择框选项 */
export interface SlotDialogOptions {
  /**标题 */
  title: string
  /**选择用途:保存到槽位/从槽位读档 */
  mode: 'save' | 'load'
}

/**队列中的对话框条目 */
interface DialogEntry {
  kind: 'confirm' | 'slots'
  options: ConfirmDialogOptions | SlotDialogOptions
  /**玩家关闭对话框时回传的值:确认框为boolean,槽位框为槽位序号或null */
  resolve: (value: boolean | number | null) => void
}

const queue = reactive([] as DialogEntry[])

/**当前显示的对话框(队列首项) */
export const currentDialog = computed<DialogEntry | undefined>(() => queue[0])

/**弹出确认框,resolve值为是否确认 */
export function openConfirm(options: ConfirmDialogOptions): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    queue.push({ kind: 'confirm', options, resolve: (v) => resolve(v == true) })
  })
}

/**弹出存档槽位选择框,resolve值为所选槽位或取消(null) */
export function openSlots(options: SlotDialogOptions): Promise<number | null> {
  return new Promise<number | null>((resolve) => {
    queue.push({
      kind: 'slots',
      options,
      resolve: (v) => resolve(typeof v == 'number' ? v : null),
    })
  })
}

/**关闭当前对话框并回传结果 */
export function closeDialog(value: boolean | number | null) {
  const entry = queue.shift()
  entry?.resolve(value)
}
