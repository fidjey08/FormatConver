package utils

import (
	"archive/tar"
	"archive/zip"
	"io"
	"os"
	"path/filepath"
	"strings"

	"github.com/ulikunitz/xz"
)

func Unzip(filename string, filepath_ string) {
	r, err := zip.OpenReader(filename)
	if err != nil {
		return
	}
	if err := os.MkdirAll(filepath_, 0755); err != nil {
		return
	}
	for _, f := range r.File {
		targetPath := filepath.Join(filepath_, f.Name)
		if !strings.HasPrefix(targetPath, filepath.Clean(filepath_)+string(os.PathSeparator)) {
			return
		}

		if f.FileInfo().IsDir() {
			// 创建目录
			if err := os.MkdirAll(targetPath, f.Mode()); err != nil {
				return
			}
			continue
		}
		// 确保父目录存在
		if err := os.MkdirAll(filepath.Dir(targetPath), 0755); err != nil {
			return
		}
		// 打开 ZIP 中的文件
		srcFile, err := f.Open()
		if err != nil {
			return
		}
		// 创建目标文件
		dstFile, err := os.OpenFile(targetPath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, f.Mode())
		if err != nil {
			srcFile.Close()
			return
		}
		// 复制内容
		_, err = io.Copy(dstFile, srcFile)
		srcFile.Close()
		dstFile.Close()

		if err != nil {
			return
		}
	}
	defer r.Close()
}
func Untarxz(filename string, filepath_ string) {
	file, err := os.Open(filename)
	if err != nil {
		return
	}
	defer file.Close()
	xzReader, err := xz.NewReader(file)
	if err != nil {
		return
	}
	tarReader := tar.NewReader(xzReader)
	if err := os.MkdirAll(filepath_, 0755); err != nil {
		return
	}
	for {
		header, err := tarReader.Next()
		if err == io.EOF {
			break // 解压完成
		}
		if err != nil {
			return
		}
		targetPath := filepath.Join(filepath_, header.Name)
		if !strings.HasPrefix(targetPath, filepath.Clean(filepath_)+string(os.PathSeparator)) {
			return
		}

		switch header.Typeflag {
		case tar.TypeDir:
			if err := os.MkdirAll(targetPath, 0755); err != nil {
				return
			}
		case tar.TypeReg:
			// 确保父目录存在
			if err := os.MkdirAll(filepath.Dir(targetPath), 0755); err != nil {
				return
			}
			// 创建文件
			outFile, err := os.OpenFile(targetPath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, os.FileMode(header.Mode))
			if err != nil {
				return
			}
			// 写入内容
			_, err = io.Copy(outFile, tarReader)
			outFile.Close()
			if err != nil {
				return
			}
		default:
			return
		}
	}

}
