# 《超限层级》(TransfiniteLayers) 项目文档

> 本文档供开发者/新 AI Agent 理解项目现状、架构与约定。项目处于**开发早期**，机制以《超限层级》策划文档.md 为准，本文只描述已实现部分。

## 一、项目概述

- 增量游戏（idle game），含多层重置：**ω^ω 个常规层级** + 未来 5 个元重置层（无限/奇点/树/天体/序数，未实现）。
- 层级玩法类似《反物质维度》：每层有维度生产资源，高层重置清低层并获得点数。
- 单机本地运行，无联网机制。

## 二、技术栈

- **Vue 3.5 + Vite 7 + TypeScript 5.9**
- `break_eternity.js`：大数（Decimal），支持 10^10^…（1e308 个 10）
- `lz-string`：存档压缩（base64）
- `pako`：已安装但**未使用**
- Node `^20.19.0 || >=22.12.0`；Windows 下需注意 `npm ci` 后 build（此前有原生二进制损坏导致崩溃的先例）

常用命令：`npm run dev` / `npm run build`（type-check + build-only）/ `npm run lint`（eslint --fix）/ `npm run format`（prettier）。

## 三、目录结构（src/）

```
tools/    # 纯函数、零依赖
  ordinal.ts    # 层级坐标/序数运算(纯函数)
  format.ts     # 数字/时间格式化
  utils.ts      # 随机数、比较、版本
data/     # 类型与常量
  types.ts      # Layer/LayerId/Player 子结构/自动化类型/初始化和默认值
  constants.ts  # 游戏常量
  player.ts     # Player 接口、initializeSave、reactive player
  changelog.ts  # 更新记录
  story.ts      # 剧情(空)
save/     # 存档
  save.ts       # 序列化/导入导出/硬重置
  checksum.ts   # 校验码(被禁用,见下)
  migration.ts  # 迁移框架(空)
  rng.ts        # 种子PRNG(已实现,尚未接入可玩性随机)
access/   # 只读访问 player 的便捷函数(含层级0特殊处理)
compute/  # 只读计算,不写状态
  effects.ts    # 加成管道(核心)
  dimensions.ts # 维度公式/产量
  energy.ts     # 能量加成:高层能量给低层维度随时间递增加成
  prestige.ts   # 重置收益
  upgrades.ts   # 升级定义 u1-u9 与效果注册
  buyables.ts   # 可购买 b11-b13 与效果注册
  buying.ts     # 统一购买数量计算(sumCost/maxBuyable)
logic/    # 写状态
  update.ts     # 主循环更新层级
  reset.ts      # 重置引擎(doReset/resetData)
  purchase.ts   # 购买(维度/可购买/升级)
  automations.ts# 自动化注册表与执行
  achievements.ts # 成就注册表 a11-a18
  challenges.ts # 挑战注册表(空)
meta/     # 元重置层注册表(空)
core.ts   # 主循环 mainLoop/autoSaveLoop
settings.ts # 设置(主题/开关,独立 localStorage)
log.ts    # 日志
news.ts   # 滚动新闻
temp.ts   # 运行时缓存(临时层/tempLayers)
components/
  features/  # 各页面: layers/options/achievements/knowledge/challenges/automation
  newsBar/resourceBar/navigatorBar/logBar/toolBar
```

## 四、核心架构：分层与循环引用防护

依赖方向**严格单向**（禁止向上引用）：

```
tools → data → save/access → compute → logic → meta → ui
```

三条铁律：

1. **`compute` 层只读**：计算函数只读状态并返回结果，绝不写状态。
2. **依赖单向**：`meta` 向 compute 注册加成分、向 logic 注册行为；compute/logic 不 import meta。
3. **重置先算后写**：doReset 先算收益再统一写状态。

### 加成管道（effects.ts，核心机制）

所有数值加成统一走管道。效果以**数据声明**（target/type/槽位），计算、统计、描述自动派生，新机制只需注册声明，不用改核心公式：

```ts
// 效果定义(注册时自动补 id/name)
interface EffectDef {
  target: string // 主目标或子目标(如 'b11:base')
  type: 'add' | 'mul' | 'exp' | 'custom'
  value?(ctx, base?, amount?, current?): DecimalSource
  base?: EffectSlot // 可调参数槽位(底数/指数/等级),可被子目标修饰
  amount?: EffectSlot // 等级槽位(仅维度/可购买)
  text?: string // 文字模板:{value}{base}{basePercent}{amount}
  order?: number // 覆盖默认优先级
  isActive?(ctx): boolean // 生效条件,缺省始终生效
}
interface EffectSlot {
  target: string // 子目标标识,其他效果可对其实施修饰
  init(ctx): DecimalSource
}
```

- `type` 语义：`add`→值+value、`mul`→值×value、`exp`→值^value、`custom`→替换为 value。
- `value` 缺省时 `mul→base^amount`、`add→base×amount`（需声明 base+amount 槽位）；取整写在 value 内部。
- **两阶段管道**：先组合槽位（`slotValue`，初始值上依序应用子目标效果），再按类型优先级合并主效果。
- **优先级**：add→mul→exp→custom（`order` 可覆盖）。
- **自动注册**：`UPGRADES`/`BUYABLES` 数组内直接带 `effect` 字段，模块加载时循环 `registerEffect`；id 全局唯一（重复即抛错）。
- **按 id 引用加成数值**：`effectById(id)` / `effectValueById(id, ctx)`（未注册返回 1），如 `energyBonus` 内部即 `effectValueById('energy', ...)`。
- 派生函数：`calculate`（总效果）/ `effectBreakdown`+`slotBreakdown`（统计明细）/ `effectText`+`renderText`（描述模板）。

`EffectContext = { pos: LayerId, id: number }`。

## 五、层级系统

- 层级坐标 = 任意长数组：`[a1,...,an]` 表示 ω^(n-1)·a1+…+an。
- 纯函数在 `tools/ordinal.ts`：`posArray/shiftLayer/getLayerOrder/getLayerIndex/nextLayer/prevLayer/isLayer0/compareLayer`。
- `access/index.ts` 提供读 player 的函数：`getLayer/isActive/getLayerName/getPoints/getEnergy/dimensionAmount/highestActiveLayer/prevLayer/higherLayer/getLayerDepth/hasAnyUpgrade`。
- **层级0 特殊**：无重置按钮、维度1 产点数（其余层产能量）、energy 恒 0、永不清除。通过 `isLayer0` + `getPoints/getEnergy` 收敛。
- 解锁链：层级0 → 层级1 `[1]` → 层级2…（reset 临时层 `[-1]` 产生下一层）。
- `prevLayer`/`higherLayer` 表示相邻层；注意层级0 的 `prevLayer([0]) === [0]`，`higherLayer` 已跳过自身。

## 六、已实现系统

### 1. 升级（compute/upgrades.ts）

- 注册表 `UPGRADES: UpgradeDef[]`（id/name/description/order/cost/effect?/effectText?/isUnlocked/requires），数值效果经 `effect` 字段声明并自动注册。
- 通用升级 u1-u9，显示于阶 0 层（层级0 只出现 u2/u3）：
  - u1 点数作用（下层点数获取×对数式加成 (ln(点数)+1)^2，指数为 `u1:base` 槽位）、u2 自协同（每维度×(该维度已购+1)）、u3 额外加速器（向 `b11:amount` 槽位加 floor(已购维度总等级×0.1+升级数量)）
  - u4 自动化1、u5 自动化2、u6 自动重置（解锁自动化，见下）
  - u7 能量保留、u8 升级保留、u9 软重置（层级2+）
- 一次性购买，三态（无法购买/可购买/已购买）；`requires` 控制顺序（u5→u4、u6→u5、u8→u7、u9→u8）。
- 效果声明在 `effect` 字段，自动注册时注入 `isActive`（本层购买后生效，重置清空升级自动失效）；u1 例外——其生效条件是"上层已购买 u1"。
- u3 作用于加速器等级槽位 `b11:amount`：免费加速器等级 = floor(已购维度总等级×0.1 + 升级数量)；b11 按"已购+免费"生效。

### 2. 可购买（compute/buyables.ts）

- `BUYABLES: BuyableDef[]`：b11 加速器、b12 加倍器、b13 加速器加成；效果经 `effect` 字段声明并自动注册（b11/b12 为 `base^amount`，b13 对 `b11:base` 做加法修饰）。
- `cost(layer, n)`：n 为已购数（统一接口，见 buying.ts）。
- b13 由**成就 a21** 解锁（达成后一次性所有层级可用），`onBuy` 清空本层点数/维度/加速器/加倍器（一次性）。
- b11 的加速器等级计入 u3 提供的免费等级（等级槽位 `b11:amount` 组合值 = 已购+免费）。

### 3. 自动化（logic/automations.ts）

- **注册表模式**：`AUTOMATIONS: AutomationDef[]`（dims/buyables/reset 三个定义）。
- `AutomationDef`：`id/name/defaultCfg/isUnlocked/isActive/setAll/onTick`。
- 解锁：层 L 的维度自动化=**上层**买 u4；可购买=**上层**买 u5；自动重置=**本层**买 u6。
- 配置存 `player.automations[key] = { cfgs: Record<id, AutoConfig> }`；缺失自动补默认；旧结构自动迁移。
- **开关模型**：运行只取决于"小开关"（维度/可购买的 perItem、自动重置的 enabled）；高层的"全部/本层/类型"开关只是批量切换（至少一个开→全关，全关→全开）。
- 自动重置条件：时间（用 `prevLayer` 的 resetTime，因为重置清下层）/ 点数 / 倍率，`combine: any|all`；point/mult 为 Decimal。

### 4. 购买数量统一（compute/buying.ts）

- `BuyableItem`：`amount()` + `cost(n)`（n=已购数，与现状一致）。
- `sumCost(item, k)`：最后 3 项近似（超指数下前项可忽略，允许误差）。
- `maxBuyable(item, budget)`：从 2 开始平方倍增上界 + 数值二分（`mid.floor()` 保证整数）+ 微调，循环带 2000 上界。只依赖 cost 单调，支持软上限/分段/改价。

### 5. 成就 + 知识（logic/achievements.ts）

- `registerAchievement`，已注册 a11-a18、a21；解锁发日志(progress) + 知识奖励。
- 知识：`player.knowledge`（Decimal）；≥10 永久解锁知识标签。
- 成就页每行 8 个，已解锁绿色，悬停 tooltip 显示描述。

### 6. 存档（save/save.ts）

- **新格式**：`stringify` 用 `markDecimals` 深度遍历把 Decimal → `{$d: 字符串}`；读档 `unmarkDecimals` 只还原 `$d`，普通字符串不误转（成就 id 等安全）。
- 校验码 `check` 被 `0 &&` 禁用（策划说之后换更简单的实现）。
- 防穿越：lastPlay/firstPlay 时间校验；`seed` 字段已存，rng.ts 已实现但可玩性随机尚未接入（新闻用 Math.random）。
- 开发期不考虑旧档迁移（migration.ts 为空）。

### 7. 设置/主题/统计/关于

- `settings.ts`：主题（THEMES 列表 + cycleTheme，加新主题需改 themeType + style.css 变量）、新闻开关、日志开关、自动保存间隔、日志类型过滤（独立 localStorage，不进存档）。
- 主题：`body.dark/light` class + CSS 变量（style.css `:root`/`body.light`）。组件颜色全部用 `var(--...)`。
- options 页子界面：设置/关于游戏（版本+更新记录）/统计（时间 + 加成明细树：当前层逐维度总乘数/总指数及各来源，可下拉展开到槽位底数/数量及其修饰来源）。

### 8. UI 与布局

- 导航栏标签数据驱动（`navigatorBar.vue`）：层级/选项/成就常显；知识(≥10知识解锁)；挑战(isActive([3]))；自动化(hasAnyUpgrade(4))；元层(meta registry isUnlocked)。
- 断点 700px：窄屏/矮屏中区改纵向，导航横向可换行、日志底部限高。
- 按钮体系：**类型 class 决定大小**（subTab/prestige/buyable/upgrade/mainTab/toggle），**状态 class 决定颜色**（selected/affordable/bought/toggle-on/toggle-off/meta），全局在 style.css。
- 日志：相同类型+文本合并计数、按类型过滤、清空按钮。

### 9. 主循环（core.ts）

- `mainLoop`（setTimeout 30fps）：暂停检测→离线检测→warpTime 消耗→`gameLoop(dt)`。
- `gameLoop`：累计时间 → `updateLayers`（含 resetTime 累加）→ 元层 onTick → `updateAutomations` → `updateAchievements`。
- `autoSaveLoop` 每 `settings.autoSaveInterval` 秒保存。

### 10. 重置公式与能量系统

- 重置收益（compute/prestige.ts）：层1 = `floor((点数0/1e16)^0.1)`；层2+ = `floor((点数_{k-1}/1e4)^0.25)`。首次重置各层恰好 +1 点，低指数削减挂机优势。
- 能量系统（compute/energy.ts）：层 k 维度1 产能量，层 k 能量给层 k-1 所有维度 `×(1+E_k)^q`（q=`ENERGY_BONUS_EXPONENT`，存于 `energy:base` 槽位可被升级/挑战修改），沿层级链向上传导，是点数攀升到 1e308 的主力乘区。

## 七、未实现 / 待办

- **挑战系统**（logic/challenges.ts 空）：挑战页子标签（普通/无限/奇点/树/序数）、进入执行对应重置。
- **知识购买**：目前知识只解锁标签，无购买内容（加成/QoL/离线时间）。
- **连点器 / 自动机**：自动化页预留（知识解锁）。
- **元层**（meta/registry.ts 空）：无限/奇点/树/序数。
- **平衡性调整**。
- 校验码新实现、种子随机接入、剧情 STORY 填充、挑战/元层效果注册。

## 八、代码约定（务必遵守）

1. **中文注释**；每个新函数前加**中文 jsDoc** 注释。
2. **注册表模式**：DIMENSIONS / BUYABLES / UPGRADES / achievements / AUTOMATIONS 都是"定义数组 + 访问函数"。
3. 依赖方向单向；compute 层只读。
4. 数字用 `Decimal`（break_eternity），禁止裸 number 存大数。
5. 存档结构改动需处理 `initializeSave` + load 兜底（必要时 migration）。
6. UI 新颜色用 `var(--...)` 主题变量；按钮用"类型 + 状态"双 class。
7. 修改前先看相关文件现状；改完跑 `npm run type-check`、`npm run lint`、`npm run build`。
8. 与策划歧义时以《超限层级》策划文档.md 为准，并询问用户确认。

## 九、快速上手建议

1. `npm install` → `npm run dev`。
2. 从 `data/types.ts`（Player/层级结构）→ `compute/effects.ts`（加成管道）→ `logic/automations.ts`（注册表范例）→ `save/save.ts`（存档格式）读起。
3. 新增玩法系统遵循：类型定义 → 注册表定义 → 效果经 effects 管道 → UI 组件挂到 mainTab → 存档字段（含 load 兜底）。
