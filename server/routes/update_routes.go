package routes

import (
	"net/http"
	"strconv"

	"ark-server-commander/service/update"
	"ark-server-commander/websocket"
	"github.com/gin-gonic/gin"
)

func RegisterUpdateRoutes(rg *gin.RouterGroup, updateService *update.UpdateService, hub *websocket.Hub) {
	updates := rg.Group("/updates")
	{
		updates.GET("/:id/status", func(c *gin.Context) {
			serverID, err := strconv.ParseUint(c.Param("id"), 10, 32)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "无效的服务器ID"})
				return
			}

			status, err := updateService.GetUpdateStatus(uint(serverID))
			if err != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": "更新状态不存在"})
				return
			}

			c.JSON(http.StatusOK, gin.H{
				"message": "获取成功",
				"data":    status,
			})
		})
	}
}
