<div align="center">

<img src="./public/og-cover.png" alt="STARK TOWER // NIGHT CITY 概念主视觉" width="100%" />

<h1>STARK TOWER // NIGHT CITY</h1>

<p><strong>一个程序化生成、可实时调节的赛博朋克「史塔克大厦」WebGL 场景</strong></p>

<p>
  <a href="https://jay-victor.github.io/STARK-TOWER-NIGHT-CITY/"><strong>◉ LIVE DEMO</strong></a>
  <sub>（首次启用 Pages 后上线）</sub>
  &nbsp;·&nbsp;
  <a href="https://github.com/Jay-Victor/STARK-TOWER-NIGHT-CITY">GitHub Repository</a>
  &nbsp;·&nbsp;
  <a href="#快速开始">快速开始</a>
</p>

<p>
  <img alt="React 19" src="https://img.shields.io/badge/React-19-51f5ff?style=flat-square" />
  <img alt="Three.js r186" src="https://img.shields.io/badge/Three.js-r186-ff2bd6?style=flat-square" />
  <img alt="Vite 7" src="https://img.shields.io/badge/Vite-7-51f5ff?style=flat-square" />
  <img alt="TypeScript 5.9" src="https://img.shields.io/badge/TypeScript-5.9-3178c6?style=flat-square" />
  <img alt="MIT License" src="https://img.shields.io/badge/License-MIT-ff2bd6?style=flat-square" />
  <a href="https://github.com/Jay-Victor/STARK-TOWER-NIGHT-CITY/actions/workflows/ci.yml">
    <img alt="CI" src="https://github.com/Jay-Victor/STARK-TOWER-NIGHT-CITY/actions/workflows/ci.yml/badge.svg" />
  </a>
  <a href="https://github.com/Jay-Victor/STARK-TOWER-NIGHT-CITY/actions/workflows/deploy-pages.yml">
    <img alt="Deploy to GitHub Pages" src="https://github.com/Jay-Victor/STARK-TOWER-NIGHT-CITY/actions/workflows/deploy-pages.yml/badge.svg" />
  </a>
</p>

<p><sub>概念主视觉由项目脚本程序化绘制；实际浏览器内效果包含实时光照、反射、雨滴和 Bloom。</sub></p>

</div>

---

## 项目简介

**STARK TOWER // NIGHT CITY** 是一个完全程序化的赛博朋克塔楼场景，所有建筑几何、窗户、机械结构、天空、霓虹招牌、雨滴和环境反射均由代码生成，不依赖外部 3D 模型、HDR 文件或远程字体。

打开页面即进入默认的 **21:36 夜景模式**：

- 约 90 单位高的三段退台塔楼：竖向鳍片幕墙、悬挑圆角观景舱、四坡玻璃塔冠、大型弧反应堆徽标与分段天线；
- **三渲二（Cel / Toon）**渲染：`MeshToonMaterial` 阶梯光照、倒角高光、冷色月光与霓虹边缘光，重要体块再叠加墨线勾边；
- 1,550 扇塔楼窗户、城市窗户与结构细节全部使用 `InstancedMesh` 批量渲染；
- EffectComposer Bloom、ACES 色调映射、暗角和胶片颗粒；
- Drei Environment + Lightformer 构成可离线使用的程序化城市光环境；
- MeshReflectorMaterial 潮湿地面反射、程序化沥青纹理与积水；
- 6,200 个 GPU 雨滴粒子；
- OrbitControls 自动环绕，以及完整的 Leva 实时调试面板；
- 桌面与移动端响应式 HUD。

<div align="center">
  <img src="./docs/scene-preview.png" alt="STARK TOWER 实机渲染：三渲二夜景" width="100%" />
  <sub>实机渲染 / 1440×900：退台幕墙、四坡玻璃塔冠、弧反应堆、圆角观景舱与城市楼群</sub>
</div>

## 技术栈

| 分类 | 技术 |
| --- | --- |
| UI / 交互 | React 19.3、TypeScript 5.9、Leva 0.10 |
| 3D 渲染 | Three.js 0.186、React Three Fiber 9.8、Drei 10.7 |
| 渲染风格 | 三渲二（Cel Shading）：阶梯 Toon 光照 + 边缘光 + 墨线描边 |
| 后期处理 | @react-three/postprocessing 3.2、postprocessing 6.39 |
| 构建 | Vite 7 |
| 视觉资产 | 100% 浏览器 Canvas / Shader 程序化生成 |
| 部署 | GitHub Actions → GitHub Pages |

## 快速开始

环境要求：

- Node.js `^20.19.0` 或 `>=22.12.0`
- 支持 WebGL 2 的现代浏览器（Chrome / Edge / Firefox / Safari）
- 建议开启硬件加速

```bash
git clone https://github.com/Jay-Victor/STARK-TOWER-NIGHT-CITY.git
cd STARK-TOWER-NIGHT-CITY
npm install
npm run dev
```

打开终端提示的地址，默认：

```text
http://127.0.0.1:5173/
```

请不要直接双击 `index.html` 打开，项目需要通过 Vite 服务器运行。

### 常用命令

```bash
npm run dev         # 本地开发
npm run typecheck   # TypeScript 类型检查
npm run build       # 生产构建
npm run build:pages # GitHub Pages 子路径构建
npm run preview     # 预览生产包
```

## 交互与调试

### 镜头

- **左键拖动 / 单指滑动**：360° 环绕
- **滚轮 / 双指缩放**：拉近拉远
- 默认开启自动环绕；可在 Leva 的 `CAMERA RIG` 分组中关闭或调速
- 相机不会进入地面以下，避免穿地

### Leva 面板

右上角 **STARK // CONTROL** 面板：

| 分组 | 参数 | 说明 |
| --- | --- | --- |
| `TIME SYSTEM` | `LOCAL TIME` / `LIGHT GAIN` | 0–24 小时昼夜光照调色板；全局光强增益 |
| `NEON SIGNAL` | `CYAN SIGNAL` / `MAGENTA SIGNAL` | 整体霓虹主色，实时影响塔楼、城市、点光与招牌 |
| `ATMOSPHERE` | `FOG DENSITY` | 指数雾浓度 |
| `BLOOM FX` | `INTENSITY` / `THRESHOLD` / `SMOOTHING` / `RADIUS` | Bloom 强度与阈值等完整参数 |
| `WEATHER` | `RAIN SYSTEM` / `RAIN DENSITY` / `SURFACE WETNESS` | 雨滴开关、雨量、地面反射湿度 |
| `CAMERA RIG` | `AUTO ORBIT` / `ORBIT SPEED` | 自动环绕与速度（默认折叠） |

推荐参数：

- **霓虹夜景**：时间 `21:30`，Bloom 阈值约 `0.72`；
- **黄昏**：时间 `18:20`；
- **黎明**：时间 `06:20`；
- **镜面湿地面**：`SURFACE WETNESS` 接近 `1.0`；
- **通透远景**：降低 `FOG DENSITY`。

## 项目结构

```text
.
├── .github/workflows/deploy-pages.yml   GitHub Pages 自动部署
├── public/
│   ├── favicon.svg
│   └── og-cover.png                     README 概念主视觉
├── docs/
│   └── scene-preview.png                实机渲染预览
├── scripts/
│   └── generate-cover.py                可选的封面生成脚本（Pillow）
├── src/
│   ├── App.tsx                          Canvas / HUD / Leva / 错误边界
│   ├── main.tsx
│   ├── styles.css                       HUD、启动动画、响应式布局
│   ├── types.ts
│   ├── hooks/
│   │   └── useSceneControls.ts          Leva schema → 强类型 SceneSettings
│   ├── lib/
│   │   ├── palette.ts                   24 小时调色板、太阳方向
│   │   ├── random.ts                    确定性 PRNG
│   │   ├── cel.ts                       三渲二材质：Toon 色阶 + 边缘光
│   │   ├── geometry.ts                  倒角体块、锥台塔冠、圆角观景舱几何
│   │   └── textures.ts                  招牌、广告牌、湿沥青 Canvas 贴图
│   └── components/
│       ├── scene/
│       │   ├── Scene.tsx                场景组装根
│       │   ├── Tower.tsx                塔楼材质、弧反应堆、观景舱、塔冠与天线
│       │   ├── towerData.ts             程序化塔楼几何与 1,550 扇实例化窗户
│       │   ├── facade.ts                共享幕墙 / 窗户 / 斜撑生成器
│       │   ├── InstancedMeshes.tsx      倒角盒 / 圆柱 / 方锥实例化、EdgeLines、WindowField
│       │   ├── Ground.tsx               反射地面、积水、地面霓虹
│       │   ├── City.tsx                 城市楼群、广告牌、空中车流
│       │   ├── Lighting.tsx             日光 / 月光 / 霓虹点光
│       │   ├── Atmosphere.tsx           FogExp2 与大气浓度
│       │   ├── SkyDome.tsx              程序化天空 Shader
│       │   ├── EnvironmentRig.tsx       Drei 环境反射
│       │   ├── Rain.tsx                 GPU 雨滴 Shader
│       │   ├── Effects.tsx              Bloom / Vignette / Noise / ACES
│       │   └── CameraRig.tsx            OrbitControls
│       └── ui/
│           ├── Hud.tsx                  科幻 HUD
│           ├── SceneErrorBoundary.tsx   WebGL 失败回退界面
│           └── levaTheme.ts
├── index.html
├── package.json
├── tsconfig*.json
└── vite.config.ts
```

## 实现细节

### 三渲二（Cel / Toon）建筑

塔楼与城市建筑不再使用写实的 PBR 反射作为主视觉，而是切换为**三渲二**的分层画法：

- **阶梯光照**：`MeshToonMaterial` 配合 6 像素的 `DataTexture` 色阶，让 N·L 直接落到 3–4 个硬边色阶上；
- **倒角硬边**：主体块由倒角盒几何（`createChamferBoxGeometry`）批量实例化，每条棱保留一条真实窄倒角，在色阶光下形成机器加工般的锐利高光；
- **边缘光 / 墨线**：编译期向 Toon 着色器注入 Fresnel 边缘光、天空/地面反弹色和边缘压暗；重要体块再叠加 `EdgeLines` 的深色墨线；
- **圆润与直线分离**：圆形截面使用 28 段光滑圆柱，塔冠使用四坡玻璃锥台，弧反应堆与观景舱使用圆环/圆角挤出几何；幕墙、退台、天线条则保持刀切般的直线；
- **平面化窗格**：窗仍由单个 `InstancedMesh` 承载，亮/暗玻璃都是纯色平面，不再有 PBR 高光噪音。

### 程序化塔楼与实例化

塔楼由裙楼、三段退台玻璃体量、悬挑圆角观景舱、四坡玻璃塔冠、弧反应堆、天线组成。重复结构通过 `InstancedMesh` 合并：

- 塔楼窗户：**1 个 draw call / 1,550 扇窗户**
- 玻璃体量 / 结构体块：2 个倒角实例化批次
- 幕墙鳍片、竖框、楼层横梁、金属压顶与设备：3 个实例化批次
- 青色 / 品红 / 暖色霓虹灯带：各 1 个实例化批次
- 城市楼体、圆柱塔、方锥塔冠、城市窗户、屋顶灯、车流：分别批处理

窗户颜色通过 `instanceColor` 写入，高亮 HDR 色彩参与 Bloom。

### 城市建筑原型

`City.tsx` 用确定性种子生成六类建筑，并保留中央塔楼的视线通廊：

- **板式塔**：竖向鳍片 + 顶部收分；
- **退台塔**：2–3 段逐级收进，配置屋顶机房与灯带；
- **装饰艺术尖顶**：玻璃灯室 + 四坡尖锥 + 角部霓虹；
- **圆柱塔**：光滑曲面、环形腰线、卷曲窗带；
- **双塔天桥**：两座窄塔 + 发光空中连廊；
- **低层商业**：石材基座、雨棚、暖色橱窗与竖向灯箱。

此外还有屋顶水塔/尖锥、天线航障灯、广告牌、远景剪影楼群、空中车流与街灯点光。

### 昼夜调色板

`palette.ts` 包含从深夜、黎明、正午、黄昏到夜晚的 10 个关键帧。时间滑块实时插值：

- 天空顶部色 / 地平线色 / 辉光色 / 星空强度；
- 太阳方向、颜色、强度与阴影开关；
- ambient / hemisphere 光色；
- 雾的颜色与霓虹灯强度。

### 潮湿地面

`MeshReflectorMaterial` 生成平面反射，再叠加：

- 程序生成的深色沥青 color map；
- bump map 与 roughness map；
- 湿润度控制的反射强度、模糊、扰动；
- 高光积水层与地面霓虹标线。

### 环境光

为满足湿地面反射与少量 PBR 金属件的环境反射需求，项目仍使用 Drei `Environment` + `Lightformer` 构建可离线运行的程序化城市光环境。它等价于自建城市 HDR，不使用远程 CDN；三渲二建筑本身不依赖该环境贴图。

如需改用远程预设：

```tsx
<Environment preset="city" background={false} environmentIntensity={0.9} />
```

并移除 `EnvironmentRig.tsx` 内的 Lightformer 子节点即可。

### 雨滴

`Rain.tsx` 使用自定义 `ShaderMaterial` 在顶点着色器内计算每滴雨的下落、风偏移、点大小与深度淡出；通过 `drawRange` 控制雨量，CPU 每帧只更新时间 uniform。

## 性能说明

- 窗口、结构、城市、车流、灯带均批量实例化，避免重复 draw call；
- Canvas DPR 限制为 `[1, 1.75]`；
- 阴影仅由太阳光投影，夜间自动关闭（月光只提供色阶，不产生阴影）；
- 三渲二材质只更新少量 uniform，不引入额外的全屏后期通道；
- 点光源不投影；
- `MeshReflectorMaterial` 会额外渲染一次场景，这是湿地反射的主要成本；
- 低端设备建议：将 `Ground.tsx` 的反射分辨率从 1024 降为 512，并将 `Effects.tsx` 的 `multisampling` 降为 0 或 2；
- 城市在中央广场外 48 单位才开始布置，近环建筑限高，保证主塔在自动环绕时不被遮挡。

## GitHub Pages 部署

> [!IMPORTANT]
> **首次启用 Pages 需要仓库所有者手动操作一次。** GitHub 提供的内置
> `GITHUB_TOKEN` 无权创建 Pages 站点，这是平台的权限限制，不能由仓库代码绕过。
>
> 请进入 **Settings → Pages → Build and deployment → Source**，选择
> **GitHub Actions**。启用后推送任意提交，或手动运行一次 workflow，即可自动上线。

仓库已包含 [deploy-pages.yml](./.github/workflows/deploy-pages.yml)：

1. 推送到 `main` 分支；
2. Actions 先检查 Pages 是否已启用；未启用时会给出 warning 并跳过部署，避免失败；
3. 启用后自动执行 `npm ci` 与 `npm run build:pages`；
4. 构建产物部署至 GitHub Pages。

在线地址：

**https://jay-victor.github.io/STARK-TOWER-NIGHT-CITY/**

部署 workflow 使用了：

- 官方 `actions/configure-pages@v5`；
- `actions/upload-pages-artifact@v3`；
- `actions/deploy-pages@v4`；
- `pages: write` 与 `id-token: write` 权限。

Vite 在 `github-pages` 模式下会使用 `/STARK-TOWER-NIGHT-CITY/` 作为 base path，确保所有资源在项目子路径下正确加载。

## 生成主视觉（可选）

`public/og-cover.png` 已包含在仓库中。如需重新生成：

```bash
pip install pillow numpy
npm run cover:generate
```

脚本默认读取 Windows 字体（Bahnschrift / Consolas / 微软雅黑）；在其他系统上可自行替换 `scripts/generate-cover.py` 内的字体路径。

## 浏览器兼容

推荐 Chrome / Edge 最新版并开启硬件加速。项目使用 WebGL 2、浮点后期帧缓冲和实时着色器。如果 WebGL 初始化失败，页面会显示可操作的错误回退界面而不是黑屏。

## License

[MIT](./LICENSE) © 2026 Jay-Victor

> STARK / 史塔克等名称属于 MARVEL 相关权利方。本项目为非商业的粉丝风格技术演示。