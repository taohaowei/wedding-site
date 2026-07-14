# 赴约 · 部署手册（模板）

> 婚礼请柬 H5 — 开源婚礼邀请函模板
> 使用前请将 `example.com` 替换为你的域名

本目录(`ops/`)是把项目跑到生产的全部脚本与配置。**面向第一次用 PM2 / Nginx 的同学**,按章节走,基本不会踩坑。

---

## 0. 前置条件清单

部署前请确认:

- [ ] 已经买了一台**阿里云香港 ECS**(推荐 Ubuntu 22.04,2C2G 起步,香港免备案)
- [ ] 已经在域名控制台,把你的域名 **A 记录**指向服务器公网 IP
- [ ] 已经在 ECS **安全组**放行 `22 / 80 / 443` 三个端口
- [ ] 你的本地电脑能 `ssh root@<ECS 公网 IP>` 登录(密钥或密码均可)
- [ ] 本地装好 `node 20+`、`npm`、`rsync`、`ssh`(macOS 都有,Linux 也常带)

---

## 1. 服务器一次性初始化(只跑一次)

把 `setup-server.sh` 上传到服务器并执行:

```bash
# 在本地
scp ops/deploy/setup-server.sh root@<ecs-ip>:/root/

# 然后 SSH 上去
ssh root@<ecs-ip>
sudo bash /root/setup-server.sh
```

它会装好 `node 20`、`nginx`、`certbot`、`pm2`,创建运行目录(`/var/www/wedding`、`/var/lib/wedding`、`/var/log/pm2`、`/etc/wedding`),并把 PM2 注册成开机自启。

脚本是**可重入**的,装过的步骤会跳过,坏了重跑没关系。

---

## 2. 准备本地 `.env`(只跑一次)

```bash
cd ops/deploy
cp .env.example .env
```

打开 `.env`,**至少填这三项**:

| 字段 | 含义 | 怎么填 |
|---|---|---|
| `ADMIN_PASSWORD` | 后台登录密码 | 16 位以上的强密码,自己记好 |
| `SESSION_SECRET` | Cookie 签名密钥 | 任何 32 位以上随机串(`openssl rand -hex 32`) |
| `EMAIL` | Let's Encrypt 续期通知邮箱 | 你的常用邮箱 |

`.env` 已经在 `.gitignore` 里,**不会被 git 提交**;模板里的 `ecosystem.config.cjs` 也只有占位符,真实密码在 `first-deploy.sh` 运行时才会**从 `.env` 注入**到服务器。

---

## 3. 首次部署(本地运行)

```bash
cd ops/deploy
bash first-deploy.sh <ecs-ip>
# 或者:bash first-deploy.sh <ecs-ip> ubuntu
```

它会按顺序做:

1. 上传 Nginx 配置(临时禁用 https,确保 80 通畅给 certbot 验证用)
2. 调用 `setup-ssl.sh`,自动申请 Let's Encrypt 证书
3. 上传完整 Nginx 配置(此时 443 也启用)
4. 把 `ecosystem.config.cjs` 注入真实密码后写到 `/etc/wedding/`
5. 调 `deploy.sh` 同步前后端代码并启动 PM2
6. 跑一下 `/api/health` 健康检查

成功的话会打印:

```
婚礼请柬上线成功
 主页面: https://www.example.com
 后台:   https://www.example.com/admin
 API:    https://www.example.com/api/health
```

---

## 4. 日常更新部署(本地运行)

只要改了前端或后端代码,跑一下:

```bash
cd ops/deploy
bash deploy.sh <ecs-ip>
```

它做的事:

1. 本地 `npm ci && npm run build` 前端 + 后端
2. `rsync --delete` 同步 `frontend/dist` 和 `backend/dist`
3. 远端 `npm ci --omit=dev` 装生产依赖
4. `pm2 reload wedding-api --update-env`(reload 是无感重启,不丢请求)

整个过程不动 Nginx 配置、不动 SSL、不动 ecosystem.config.cjs。
**3-5 秒**完成。

---

## 5. 查看日志 / 排错

```bash
# 后端运行日志
ssh root@<ecs-ip> "pm2 logs wedding-api"

# 后端历史日志(倒序 200 行)
ssh root@<ecs-ip> "pm2 logs wedding-api --lines 200 --nostream"

# Nginx 访问日志
ssh root@<ecs-ip> "tail -f /var/log/nginx/mynight.access.log"

# Nginx 错误日志
ssh root@<ecs-ip> "tail -f /var/log/nginx/mynight.error.log"

# PM2 进程状态
ssh root@<ecs-ip> "pm2 status"
```

---

## 6. 数据备份(婚礼前/后必做)

SQLite 单文件,直接 `scp` 走:

```bash
mkdir -p backups
scp root@<ecs-ip>:/var/lib/wedding/wedding.db \
    backups/wedding-$(date +%Y%m%d-%H%M).db
```

建议:
- 婚礼**前一晚**做一次
- 婚礼**当天结束后**做一次
- 婚礼**后第二天**再做一次,然后阿里云那边可以建一次快照存档

如果想做服务器自动备份,后续可以加 cron + scp,本期 MVP 不做。

---

## 7. 后台访问

浏览器打开 https://www.example.com/admin

密码 = 你 `.env` 里设置的 `ADMIN_PASSWORD`。

要改密码:

1. 改本地 `.env` 中的 `ADMIN_PASSWORD`
2. 重新跑 `bash first-deploy.sh <ecs-ip>`(或者只重跑第 4-5 步)
   - 也可以直接 ssh 上去手动改 `/etc/wedding/ecosystem.config.cjs` + `pm2 reload wedding-api --update-env`

---

## 8. 证书续期

`certbot.timer` 已经被 `setup-ssl.sh` 启用,**默认每天自动检查**,到期前 30 天会自动续。无需人工干预。

想手动验证:

```bash
ssh root@<ecs-ip> "sudo certbot renew --dry-run"
ssh root@<ecs-ip> "systemctl list-timers | grep certbot"
```

---

## 9. 常见问题

| 现象 | 原因 / 处理 |
|---|---|
| **域名打不开** | 1) 检查 DNS:`dig www.example.com` 是不是你的 ECS IP;2) ECS 安全组 80/443 是不是开了 |
| **502 Bad Gateway** | 后端挂了。`ssh ... pm2 logs wedding-api` 看错误,通常是 ADMIN_PASSWORD 没注入 / DB 路径没权限 |
| **无法申请证书** | certbot 走 80 端口验证,确认 80 通,且 Nginx 已经在跑 `mynight.conf`(http 段) |
| **微信内打不开图片** | 微信对 https 强校验 — 确认证书有效,以及没有 mixed-content(http 资源混进 https 页面) |
| **iOS 滚动卡顿** | 是 Safari 的事,不是代码问题;尽量保证图片用 webp + 懒加载 |
| **`pm2 reload` 失败** | 看 `pm2 logs wedding-api` 的最后 50 行;`deploy.sh` 失败时会自动打日志 |
| **改了 Nginx 配置怎么生效** | `scp ops/nginx/mynight.conf root@<host>:/tmp/ && ssh root@<host> "sudo install -m 644 /tmp/mynight.conf /etc/nginx/sites-available/ && sudo nginx -t && sudo systemctl reload nginx"` |

---

## 10. 目录速查

```
ops/
├── nginx/
│   ├── mynight.conf            # 站点配置(80→443 跳转,SPA fallback,/api 反代)
│   └── install.sh              # 在服务器上软链 + nginx -t + reload
├── pm2/
│   └── ecosystem.config.cjs    # PM2 配置(占位密码,first-deploy 时注入真值)
├── deploy/
│   ├── setup-server.sh         # 服务器一次性初始化(node/nginx/certbot/pm2)
│   ├── setup-ssl.sh            # Let's Encrypt 证书申请 + 续期 timer
│   ├── first-deploy.sh         # 本地:首次部署(SSL+conf+ecosystem+代码)
│   ├── deploy.sh               # 本地:日常增量部署(只 build+rsync+reload)
│   ├── .env.example            # 配置模板,复制为 .env 后填值
│   └── .gitignore              # 防止 .env 进 git
└── README.md                   # 本文件
```

---

## 11. 最短上手命令序列

```bash
# 1. 服务器初始化(只一次)
scp ops/deploy/setup-server.sh root@<ip>:/root/ && \
  ssh root@<ip> "sudo bash /root/setup-server.sh"

# 2. 本地配置 .env(只一次)
cp ops/deploy/.env.example ops/deploy/.env && vim ops/deploy/.env

# 3. 首次部署(只一次)
bash ops/deploy/first-deploy.sh <ip>

# 4. 以后每次发版
bash ops/deploy/deploy.sh <ip>
```

---

## 12. 一些设计决策

| 决策 | 理由 |
|---|---|
| 用 **certbot --nginx** 而非 acme.sh / 阿里云证书 | certbot 是 Let's Encrypt 官方推荐,自带 Nginx 插件能改写配置,自动续期靠 systemd timer 不用 cron |
| 后端进程**只监听 127.0.0.1:3001** | 不暴露公网,Nginx 是唯一入口,SQL 注入和 DDoS 都从 Nginx 拦 |
| PM2 跑在 **root** 而不是 wedding 用户 | 因为只监听 127.0.0.1 没安全风险,且 root 可读 `/var/lib/wedding/`;wedding 用户已建好,后续想切换只需在 ecosystem 里加 `user: 'wedding'` 并 `chown -R wedding /var/lib/wedding /var/www/wedding/backend` |
| **首次部署用临时 80-only Nginx 配置** | certbot 申请证书前 SSL 路径还不存在,直接 install 全量配置会 nginx -t 失败;`first-deploy.sh` 用 awk 先把 443 段注释掉,等证书下来再 install 完整版 |
| ecosystem.config.cjs 走 **占位+本地注入** | 模板可以提交 git,真实 ADMIN_PASSWORD 只在 first-deploy 时从 `.env` 替换并 scp 到 `/etc/wedding/` |
| `deploy.sh` 用 `pm2 reload --update-env` | reload 是 zero-downtime,`--update-env` 让你改了 ecosystem 后能拿到新环境变量 |
| 不写 CSP | inline script + 微信注入的 JS 会触发 CSP 报错,首版先不开,后续稳定后再加 |
| 默认不开 ufw | 阿里云已经有安全组,本机 ufw 一启容易把自己 SSH 锁外面;脚本只给提示不主动开 |

---

祝顺利上线 ❤️
