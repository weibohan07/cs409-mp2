# Cabinet — CS409 MP2 baseline

原始作业说明保留在 README.md。当前应用使用 Cleveland Museum of Art（克利夫兰艺术博物馆）的公开 API，不需要 API key。

## 运行与测试

使用 Node.js 22.12 及以上的 22.x 版本。

```sh
npm ci
npm run dev
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run preview
```

开发地址以 Vite 输出为准，路径前缀为 `/cs409-mp2/`。不要重新运行 create-vite 覆盖工程。`npm test` 测试纯数据逻辑；`npm run build` 同时检查 TypeScript 和课程源码规则；Playwright 测试真实浏览器交互。`visual.spec.ts` 使用真实馆藏和图片，需要网络；其他测试使用明确隔离的合成数据，两者互不替代。

## 评分点

| 分值 | 实现 |
| --- | --- |
| 4 | List 使用 Axios 获取的真实作品数据 |
| 8 | 输入即筛选标题、作者或 ID，忽略大小写、重音和首尾空格 |
| 8 + 8 | Title、Year、Artist 三种属性各支持升序和降序，未知年份在末尾 |
| 4 + 8 | Gallery 使用各作品真实图片，并支持类别多选 |
| 10 + 10 | 列表行和画廊卡片均通过 Link 进入对应详情 |
| 8 | 详情包含图片、作者、年代、类别、材质、尺寸、文化/来源与馆方记录 |
| 10 | Previous/Next 按当前筛选排序后的序列首尾循环，单结果禁用 |
| 12 | React Router、严格 TypeScript，另按正文强制使用 Axios |
| 10 | 统一画册视觉、响应式布局、焦点与加载/空结果/失败状态 |

最终分数由助教决定；实现和测试不是分数保证。

## 数据语义

固定选集为 Painting、Print、Sculpture 各 24 件 CC0 且有图片的作品，按馆方 ID 稳定选取，共 72 件。搜索范围明确限制在这组选集，不宣称搜索全馆。多选类型内部为 OR，类型与搜索为 AND。

首屏用 Axios 读取保存的真实 API 快照，然后通过三个类别请求更新。结果在 localStorage 缓存一小时；搜索、排序和筛选不重复请求 API。失败时明确标示使用快照或缓存。图片来自馆方 API 提供的 CDN URL；元数据快照不保证离线图片。若当前馆藏与保存的选集不一致，保留快照并提示，而不是悄悄改变范围。

需要有意更新选集时运行 `npm run data:refresh` 并提交 `public/data/collection.json`；不在每次普通构建时强制访问馆方。

原先尝试芝加哥艺术博物馆，但真实图片测试收到 Cloudflare 403，因此切换到经过连通性验证的 Cleveland API。课程 README 允许其他适合课堂的公开 API。没有尝试绕过馆方访问验证。

## 路由与部署

`/list`、`/gallery`、`/artworks/:id` 使用 BrowserRouter。查询、类别、排序和来源视图保存在 URL，详情直达和刷新不依赖先前点击的内存状态。

Vite base 为 `/cs409-mp2/`，Router basename 取 `import.meta.env.BASE_URL`。改仓库名时相应更新 base。内部导航使用 Link。构建会生成 404.html，让 GitHub Pages 在详情直达时启动应用；初次文档响应仍可能是 HTTP 404，不等同于服务器 200 rewrite。

GitHub Settings → Pages → Source 选择 GitHub Actions。main 上的部署流程使用 Node22、npm ci、测试和构建，发布 dist。若 configure-pages 自动启用因权限失败，需要仓库所有者在上述设置启用后重跑部署。

## 后续扩展

配色、字体在 `src/tokens.css`，布局在 `src/styles.css`，展示组件在 components/BrowsePage/DetailPage。数据处理在 `src/model.ts`，请求在 `src/api.ts`。添加效果时优先修改样式和展示层，避免破坏共享的查询与导航语义；修改后重新运行测试。

参考资料见 SOURCES.md。视频和表单步骤见 SUBMISSION.md。ai-logs/README.md 仅为披露说明，不是完整聊天记录，仍需本人导出本次及后续生成代码的对话。
