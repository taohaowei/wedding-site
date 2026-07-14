# 婚礼请柬 H5 后端 API

> 给「赴约」请柬 H5 提供 RSVP 提交 + 后台管理能力。
> 技术栈：Node 20 + TypeScript 5 + Hono 4 + better-sqlite3 + zod + vitest

## 快速开始

```bash
# 1. 安装依赖（Node ≥ 20）
npm install

# 2. 复制环境变量（可选，全部有默认值）
cp .env.example .env

# 3. 启动开发服务（hot reload）
npm run dev
# → http://127.0.0.1:3001

# 4. 跑测试
npm test

# 5. 生产构建
npm run build
npm start
```

## 环境变量

| 变量 | 默认值 | 说明 |
|---|---|---|
| `PORT` | `3001` | HTTP 监听端口 |
| `DB_PATH` | `./data/wedding.db` | SQLite 文件路径，生产建议 `/var/lib/wedding/wedding.db` |
| `ADMIN_PASSWORD` | 无默认值（启动时未设置会报错） | 后台登录密码（**必须设置**） |
| `NODE_ENV` | `development` | `production` 时启用 Secure cookie + 严格 CORS |

## API 列表

| 端点 | 方法 | 说明 | 鉴权 |
|---|---|---|---|
| `/api/health` | GET | 健康检查，返回 `{ok,ts}` | 无 |
| `/api/rsvp` | POST | 提交 RSVP，IP 限流 5 次/5 秒 | 无 |
| `/api/admin/login` | POST | 后台登录（密码 → cookie） | 无 |
| `/api/admin/logout` | POST | 后台登出 | cookie |
| `/api/admin/rsvps` | GET | 列出全部 RSVP | cookie |
| `/api/admin/export.csv` | GET | 导出 CSV（UTF-8 with BOM） | cookie |

### 请求/响应契约

`POST /api/rsvp` body：

```json
{
  "name": "张三",                      // 1-32 字符，必填
  "attending": "yes",                  // yes | no | maybe，必填
  "headcount": 2,                      // 1-20 整数，attending=yes 时必填
  "need_lodging": "yes",               // yes | no | self，可选
  "dietary": "海鲜过敏",                // ≤200，可选
  "message": "祝你们幸福"               // ≤200，可选
}
```

成功：`200 { "ok": true, "id": 123 }`
失败：`400 { "ok": false, "error": "中文描述" }`
限流：`429 { "ok": false, "error": "请求过于频繁，请稍后再试" }`

`POST /api/admin/login` body：`{ "password": "..." }`
- 200 + Set-Cookie `admin_session=<32位hex>; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800`
- 401 + `{ "ok": false, "error": "密码错误" }`

## curl Demo

```bash
# 1. 健康检查
curl -s http://127.0.0.1:3001/api/health
# {"ok":true,"ts":1715508000000}

# 2. 提交 RSVP
curl -s -X POST http://127.0.0.1:3001/api/rsvp \
  -H 'Content-Type: application/json' \
  -d '{"name":"张三","attending":"yes","headcount":2,"need_lodging":"yes","message":"祝你们幸福"}'
# {"ok":true,"id":1}

# 3. 后台登录（保存 cookie 到 cookies.txt）
curl -s -X POST http://127.0.0.1:3001/api/admin/login \
  -H 'Content-Type: application/json' \
  -d '{"password":"你的密码"}' \
  -c cookies.txt
# {"ok":true}

# 4. 查询全部 RSVP（带 cookie）
curl -s http://127.0.0.1:3001/api/admin/rsvps -b cookies.txt
# {"ok":true,"data":[{"id":1,"name":"张三",...}]}

# 5. 导出 CSV
curl -s http://127.0.0.1:3001/api/admin/export.csv -b cookies.txt -o rsvps.csv
open rsvps.csv

# 6. 登出
curl -s -X POST http://127.0.0.1:3001/api/admin/logout -b cookies.txt
```

## 项目结构

```
backend/
├── src/
│   ├── server.ts            # 入口 + createApp 工厂
│   ├── routes/              # health / rsvp / admin
│   ├── db/                  # better-sqlite3 单例 + schema
│   ├── middleware/          # auth / rateLimit / cors
│   ├── schemas/             # zod 校验
│   └── utils/               # token / csv
├── tests/                   # vitest（in-memory SQLite）
├── data/                    # 开发 DB 文件（git 忽略）
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## 测试

```bash
npm test           # 一次性跑完
npm run test:watch # watch 模式
```

12 个 TDD 行为断言：

- RSVP（6 个）：合法表单入库 / name 空 / yes 缺 headcount / no 可空 / message 超长 / IP 限流
- Admin（6 个）：无 cookie 401 / 错密码 401 / 正确密码 200 + Set-Cookie / 合法 cookie 列表 / CSV 导出 / 过期 cookie 401

测试用 `':memory:'` SQLite，每个 case 隔离。

## 注意事项

- `data/` 目录已被 git 忽略，部署到生产时 `DB_PATH` 必须指到持久化挂载（如 `/var/lib/wedding/`）。
- 限流是 in-memory，PM2 多实例会失效，本项目用单实例即可。
- CORS：开发环境 reflect 任意 origin；生产环境只允许你的域名（在 `middleware/cors.ts` 中修改）。
- 密码通过环境变量 `ADMIN_PASSWORD` 注入（**无默认值，启动时未设置会直接报错，防止使用弱密码上线**）。
