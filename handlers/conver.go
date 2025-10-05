package handlers

import (
	"FormatConver/public"
	"FormatConver/utils"
	"context"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"sync"

	"github.com/gin-gonic/gin"
	"golang.org/x/sync/errgroup"
)

type Task_Conver struct {
	SrcFormat  string `json:"src_format"`
	DstFormat  string `json:"dst_format"`
	Qscale     string `json:"qscale"`
	Encoder    string `json:"encoder"`
	OutPutPath string `json:"output_path"`
	State      bool   `json:"State"`
}

var Tasks = make(map[string]Task_Conver)
var TaskConver = Task_Conver{}
var mutex sync.RWMutex
var (
	convertGroup *errgroup.Group
	groupCtx     context.Context
)

func InitConverGroup() {
	groupCtx = context.Background()
	convertGroup, _ = errgroup.WithContext(groupCtx)
	convertGroup.SetLimit(public.Config_.ServerConfig.CoverGruopProcessNum) // 最大并发数
}

func Conver(c *gin.Context) {
	TaskConver = Task_Conver{
		SrcFormat:  strings.ToLower(c.PostForm("src_format")),
		DstFormat:  strings.ToLower(c.PostForm("dst_format")),
		Qscale:     c.PostForm("qscale"),
		Encoder:    c.PostForm("encoder"),
		OutPutPath: "",
		State:      false,
	}
	fileid := c.PostForm("fileid")

	if !utils.IsValidFormat(TaskConver.SrcFormat) {
		c.JSON(400, gin.H{
			"code": 400,
			"msg":  "src_format is not valid",
		})
		return
	}
	if !utils.IsValidFormat(TaskConver.DstFormat) {
		c.JSON(400, gin.H{
			"code": 400,
			"msg":  "dst_format is not valid",
		})
		return
	}
	if _, err := utils.SanitizeEncoder(TaskConver.Encoder); err != nil {
		c.JSON(400, gin.H{
			"code": 400,
			"msg":  "encoder is not valid",
		})
		return
	}
	mutex.Lock()
	Tasks[fileid] = TaskConver
	mutex.Unlock()
	if TaskConver.Qscale == "" || TaskConver.Qscale <= "0" || !public.Config_.ServerConfig.EnableQscaleControl {
		TaskConver.Qscale = strconv.Itoa(public.Config_.ServerConfig.Qscale)
	}
	convertGroup.Go(func() error {
		converImgOrVideo(fileid, TaskConver.SrcFormat, TaskConver.DstFormat, TaskConver.Encoder, TaskConver.Qscale)
		return nil
	})
	c.JSON(200, gin.H{
		"code":   200,
		"msg":    "success",
		"fileid": fileid,
	})
}
func stateChange(fileid string, state bool, outputPath string) {
	task, exists := Tasks[fileid]
	if !exists {
		return
	}
	task.State = state
	task.OutPutPath = outputPath
	Tasks[fileid] = task
}
func TaskInfo(c *gin.Context) {
	fileid := c.Query("fileid")
	state := Tasks[fileid].State
	if state {
		outputPath := Tasks[fileid].OutPutPath
		outputFile, _ := os.Stat(outputPath)
		size := outputFile.Size()
		c.JSON(200, gin.H{
			"code":   200,
			"fileid": fileid,
			"state":  state,
			"size":   size,
		})
		return
	}
	c.JSON(200, gin.H{
		"code":   200,
		"fileid": fileid,
		"state":  state,
	})
}
func converImgOrVideo(fileid string, src_format string, dst_format string, encoder string, qscale string) {
	inputPath := filepath.Join("upload", fileid+"."+src_format)
	outputPath := filepath.Join("output", fileid+"."+dst_format)
	if _, err := os.Stat(inputPath); os.IsNotExist(err) {
		log.Println(inputPath)
		return
	}
	args := []string{
		"-i", inputPath, // 输入文件
	}
	category, exists := public.FormatCategory[strings.ToUpper(dst_format)]
	if exists {
		switch category {
		case "video":
			args = append(args, "-qscale:v", qscale)
		case "audio":
			args = append(args, "-qscale:a", qscale)
		case "image":
			args = append(args, "-qscale:v", qscale)
		}
	}
	if encoder != "" {
		category, exists := public.FormatCategory[strings.ToUpper(encoder)]
		if exists {
			switch category {
			case "video":
				args = append(args, "-c:v", encoder)
			case "audio":
				args = append(args, "-c:a", encoder)
			case "image":
				args = append(args, "-c:v", encoder)
			}
		}
	}
	args = append(args, outputPath)
	wd, _ := os.Getwd()
	ffmpegPath := ""
	if utils.GetSystem() == 1 {
		ffmpegPath = filepath.Join(wd, "ffmpeg", "ffmpeg.exe")
	} else {
		ffmpegPath = filepath.Join(wd, "ffmpeg", "ffmpeg")
	}
	cmd := exec.Command(ffmpegPath, args...)
	cmd.Stderr = os.Stderr
	cmd.Stdout = os.Stdout
	if err := cmd.Run(); err != nil {
		log.Println(err)
		return
	}
	stateChange(fileid, true, outputPath)
}
