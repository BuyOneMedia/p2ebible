module.exports = {
  apps: [
    // ── Web App (Next.js) ───────────────────────────────────────────────
    {
      name: 'p2ebible-web',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/p2ebible.com',
      env_file: '/var/www/p2ebible.com/.env',
      env: {
        NODE_ENV: 'production',
        PORT: 4080,
      },
      max_memory_restart: '500M',
      exp_backoff_restart_delay: 100,
      max_restarts: 10,
      error_file: '/var/www/p2ebible.com/logs/web-error.log',
      out_file:   '/var/www/p2ebible.com/logs/web-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },

    // ── Scout Agent ─────────────────────────────────────────────────────
    {
      name: 'p2ebible-scout',
      script: '/var/www/p2ebible.com/agents/run-scout.sh',
      interpreter: 'bash',
      cwd: '/var/www/p2ebible.com',
      max_memory_restart: '300M',
      exp_backoff_restart_delay: 100,
      max_restarts: 5,
      error_file: '/var/www/p2ebible.com/logs/scout-error.log',
      out_file:   '/var/www/p2ebible.com/logs/scout-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },

    // ── Detective Agent ─────────────────────────────────────────────────
    {
      name: 'p2ebible-detective',
      script: '/var/www/p2ebible.com/agents/run-detective.sh',
      interpreter: 'bash',
      cwd: '/var/www/p2ebible.com',
      max_memory_restart: '300M',
      exp_backoff_restart_delay: 100,
      max_restarts: 5,
      error_file: '/var/www/p2ebible.com/logs/detective-error.log',
      out_file:   '/var/www/p2ebible.com/logs/detective-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
