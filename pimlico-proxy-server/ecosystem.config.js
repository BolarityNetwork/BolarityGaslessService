module.exports = {
  apps: [{
    name: 'pimlico-proxy',
    script: 'server.js',
    instances: 'max',  // 使用所有CPU核心
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 8080
    },
    // 进程管理
    max_memory_restart: '1G',
    min_uptime: '10s',
    max_restarts: 10,
    
    // 日志配置
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // 自动重启
    watch: false,
    ignore_watch: ['node_modules', 'logs'],
    
    // 健康检查
    health_check_http: {
      path: '/health',
      port: 8080,
      timeout: 5000,
      interval: 30000,
      max_failed_checks: 3
    }
  }]
}