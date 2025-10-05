package handlers

import (
	"FormatConver/public"
	"FormatConver/utils"
	"net/http"

	"github.com/gin-gonic/gin"
)

func Ping(c *gin.Context) {
	c.JSON(200, gin.H{
		"message": "pong",
	})
}

func GetAllFormats(c *gin.Context) {
	ffmpegFormats := public.FFmpegFormats{
		VideoFormats: public.Config_.ConverConfig.VideoFormats,
		AudioFormats: public.Config_.ConverConfig.AudioFormats,
		ImageFormats: public.Config_.ConverConfig.ImageFormats,
	}
	c.JSON(200, ffmpegFormats)
}
func GetAllEncoders(c *gin.Context) {
	ffmpegEncoders := public.FFmpegEncoders{
		VideoEncoders: public.VideoEncoders,
		AudioEncoders: public.AudioEncoders,
	}
	c.JSON(200, ffmpegEncoders)
}

func Upload(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "获取上传文件失败: " + err.Error(),
		})
		return
	}

	result := utils.PerformUpload(file, public.Config_.ServerConfig.UploadPath)

	if result.Success {
		c.JSON(http.StatusOK, gin.H{
			"success":      true,
			"message":      "文件上传成功",
			"fileid":       result.FileID,
			"fileName":     result.FileName,
			"filePath":     result.FilePath,
			"originalName": result.OriginalName,
			"size":         result.Size,
			"extension":    result.Extension,
		})
	} else {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   result.Error,
		})
	}
}
