/**
 * PM2 进程管理器配置文件
 * 
 * PM2 是一个 Node.js 应用的生产环境进程管理器，提供以下功能：
 * - 进程守护：应用崩溃时自动重启
 * - 集群模式：利用多核CPU提升性能
 * - 负载均衡：在多个进程间分配请求
 * - 日志管理：统一管理应用日志
 * - 内存监控：内存超限时自动重启
 * - 零停机部署：平滑重启应用
 * 
 * 使用方法：
 * - 开发环境启动：pm2 start ecosystem.config.js
 * - 生产环境启动：pm2 start ecosystem.config.js --env production
 * - 重启应用：pm2 reload nestjs-app
 * - 查看状态：pm2 status
 * - 查看日志：pm2 logs nestjs-app
 * - 停止应用：pm2 stop nestjs-app
 * - 删除应用：pm2 delete nestjs-app
 */
module.exports = {
  // 应用配置数组，可以配置多个应用
  apps: [{
    // 应用名称，用于PM2管理识别
    name: 'nestjs-app',
    
    // 应用入口文件路径（编译后的JS文件）
    script: 'dist/main.js',
    
    // 实例数量：'max' 表示根据CPU核心数自动设置
    // 也可以设置具体数字，如 instances: 4
    instances: 'max',
    
    // 执行模式：'cluster' 集群模式，'fork' 单进程模式
    // 集群模式可以利用多核CPU，提升并发处理能力
    exec_mode: 'cluster',
    
    // 开发环境变量
    env: {
      NODE_ENV: 'development'
    },
    
    // 生产环境变量（使用 --env production 时生效）
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    
    // 错误日志文件路径
    error_file: './logs/err.log',
    
    // 标准输出日志文件路径
    out_file: './logs/out.log',
    
    // 合并日志文件路径（包含错误和输出）
    log_file: './logs/combined.log',
    
    // 是否在日志中显示时间戳
    time: true,
    
    // 内存使用超过此值时自动重启（防止内存泄漏）
    max_memory_restart: '1G',
    
    // Node.js 启动参数，设置最大堆内存为1GB
    node_args: '--max_old_space_size=1024',
    
    // 是否监听文件变化自动重启（生产环境建议关闭）
    watch: false,
    
    // 监听时忽略的文件夹（避免不必要的重启）
    ignore_watch: ['node_modules', 'logs'],
    
    // 重启延迟时间（毫秒），避免频繁重启
    restart_delay: 4000,
    
    // 最大重启次数，超过后停止自动重启
    max_restarts: 10,
    
    // 最小运行时间，低于此时间的重启不计入重启次数
    min_uptime: '10s'
  }]
};