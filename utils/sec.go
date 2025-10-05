package utils

import (
	"FormatConver/public"
	"fmt"
	"strings"
	"unicode/utf8"
)

// SecurityConfig 安全配置
type SecurityConfig struct {
	MaxPathLength   int
	SafeDirectories []string
}

// 默认安全配置
var DefaultSecurityConfig = SecurityConfig{
	MaxPathLength: 24,
	SafeDirectories: []string{
		public.Config_.ServerConfig.UploadPath,
		public.Config_.ServerConfig.OutPutPath,
		public.FFmpegPath,
	},
}

// IsValidFormat 检查格式是否有效（支持所有格式）
func IsValidFormat(format string) bool {
	format = strings.ToLower(strings.TrimSpace(format))
	format = strings.TrimPrefix(format, ".")
	for _, validFormat := range public.UploadWriteList {
		if strings.ToLower(validFormat) == format {
			return true
		}
	}
	return false
}

// SanitizeFilename 消毒文件名
func SanitizeFilename(filename string) (string, error) {
	// 检查UTF-8有效性
	if !utf8.ValidString(filename) {
		return "", fmt.Errorf("文件名包含无效的UTF-8字符")
	}

	// 移除危险字符
	dangerousChars := []string{"..", "~", "/", "\\", ":", "*", "?", "\"", "<", ">", "|", "&", ";", "$", "`", "!", "'"}
	sanitized := filename
	for _, char := range dangerousChars {
		sanitized = strings.ReplaceAll(sanitized, char, "")
	}

	// 检查路径遍历
	if strings.Contains(sanitized, "..") {
		return "", fmt.Errorf("文件名包含路径遍历字符")
	}

	// 长度检查
	if len(sanitized) > DefaultSecurityConfig.MaxPathLength {
		return "", fmt.Errorf("文件名过长")
	}

	// 检查是否为空
	if sanitized == "" {
		return "", fmt.Errorf("文件名为空")
	}

	return sanitized, nil
}

// IsVideoFormat 检查是否为视频格式
func IsVideoFormat(format string) bool {
	format = strings.ToUpper(strings.TrimSpace(format))
	return contains(public.Config_.ConverConfig.VideoFormats, format)
}

// IsAudioFormat 检查是否为音频格式
func IsAudioFormat(format string) bool {
	format = strings.ToUpper(strings.TrimSpace(format))
	return contains(public.Config_.ConverConfig.AudioFormats, format)
}

// IsImageFormat 检查是否为图片格式
func IsImageFormat(format string) bool {
	format = strings.ToUpper(strings.TrimSpace(format))
	return contains(public.Config_.ConverConfig.ImageFormats, format)
}

// IsVideoEncoder 检查是否为视频编码器
func IsVideoEncoder(encoder string) bool {
	encoder = strings.ToLower(strings.TrimSpace(encoder))
	return contains(public.VideoEncoders, encoder)
}

// IsAudioEncoder 检查是否为音频编码器
func IsAudioEncoder(encoder string) bool {
	encoder = strings.ToLower(strings.TrimSpace(encoder))
	return contains(public.AudioEncoders, encoder)
}

// SanitizeEncoder 消毒编码器
func SanitizeEncoder(encoder string) (string, error) {
	if encoder == "" {
		return "", nil // 空编码器是允许的
	}

	encoder = strings.ToLower(strings.TrimSpace(encoder))

	// 检查编码器是否在视频或音频编码器列表中
	if !IsVideoEncoder(encoder) && !IsAudioEncoder(encoder) {
		return "", fmt.Errorf("不支持的编码器: %s", encoder)
	}

	return encoder, nil
}

// 辅助函数：检查切片是否包含某个元素
func contains(slice []string, item string) bool {
	for _, s := range slice {
		if strings.EqualFold(s, item) {
			return true
		}
	}
	return false
}
