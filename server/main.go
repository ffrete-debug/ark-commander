package main

import (
	"ark-server-commander/config"
	"ark-server-commander/database"
	"ark-server-commander/middleware"
	"ark-server-commander/routes"
	"ark-server-commander/service/docker_manager"
	"ark-server-commander/service/update"
	"ark-server-commander/utils"
	"ark-server-commander/websocket"
	"os"
	"syscall"
	signal "os/signal"
	"time"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"go.uber.org/zap"

	_ "ark-server-commander/docs" // 导入生成的docs包
)

// @title ARK服务器管理器 API
// @version 1.0
// @description 基于Gin+Gorm的ARK服务器管理系统API文档
// @termsOfService http://swagger.io/terms/

// @contact.name API支持
// @contact.url http://www.swagger.io/support
// @contact.email support@swagger.io

// @license.name MIT
// @license.url https://opensource.org/licenses/MIT

// @host localhost:8080
// @BasePath /api

// @securityDefinitions.apikey Bearer
// @in header
// @name Authorization
// @description JWT token in the format "Bearer {token}"

func main() {
	// 初始化日志系统
	if err := utils.InitLogger(); err != nil {
		panic("日志系统初始化失败: " + err.Error())
	}
	defer utils.Sync()

	// 初始化配置
	if err := config.InitConfig(); err != nil {
		utils.Error("配置初始化失败", zap.Error(err))
		utils.Info("=========================================")
		utils.Info("💡 解决方案:")
		utils.Info("1. 生成强随机密钥（推荐）:")
		utils.Info("   openssl rand -base64 48")
		utils.Info("")
		utils.Info("2. 设置环境变量:")
		utils.Info("   export JWT_SECRET='your-generated-secret-here'")
		utils.Info("")
		utils.Info("3. 或在 docker-compose.yml 中配置:")
		utils.Info("   environment:")
		utils.Info("     - JWT_SECRET=your-generated-secret-here")
		utils.Info("=========================================")
		utils.Fatal("程序退出")
	}

	// 初始化数据库
	database.InitDB()

	// 初始化审计日志
	middleware.InitAudit(database.GetDB())

	// 初始化更新监控 Hub
	updateHub := websocket.NewHub()
	go updateHub.Run()

	// 初始化更新服务
	updateService := update.NewUpdateService(database.GetDB(), updateHub)

	// 检查Docker环境
	if err := docker_manager.CheckDockerStatus(); err != nil {
		utils.Fatal("Docker环境检查失败，请确保Docker已安装并运行", zap.Error(err))
	}
	utils.Info("Docker环境检查通过")

	// 获取Docker管理器单例实例
	_, err := docker_manager.GetDockerManager()
	if err != nil {
		utils.Fatal("获取Docker管理器失败", zap.Error(err))
	}
	defer docker_manager.CloseDockerManager()

	// 创建Gin实例
	r := gin.New() // custom middleware, no defaults

	// Request ID per request
	r.Use(middleware.RequestID())

	// Logger
	r.Use(func(c *gin.Context) {
		reqID := c.GetString("request_id")
		zap.L().Info("request",
			zap.String("method", c.Request.Method),
			zap.String("path", c.Request.URL.Path),
			zap.Int("status", c.Writer.Status()),
			zap.String("request_id", reqID),
			zap.String("ip", c.ClientIP()),
		)
		c.Next()
	})

	// Recovery
	r.Use(gin.Recovery())

	// Request timeout (30s)
	r.Use(middleware.Timeout(30 * time.Second))

	// Security headers
	r.Use(middleware.SecureHeaders())

	// Rate limiter: 100 requests/IP/second, burst 200
	rl := middleware.NewRateLimiter(100, 200, time.Second)
	r.Use(rl.Middleware())

	// CORS configurável via CORS_ORIGIN env (default: * para dev)
	corsOrigin := os.Getenv("CORS_ORIGIN")
	if corsOrigin == "" {
		corsOrigin = "*"
	}
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", corsOrigin)
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization, X-Requested-With")
		c.Header("Access-Control-Allow-Credentials", "true")

		// 处理预检请求
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// 注册路由
	routes.RegisterRoutes(r, updateService, updateHub)

	// Graceful shutdown
	go func() {
		quit := make(chan os.Signal, 1)
		signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
		<-quit
		utils.Info("收到关闭信号，正在优雅关闭...")
		docker_manager.CloseDockerManager()
		os.Exit(0)
	}()

	// 添加Swagger路由
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// 启动服务器
	utils.Info("=========================================")
	utils.Info("🚀 ARK服务器管理器后端启动成功")
	utils.Info("📍 服务器地址: http://localhost:8080")
	utils.Info("📚 API文档: http://localhost:8080/swagger/index.html")
	utils.Info("🔗 健康检查: http://localhost:8080/health")
	utils.Info("🌐 CORS: 已启用（允许所有来源）")
	utils.Info("🐳 Docker容器化ARK服务器管理")
	utils.Info("🔄 Docker镜像正在后台检查中...")
	utils.Info("📋 Docker卷和配置文件初始化完成")
	utils.Info("📋 服务器状态同步完成")
	utils.Info("=========================================")

	if err := r.Run(":8080"); err != nil {
		utils.Fatal("服务器启动失败", zap.Error(err))
	}
}
