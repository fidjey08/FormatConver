package utils

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
)

// ProgressReader 包装 io.Reader 以跟踪下载进度
type ProgressReader struct {
	reader   io.Reader
	total    int64
	current  int64
	onUpdate func(current, total int64)
}

func (pr *ProgressReader) Read(p []byte) (int, error) {
	n, err := pr.reader.Read(p)
	pr.current += int64(n)
	if pr.onUpdate != nil {
		pr.onUpdate(pr.current, pr.total)
	}
	return n, err
}

// formatBytes 将字节数格式化为人类可读的格式
func formatBytes(bytes int64) string {
	const unit = 1024
	if bytes < unit {
		return fmt.Sprintf("%d B", bytes)
	}
	div, exp := int64(unit), 0
	for n := bytes / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	units := []string{"KB", "MB", "GB", "TB"}
	unitStr := units[exp]
	return fmt.Sprintf("%.2f %s", float64(bytes)/float64(div), unitStr)
}

func webDownload(url string, path string, filename string) int {
	resp, err := http.Get(url)
	if err != nil {
		log.Println(err.Error())
		return 0
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return 0
	}
	contentLength := resp.ContentLength
	err_ := os.MkdirAll(path, 0755)
	if err_ != nil {
		log.Println(err_.Error())
		return 0
	}
	out, err := os.Create(path + "/" + filename)
	if err != nil {
		log.Println(err.Error())
		return 0
	}
	defer out.Close()

	progressReader := &ProgressReader{
		reader: resp.Body,
		total:  contentLength,
		onUpdate: func(current, total int64) {
			// 计算进度百分比
			var percent float64
			if total > 0 {
				percent = float64(current) / float64(total) * 100
			} else {
				percent = 0 // 对于未知大小的下载
			}

			// 清除当前行并打印进度
			fmt.Printf("\r下载进度: %6.2f%% [%s/%s]",
				percent,
				formatBytes(current),
				formatBytes(total))

			// 当下载完成时换行
			if current == total && total > 0 {
				fmt.Println() // 换行
			}
		},
	}
	_, err = io.Copy(out, progressReader)
	if err != nil {
		log.Println(err.Error())
		return 0
	}
	return 1
}
