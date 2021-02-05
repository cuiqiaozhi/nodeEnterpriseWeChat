# nodeEnterpriseWeChat
node 实现企业微信群机器人定时发送微博热搜

## 运行
```bash
npm install

npm run dev
```

## 主要依赖库

- `superagent` 是一个轻量级、渐进式的请求库，内部依赖 `nodejs` 原生的请求 `api`
- `cheerio` 是 `nodejs` 的抓取页面模块，为服务器特别定制的，快速、灵活、实施的 `jQuery` 核心实现。
- `node-schedule` 用于实现定时任务