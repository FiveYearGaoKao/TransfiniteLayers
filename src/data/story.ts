//剧情(如果有的话，随游戏进度解锁)
export interface StoryChapter {
  id: string
  title: string
  text: string
  /**是否已解锁 */
  isUnlocked(): boolean
}

export const STORY: StoryChapter[] = [
  //例如:{ id: 'intro', title: '序章', text: '...', isUnlocked: () => true }
]
