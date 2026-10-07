# Cabinet — MP2 基线版本

原始作业说明保留在 README.md。本文件介绍实现、运行与扩展方式。

## 运行

使用 Node.js 22.12 或更新的 22.x 版本。

```sh
npm ci
npm run dev
```

开发地址以 Vite 控制台输出为准，项目 base 为 `/cs409-mp2/`。不要再次运行 create-vite 覆盖已有工程。

```sh
npm test                       # 纯数据逻辑测试
npm run build                  # TypeScript、课程规则检查、生产构建
npx playwright install chromium
npm run test:e2e                # 浏览器评分功能与真实数据截图测试
npm run preview                # 本地预览生产构建
```

浏览器测试中 rubric.spec.ts 使用明确标识的测试数据，不依赖外部 API；visual.spec.ts 使用真实馆藏数据和图片，需要网络。两类测试没有互相替代。

## 评分点

| 评分项 | 实现位置与行为 |
| --- | --- |
| List API 数据（4） | `src/api.ts`、`BrowsePage.tsx`，通过 Axios 获取馆藏与真实数据快照 |
| 实时搜索（8） | 标题、创作者、ID；忽略大小写、重音与首尾空格 |
| 两种属性排序（8） | 实际提供 Title、Year、Artist 三种 |
| 升降序（8） | 每种属性都支持 Ascending / Descending，未知年份始终在末尾 |
| Gallery 媒体（4） | 每件作品自己的博物馆 IIIF 图片 |
| Gallery 筛选（8） | 类型多选；同组 OR，和搜索条件 AND |
| List → Details（10） | 每行是 React Router Link |
| Gallery → Details（10） | 每张卡片是 React Router Link |
| Details 属性（8） | 大图、名称、作者、年代、类型、材质、尺寸、地点、来源 |
| Previous / Next（10） | 当前结果序列首尾循环，不按 ID 加减；单结果禁用 |
| React Router / TS（12） | BrowserRouter、独立详情 URL、严格 TypeScript；请求使用必选 Axios |
| Design（10） | 响应式画册风格、统一控件、焦点、空结果、错误和图片回退 |

评分仍由助教决定；测试覆盖不等于分数保证。

## 数据与故障处理

`public/data/collection.json` 是通过博物馆 API 实际取得的固定选集，最多从 Painting、Print、Sculpture 各选 32 件有图片的公有领域作品。它不是手工虚构内容。页面明确表示只搜索这组选集，而非全馆。

首次访问通过 Axios 读取快照供首屏显示，再分批用真实 API 更新相同作品 ID。成功结果在 localStorage 缓存一小时；后续搜索、筛选、排序不发网络请求。缓存不可写时仍然可用。更新失败时明确显示快照或缓存状态和重试入口。快照只保证元数据，不承诺断网时图片也可用。

刷新选集是开发时的显式操作，不在每次构建时调用 API：

```sh
npm run data:refresh
git add public/data/collection.json
```

## 路由与部署

`/list`、`/gallery`、`/artworks/:id` 共用同一应用。查询和筛选保存在 URL，切换视图、详情直达、刷新和返回均不依赖一次性的点击内存。

Vite `base` 为 `/cs409-mp2/`，BrowserRouter 使用 `import.meta.env.BASE_URL`。更改仓库名时同时更新 base。内部导航使用 Link，不使用会跳出项目路径的根相对链接。

构建会将 index.html 复制为 404.html。GitHub Pages 在详情直达时可以启动同一应用并显示当前路由，但初始文档 HTTP 状态仍为 404。这是静态托管的限制，不是 200 状态的服务器重写。

GitHub 仓库 Settings → Pages → Source 应选择 GitHub Actions。`deploy.yml` 在 main 推送时使用 Node 22、npm ci、单元测试和生产构建，发布 dist。若自动 enablement 因权限失败，需要仓库所有者在上述设置中启用 Pages，再重跑部署。不要删除 lockfile。

## 继续加视觉效果

颜色、字体变量集中在 `src/tokens.css`；布局在 `src/styles.css`。优先调整这里及展示组件，不要改变 `src/model.ts` 的结果顺序语义。之后可以自行加入柔和过渡、图片放大、主题切换等；添加前后运行测试。不要加入 JSX style 属性、内联脚本或用 HTML table 做布局。

参考资料在 SOURCES.md，提交步骤在 SUBMISSION.md。AI 完整聊天记录仍需从本次对话导出，见 ai-logs/README.md。
