// =====================================================================
// PM2 配置 · 赴约婚礼请柬后端(Hono + better-sqlite3)
// 部署位置(服务器):/etc/wedding/ecosystem.config.cjs
// 启动:pm2 start /etc/wedding/ecosystem.config.cjs
// 重载:pm2 reload wedding-api
// 日志:pm2 logs wedding-api
//
// !!! 重要:首次部署前,把下面 ADMIN_PASSWORD 改成你自己的强密码 !!!
//     绝不要把改过的文件提交回 git。
// =====================================================================

module.exports = {
  apps: [
    {
      name: 'wedding-api',
      cwd: '/var/www/wedding/backend',
      script: 'dist/server.js',
      // 单实例就够了——SQLite 单文件 + WAL,不要开多实例
      instances: 1,
      exec_mode: 'fork',

      // 异常自动重启
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      restart_delay: 2000,
      max_restarts: 10,

      // 日志
      out_file: '/var/log/pm2/wedding-api.out.log',
      error_file: '/var/log/pm2/wedding-api.err.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      time: true,

      // 通用环境变量
      env: {
        NODE_ENV: 'production',
        PORT: '3001',
        HOST: '127.0.0.1',
        DB_PATH: '/var/lib/wedding/wedding.db',
      },

      // 生产环境:必须填 ADMIN_PASSWORD
      // 启动命令:pm2 start ecosystem.config.cjs --env production
      env_production: {
        NODE_ENV: 'production',
        PORT: '3001',
        HOST: '127.0.0.1',
        DB_PATH: '/var/lib/wedding/wedding.db',

        // ↓↓↓ 改这里,设置你的后台密码(部署后请保密)↓↓↓
        ADMIN_PASSWORD: 'CHANGE_ME_BEFORE_DEPLOY',
        // ↑↑↑                                              ↑↑↑

        // 可选:cookie 加签名密钥(任意 32+ 字符随机串)
        SESSION_SECRET: 'CHANGE_ME_TO_RANDOM_32CHARS_OR_MORE',
      },
    },
  ],
};
