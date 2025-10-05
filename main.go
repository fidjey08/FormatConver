package main

import (
	"FormatConver/handlers"
	"FormatConver/public"
	"FormatConver/utils"
	"crypto/md5"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

func main() {
	initFormatConver() // 初始化
	gin.SetMode(gin.ReleaseMode)
	router := gin.Default()
	router.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE, PATCH")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Header("Access-Control-Expose-Headers", "Content-Length, Access-Control-Allow-Origin, Access-Control-Allow-Headers, Cache-Control, Content-Language, Content-Type")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})
	api := router.Group("/api")
	{
		api.GET("/ping", handlers.Ping)                                      // 测试服务器是否正常
		api.GET("/getuploadfilemaxsize", getUploadFileMaxSize)               // 获取服务端单个文件最大上传大小
		api.POST("/login", authorizationLogin)                               // 登录授权
		api.GET("/getconfigpasswordisempty", getConfigPasswordIsEmpty)       // 获取配置文件是否需要密码授权
		api.GET("/getallformats", authorization(), handlers.GetAllFormats)   // 获取所有支持的格式
		api.GET("/getallencoders", authorization(), handlers.GetAllEncoders) // 获取所有支持的编码器
		api.POST("/file/upload", authorization(), handlers.Upload)           // 文件上传
		api.POST("/file/conver", authorization(), handlers.Conver)           // 文件转换
		api.GET("/file/taskinfo", authorization(), handlers.TaskInfo)        // 获取任务信息
	}

	router.Static("/upload", "./upload") // 用户上传的文件目录
	router.Static("/output", "./output") // 已转换的文件目录

	router.StaticFile("/", "./static/index.html") // 前端文件
	router.StaticFile("/login", "./static/login.html")
	router.StaticFile("/js/main.js", "./static/js/main.js")
	router.StaticFile("/js/login.js", "./static/js/login.js")
	router.StaticFile("/css/style.css", "./static/css/style.css")

	router.Run(":" + strconv.Itoa(public.Config_.ServerConfig.Port))
}
func getUploadFileMaxSize(c *gin.Context) {
	c.JSON(200, gin.H{
		"code":    200,
		"maxsize": public.Config_.ServerConfig.UploadFileSize,
	})
}
func authorizationLogin(c *gin.Context) {
	password := public.Config_.SecConfig.PassWord
	hash := md5.New()
	hash.Write([]byte(password))
	hashBytes := hash.Sum(nil)
	enc_password := hex.EncodeToString(hashBytes)
	if password != "" {
		value, _ := c.Cookie("password")
		if c.PostForm("password") == password || value == enc_password {
			c.SetCookie("password", enc_password, 3600, "/", "", false, true)
			c.JSON(200, gin.H{
				"code":    200,
				"message": "登录成功",
			})
			return
		} else {
			c.JSON(401, gin.H{
				"code":    401,
				"message": "密码错误",
			})
			return
		}
	} else {
		c.JSON(200, gin.H{
			"code":    200,
			"message": "服务器未开启密码功能",
		})
		return
	}
}

// 检查是否需要登录授权
func getConfigPasswordIsEmpty(c *gin.Context) {
	if public.Config_.SecConfig.PassWord == "" {
		c.JSON(200, gin.H{
			"code":  200,
			"state": "0",
		})
		return
	}
	c.JSON(200, gin.H{
		"code":  200,
		"state": "1",
	})
}
func authorization() gin.HandlerFunc {
	return func(c *gin.Context) {
		password := public.Config_.SecConfig.PassWord
		if password != "" {
			hash := md5.New()
			hash.Write([]byte(password))
			hashBytes := hash.Sum(nil)
			enc_password := hex.EncodeToString(hashBytes)
			valut, err := c.Cookie("password")
			if valut != enc_password && err != nil {
				c.JSON(401, gin.H{
					"code":    401,
					"message": "未授权",
				})
				c.Abort()
				return
			}
		}
		c.Next()
	}
}
func initFormatConver() {
	log.Println("正在初始化...")
	var err error
	_, err = os.Stat(public.ConfigFile)
	if os.IsNotExist(err) {
		fmt.Printf("%s 你可能是首次运行程序，正在生成配置文件...", time.Now().Format("2006/01/02 15:04:05"))
		utils.CreateConfig()
		time.Sleep(2000 * time.Millisecond)
		fmt.Printf("[完成] \n")
		time.Sleep(1000 * time.Millisecond)
		log.Println("[!] 请先设置配置文件后重新启动程序 (配置文件位置：./config/config.json)")
		os.Exit(0)
		return
	}

	data, _ := os.ReadFile("config/config.json")
	json.Unmarshal([]byte(data), &public.Config_)
	public.UploadWriteList = append(append(public.Config_.ConverConfig.ImageFormats, public.Config_.ConverConfig.AudioFormats...), public.Config_.ConverConfig.VideoFormats...) // 允许上传的文件格式
	handlers.InitConverGroup()

	_, err = os.Stat(public.Config_.ServerConfig.UploadPath)
	if os.IsNotExist(err) {
		fmt.Printf("%s 创建文件夹upload...\n", time.Now().Format("2006/01/02 15:04:05"))
		if os.IsNotExist(err) {
			if err := os.MkdirAll(public.Config_.ServerConfig.UploadPath, 0755); err != nil {
				log.Println(err.Error())
				os.Exit(0)
				return
			}
		}
	}
	_, err = os.Stat(public.Config_.ServerConfig.OutPutPath)
	if os.IsNotExist(err) {
		fmt.Printf("%s 创建文件夹output...\n", time.Now().Format("2006/01/02 15:04:05"))
		if os.IsNotExist(err) {
			if err := os.MkdirAll(public.Config_.ServerConfig.OutPutPath, 0755); err != nil {
				log.Println(err.Error())
				os.Exit(0)
				return
			}
		}
	}
	_, err = os.Stat(public.FFmpegPath)
	if err != nil {
		log.Println("未检测到FFmpegm，正在准备安装...")
		fmt.Printf("%s 创建文件夹...", time.Now().Format("2006/01/02 15:04:05"))
		if os.IsNotExist(err) {
			if err := os.MkdirAll(public.FFmpegPath, 0755); err != nil {
				log.Println(err.Error())
				os.Exit(0)
				return
			}
			fmt.Printf("[完成]\n")
			log.Println("开始下载")
			utils.InstallFFmpeg()
		}
	}
	// 初始化视频格式映射
	for _, format := range public.Config_.ConverConfig.VideoFormats {
		public.FormatCategory[strings.ToUpper(format)] = "video"
	}
	// 初始化音频格式映射
	for _, format := range public.Config_.ConverConfig.AudioFormats {
		public.FormatCategory[strings.ToUpper(format)] = "audio"
	}
	// 初始化图片格式映射
	for _, format := range public.Config_.ConverConfig.ImageFormats {
		public.FormatCategory[strings.ToUpper(format)] = "image"
	}
	log.Println("初始化完成")
	log.Println("监听端口 :", public.Config_.ServerConfig.Port)
}
