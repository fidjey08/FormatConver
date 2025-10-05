package utils

import (
	"FormatConver/public"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
)

type UploadResult struct {
	FileID       string `json:"fileid"`
	FileName     string `json:"fileName"`
	FilePath     string `json:"filePath"`
	OriginalName string `json:"originalName"`
	Size         int64  `json:"size"`
	Extension    string `json:"extension"`
	Success      bool   `json:"success"`
	Error        string `json:"error,omitempty"`
}

func PerformUpload(fileHeader *multipart.FileHeader, uploadDir string) UploadResult {
	result := UploadResult{
		OriginalName: fileHeader.Filename,
		Size:         fileHeader.Size,
		Extension:    strings.ToLower(filepath.Ext(fileHeader.Filename)),
		Success:      false,
	}

	// 检查文件大小
	maxFileSize := int64(public.Config_.ServerConfig.UploadFileSize * 1024 * 1024)
	if fileHeader.Size > maxFileSize {
		result.Error = fmt.Sprintf("文件大小超过限制: %d bytes > %d bytes", fileHeader.Size, maxFileSize)
		return result
	}
	ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
	if !IsValidFormat(ext) {
		result.Error = fmt.Sprintf("不支持的文件类型: %s", ext)
		return result
	}
	file, err := fileHeader.Open()
	if err != nil {
		result.Error = fmt.Sprintf("打开上传文件失败: %v", err)
		return result
	}
	defer file.Close()
	err = os.MkdirAll(uploadDir, 0755)
	if err != nil {
		result.Error = fmt.Sprintf("创建上传目录失败: %v", err)
		return result
	}

	// 生成保存文件名
	ext = filepath.Ext(fileHeader.Filename)
	result.FileID = RandString(12)
	saveFileName := result.FileID + ext

	// 构建完整路径
	filePath := filepath.Join(uploadDir, saveFileName)
	result.FileName = saveFileName
	result.FilePath = filePath

	// 创建目标文件
	dst, err := os.Create(filePath)
	if err != nil {
		result.Error = fmt.Sprintf("创建目标文件失败: %v", err)
		return result
	}
	defer dst.Close()

	// 复制文件内容
	_, err = io.Copy(dst, file)
	if err != nil {
		result.Error = fmt.Sprintf("保存文件失败: %v", err)
		// 删除可能已创建的不完整文件
		os.Remove(filePath)
		return result
	}

	result.Success = true
	return result
}
