# Utopia Engine · 本地单文件版（HTML）

一个**零依赖的单文件实现**：`utopia-engine.html`，下载后双击就能在浏览器里玩（不需要网络）。

> 这是对 Nick Hayes 的免费单人骰子游戏 **Utopia Engine**（3rd Edition）的爱好者实现。
> 原作与规则归作者所有，玩法数据取自作者公开发布的规则 PDF 与官方网页版，仅用于自己在终端/浏览器里玩。
> 支持原作：官方免费在线网页版 https://introscopia.github.io/en/Game_Development/Utopia_Engine/ · itch.io https://introscopia.itch.io/utopia-engine

## 在线试玩
**https://celestial-42.github.io/utopia-engine/**
不想联网的话，下载 [`utopia-engine.html`](utopia-engine.html) 直接用浏览器打开即可（单文件、零依赖、断网可玩）。

改完想重新发布站点：`./deploy-pages.sh`（把 main 里的 HTML 同步到 Pages 的 `gh-pages` 分支）。

# Utopia Engine 速查（3rd Edition · Nick Hayes · 免费）

单人骰子游戏，口号是 "A solitaire dice game of reconstructing the end of time"。
2010 年首发免费 → 2020 年 3e 重做 → 现在有官方网页版可以直接玩。BGG 上 8.09/10（278 人评分）。

## 组件与背景
- 铅笔 + 橡皮 + 两颗 d6 + 两张冒险表（野外表 / 神器工坊表）
- 你扮演老工匠 Isodoros。末世将至，"神之手"机器失效，公会只剩 14 天：
  去 6 个死亡地区找回组成 **Utopia Engine** 的 6 件神器，激活、连线，最后启动它。

## 核心：Search（唯一的基本动作）
一次搜索 = 掷 **3 次 2d6**，每次把两颗骰子分别填进一个 **2×3 的数字格**（上排三位数、下排三位数）。
填完后 `上排三位数 − 下排三位数 = 搜索结果`，**目标是把差落在「小的正数」上：0 最赚，负数一律算遭遇**。

> **重要**：区间只对**正数**成立 —— 任何负数结果一律是遭遇战（−1 也要打），
> 而 −10 类修正同样只对正数生效、并且**下限截到 0**。所以手里有镜子/透镜（或吃到好运事件）时，
> 把结果控制在 1–10 会直接变成 0 = **已激活的神器 + 2 点神之手能量**，这是全游戏最赚的一格。

| 结果 | 得到 |
|---|---|
| 0 | **已激活的神器**（直接进工坊就序，另 +2 点神之手能量） |
| 1–10 | 未激活的神器 |
| 11–99 | 一个材料（元件罐最多 4 个，满了作废） |
| 100–555 或 −1 至 −555 | **遭遇战**，按离 0 的远近决定等级 |

遭遇等级：正数取百位（100→L1 … 5xx→L5）；负数 −1 至 −100→L1、−101 至 −200→L2、−201 至 −300→L3、−301 至 −400→L4、−401 至 −555→L5。

搜完在本区 **搜索追踪器** 上打一个勾；勾到标 `-1` 的格子就 **划掉一天**。
换地区 / 回工坊 → 当前区追踪器 **全部清空**（这就是它最阴的时间税）。
把一区的 6 格搜满 → 可以额外花 1 天，直接拿走该区神器（"Extensive search"）。

## 其余动作
- **Combat**：不断掷 2d6。落在怪物射程内的骰子 → 你受 1 伤；落在你射程内的骰子 → 杀死怪物。
  怪物射程 L1–L5 = `1` / `1` / `1-2` / `1-3` / `1-4`；你的射程 = `5-6`（仅 L1）/ `6`（L2–L5）。
  同掷双方都中 → 怪先打你。杀怪后掷 1 骰，≤ 遭遇等级则掉落本区材料；L5 掉 **传奇宝物**。
  累计 **6 点伤 → 昏迷**：传送回家、erase 所有追踪器、**躺 6 天**；**超过 6 点 → 死，本局结束**。
- **Rest**：每花 1 天回 1 HP；在工坊连续休 3 天以上额外 +1。
- **Activate**（工坊）：一个神器 **4 个格子（上下各一位数）**，掷 2d6 填位，取差值：
  `4`→1 能量，`5`→2 能量，`0`→清空格子重来，其他 → 一个 **锁**（负数额外捅你 1 伤）。
  4 个结果圈填满，凑够 4 点能量即激活；不够就 **花 1 天进第二轮**；再不够 **再花 1 天保底激活**。溢出能量进神之手。
- **Link**（工坊）：6 条连线各消耗 1 个指定材料；掷 2d6 填 3 个格子的 2×3，**这次结果要尽量小**，
  也可以扔进 **Wastebasket**（垃圾槽，只有 2 个位置；槽满了又没空位填 → 每颗骰子受 1 伤）。
  出现负数 → 材料被气化 + 1 伤，必须再投 1 个同类材料，把每个负数改成 2。
  三条结果相加 = **link value**；6 条 link value 之和 = **最终启动难度**。
- **Final Activation**：可以先烧自己的 HP（1 点难度/1 点血，允许降到 0），然后掷 2d6 求和：
  `< 难度` → 花 1 天 + 受 1 伤，必须重掷（0 血时失败即死）；`≥ 难度` → 世界得救，结算分数。

## 时间与事件
- 时间轨上 **第 3/6/9/12/15/18/21 格是事件日（E）**，骷髅在第 15 格；划到骷髅旁 = 世界毁灭。
- 每到事件日：给 4 种事件各掷 1 骰决定落在哪个地区（持续到下个事件日）：
  **Active Monsters**（该区遭遇等级 +2）、**Fleeting Vision**（该区神器只需 3 能量）、
  **Good Fortune**（该区正的搜索结果减 10，最低到 0）、**Foul Weather**（该区 `-1` 格变成扣 2 天）。
- **God's Hand**：花 3 点溢出能量可以划掉一个骷髅，把末日推迟 1 天（最多推迟 7 次；能量槽上限 6 点）。

## 六个地区（数据取自官方网页版源码）
| # | 地区 | 材料 | 神器 | 传奇宝物 | L1 → L5 怪物 | 追踪器 |
|---|---|---|---|---|---|---|
| 1 | Halebeard Peak | Silver | Seal of Balance | Ice Plate | Ice Bear / Roving Bandits / Blood Wolves / Horse Eater Hawk / **The Hollow Giant(S)** | -1 -1 · -1 · · |
| 2 | The Great Wilds | Quartz | Hermetic Mirror | Bracelet of Ios | Rogue Thief / Blanket of Crows / Hornback Bison / Grassyback Troll / **Thunder King** | -1 · · -1 · · |
| 3 | Root-Strangled Marshes | Silica | Void Gate | Shimmering Moonlace | Gemscale Boa / Ancient Alligator / Land Shark / Abyssal Leech(S) / **Dweller in the Tides** | -1 · -1 · -1 · |
| 4 | Glassrock Canyon | Gum | Golden Chassis | Scale of the Infinity Wurm | Feisty Gremlin / Glasswing Drake / Reaching Claws(S) / Terrible Wurm / **Infinity Wurm(S)** | -1 -1 · -1 · · |
| 5 | Ruined City of the Ancients | Wax | Scrying Lens | The Ancient Record | Grave Robbers / Ghost Lights(S) / Vengeful Shade(S) / Nightmare Crab / **The Unnamed** | -1 · -1 · -1 · |
| 6 | The Fiery Maw | Lead | Crystal Battery | The Molten Shard | Minor Imp / Renegade Warlock / Giant Flame Lizard / Spark Elemental(S) / **Volcano Spirit(S)** | -1 -1 -1 · -1 · |

`(S)` = 灵体，受 Golden Chassis / Ice Plate 之类效果影响。

## 神器效果（按找到的顺序滚雪球）
- **Seal of Balance**：一局一次，忽略某区全部事件效果（离开该区失效）。
- **Hermetic Mirror**：在 Halebeard Peak、The Fiery Maw 搜索结果可 −10（与 Good Fortune 叠加可到 −20）。
- **Void Gate**：昏迷后只需 4 天恢复（原本 6 天）。
- **Golden Chassis**：对灵体作战时每颗骰子 +1（不超过 6）。
- **Scrying Lens**：在 Glassrock Canyon、Root-Strangled Marshes 搜索结果可 −10（可叠 −20）。
- **Crystal Battery**：花 3 个材料给一件用掉的工具带道具充能。

## 传奇宝物
Ice Plate（所有怪射程 −1，最低 1）· Bracelet of Ios（激活神器白送 1 能量）·
Shimmering Moonlace（可无视一次遭遇）· Scale of the Infinity Wurm（每个事件日回 1 HP）·
The Ancient Record（把任意一条 link value 改成 0，一局一次）· The Molten Shard（对怪攻击射程 +1）

## 工具带（开局各 1 次充能）
- **Dowsing Rod**：把 11–99 的搜索结果改成恰好 1（稳拿一件未激活神器）
- **Paralysis Wand**：本场战斗每颗骰子 +2（不超过 6），可在掷完后反悔时用
- **Focus Charm**：激活时直接 +2 能量

## 计分
找到神器 10 · 激活 5 · 连线 5 · 划掉骷髅 10 · 满充能工具 10 · 传奇宝物 20 ·
**启动成功 50** · 剩余每天 5 · 剩余每点 HP 1 · 专家模式每主动少 1 天 10
（社区常见水平：第一次通常 **输**、三四十分；40–60 分钟一局）

## 专家模式
开局前主动从时间轨上划掉任意天数，每天换 10 分（只有赢才算）。"你最少能用几天拯救世界？"

## 在哪玩
- **本仓库**：下载 `utopia-engine.html` 后直接用浏览器打开（File → Open）。
- 官方网页版（免费，直接开玩）：https://introscopia.github.io/en/Game_Development/Utopia_Engine/
- 规则 PDF（本地副本）：官方规则 PDF
- itch 页面 / BGG 条目（搜 "Utopia Engine"）、第三方原生版 https://github.com/Caz-T/Utopia-Engine （有 macOS .dmg）
- 续作 **Utopia Engine: Beast Hunter**；用这套引擎的知名同人：Wargame Depot《30 Days of Night》、
  Shane Davis《Hollow Earth Explorers' Society》、Mox《Shadows of Amazonia》


## 时间经济学（为什么这游戏这么狠）
- 每个区的搜索追踪器有 6 格，其中 2–4 格标着 `-1` → 在一个区搜满 6 次 ≈ 花 3 天，换区还得清零重来。
- 期望最优落子下，一次搜索落在 0–10（神器）的概率只有约 **18%**，落 11–99（材料）约 **61%**。
- 于是 6 件神器的「保底价」≈ 6 × (3 天追踪器 + 1 天 exhaustive search + 1–2 天激活) ≈ 30 天，而你只有 14 天。
- 唯一的出路是把 **材料 → 神器** 转化率拉满：探矿杖（11–99 直接变 1）、镜子/透镜/好运（把 11–20 变成 1–10 甚至 0）、
  水晶电池（3 个材料回收探矿杖）、神之手（最多再借 7 天）。这也是为什么先找到哪件神器会决定整局成败。

## 本地版（本目录）
- `utopia-engine.html` — 单文件实现（零依赖，双击即可玩）。含：六个区的完整数据、三位数搜索盘、
  战斗/激活/连线/最终启动全流程、事件与神之手、工具带与传奇宝物、专家模式（开局少给天数）、
  计分表、localStorage 自动存档 + 手动存读档、撤销（40 步）、以及 **🤖 期望最优落子提示**
  （3 层期望搜索 + 记忆化，把上面那条「不对称收益」算进去了；可一键关掉，也可以一键「按提示自动放完」）。
- `test-bot.mjs` — 引擎自测：`node test-bot.mjs 2000`，用机器人跑整局并检查不变量。
  实测（2000 局）：搜索结果分布 材料 61.4% / 神器 16.1% / 完美 0 2.5% / 战斗 L1 13.3%、L2 5.0%、L3+ 1.8%；
  平均 3.96 件神器、16.2 天；**通关 3 局，分数 207 / 227 / 231**（与社区晒的通关分段一致）。
- `test-ui.mjs` — UI 冒烟测试：假 DOM 里渲染 400 整局，断言 HTML 里不出现 undefined / NaN。
- 官方规则 PDF 不在本仓库内分发（版权归作者），请到上面的链接自取。
