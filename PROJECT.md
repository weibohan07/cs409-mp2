# Cabinet — CS409 MP2 baseline

原作业说明保留在 README.md。当前使用 Cleveland Museum of Art（克利夫兰艺术博物馆）公开 API，无需 API key。

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

本地地址以 Vite 输出为准，路径前缀为 `/cs409-mp2/`。不要重新运行 create-vite 覆盖工程。`npm test` 测数据逻辑；构建同时检查 TypeScript 和课程源码规则。Playwright 中 `rubric.spec.ts` 使用隔离的合成数据检查交互，`visual.spec.ts` 使用真实 API 和图片，需要网络，两者互不替代。

## 评分点

| 分值 | 实现 |
| --- | --- |
| 4 | List 显示 Axios 获取的真实馆藏 |
| 8 | 标题、创作者、ID 实时搜索，忽略大小写、重音和首尾空格 |
| 8 + 8 | Title、Year、Artist 均有升序与降序；未知年份排最后 |
| 4 + 8 | Gallery 对应图片与类别多选筛选 |
| 10 + 10 | 列表行及画廊卡片通过 React Router Link 进入详情 |
| 8 | 大图、名称、作者、年代、类别、材质、尺寸、文化/来源、信用与馆方记录 |
| 10 | Previous/Next 按结果序列首尾循环；单结果禁用 |
| 12 | React Router + 严格 TypeScript，正文要求的 Axios 也实际使用 |
| 10 | 一致的画册设计、响应式布局、焦点和完整状态 |

最终分数由助教决定；测试覆盖不是分数保证。

## 数据与浏览语义

选集为三次类别查询中返回的 Painting、Print、Sculpture 各 24 件 CC0 且有图片的作品，共 72 件。搜索范围限于保存的选集，不宣称搜索全馆。多选类别内部是 OR，与搜索条件之间是 AND。排序不改变原数组。

首屏通过 Axios 读取保存的真实 API 快照，随后用相同三个查询更新。若返回的作品集合发生改变，保留保存的选集并明确提示，避免浏览范围悄悄变化。成功结果在 localStorage 缓存一小时；输入、筛选、排序不再请求 API。失败时明确标示缓存/快照及重试。元数据快照不承诺离线图片，图片使用馆方 API 返回的 CDN 地址。

更新选集是显式开发操作：`npm run data:refresh`，随后提交 `public/data/collection.json`。普通构建不强制请求 API。

原方案使用芝加哥艺术博物馆，但其图片服务在实际测试中返回 Cloudflare 403，故改用验证过图片可达的 Cleveland API。README 允许其他课堂适宜的 API。没有绕过馆方验证，也没有用无关图片替代作品。

## 路由与部署

`/list`、`/gallery`、`/artworks/:id`。查询、类型、排序、来源视图保存在 URL，切换视图、详情直达、刷新和返回不依赖先前点击的内存状态。

Vite base 为 `/cs409-mp2/`，BrowserRouter basename 使用 `import.meta.env.BASE_URL`；更改仓库名时同步更新 base。内部页面使用 Link。构建生成 404.html，使 GitHub Pages 详情直达时能启动应用；首次文档响应仍可能为 HTTP 404，不等同于服务器 200 rewrite。

Settings → Pages → Source 选择 GitHub Actions。main 上的工作流使用 Node22、npm ci、测试和构建，发布 dist。如果自动启用 Pages 因权限失败，由仓库所有者启用后重跑部署。保留 package-lock.json。

## 继续加效果

`src/tokens.css` 放颜色和字体；`src/styles.css` 放布局；展示组件在 components/BrowsePage/DetailPage。`src/model.ts` 是数据处理，`src/api.ts` 是请求与缓存。优先修改展示层，避免改坏共享查询和导航语义。不能加入 JSX style 属性、内联执行脚本或用 HTML table 布局。

资料见 SOURCES.md，提交清单与三分钟演示安排见 SUBMISSION.md。ai-logs/README.md 仅为披露说明，不是完整聊天记录；仍需本人导出本次及后续用于生成代码的对话，并完成课程问卷、视频和表单。
