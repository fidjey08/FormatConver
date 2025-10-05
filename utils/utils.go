package utils

import (
	"FormatConver/public"
	"crypto/rand"
	"encoding/json"
	"log"
	"os"
	"path"
	"runtime"
)

// GetSystem 函数用于判断当前运行的操作系统是否为Windows系统
// 返回值：1表示是Windows系统，0表示非Windows系统
func GetSystem() int {
	if runtime.GOOS == "windows" {
		return 1
	}
	return 0
}
func CreateConfig() {
	defaultConfig := public.Config{ // 默认初次生成的config.json配置
		ServerConfig: public.ServerConfig{
			Port:                 8081,
			UploadFileSize:       100,
			UploadPath:           "upload/",
			OutPutPath:           "output/",
			Qscale:               1,
			EnableQscaleControl:  true,
			CoverGruopProcessNum: 2,
		},
		SecConfig: public.SecConfig{
			PassWord: "",
		},
		ConverConfig: public.ConverConfig{
			VideoFormats: []string{"AVI", "MOV", "WEBM", "MPEG", "WMV", "MPG",
				"MPEG-2", "3GP", "MKV", "HEVC", "M4V", "OGV",
				"DIVX", "MJPEG", "FLV", "SWF", "AV1", "XVID",
				"AVCHD", "VOB", "TS", "MXF", "M2V", "ASF",
				"MTS", "RMVB", "F4V", "3G2", "WTV", "RM",
				"M2TS", "MP4"},
			AudioFormats: []string{"MP3", "WAV", "OGG", "M4A", "M4R", "WMA",
				"OPUS", "AAC", "FLAC", "W64", "MP2", "AIFF",
				"AMR", "8SVX", "AU", "CDDA", "AC3", "CVS",
				"GSM", "DTS", "CAF", "OGA", "VOC", "AVR",
				"WV", "VMS", "SMP", "SND", "SPX", "AMB",
				"IMA", "HCOM", "VOX", "RA", "WVE", "CVU",
				"TXW", "FAP", "SOU", "CVSD", "SLN", "PRC",
				"TTA", "PVF", "PAF", "DVMS", "SPH", "SD2",
				"MAUD", "SNDR", "SNDT", "FSSD", "GSRT", "HTK",
				"IRCAM", "NIST"},
			ImageFormats: []string{"SVG", "ICO", "JPG", "WEBP", "JPEG", "DDS",
				"GIF", "CUR", "BMP", "HDR", "PSD", "TIFF",
				"TGA", "AVIF", "RGB", "HEIC", "XPM", "JFIF",
				"EXR", "HEIF", "XBM", "PGM", "RGBA", "PPM",
				"PCX", "WBMP", "JBG", "PICON", "G3", "MAP",
				"PNM", "JPE", "JP2", "PBM", "PDB", "JIF",
				"PAL", "YUV", "RAS", "SIXEL", "PICT", "JBIG",
				"PCD", "JPS", "PGX", "PFM", "FTS", "PCT",
				"UYVY", "XWD", "JFI", "FAX", "OTB", "RGBO",
				"G4", "SIX", "IPL", "SUN", "PAM", "SGI",
				"RGF", "MNG", "VIPS", "HRZ", "PALM", "XV",
				"MTV", "VIFF", "PNG"},
		},
	}
	jsonData, err := json.MarshalIndent(&defaultConfig, "", "  ")
	if err != nil {
		log.Println(err.Error())
		return
	}
	if err := os.MkdirAll("config", 0755); err != nil {
		log.Println(err.Error())
		return
	}
	os.WriteFile("config/config.json", jsonData, 0644)
}
func InstallFFmpeg() {
	windowsUrl := "http://foreverhome.live/file/ffmpeg/win/ffmpeg.zip"
	linuxUrl := "http://foreverhome.live/file/ffmpeg/linux/ffmpeg.zip"
	if GetSystem() == 1 {
		if webDownload(windowsUrl, "ffmpeg", "ffmpeg.zip") == 1 {
			ExtFile("ffmpeg/ffmpeg.zip", "ffmpeg")
			return
		}
	} else {
		if webDownload(linuxUrl, "ffmpeg", "ffmpeg.zip") == 1 {
			ExtFile("ffmpeg/ffmpeg.zip", "ffmpeg")
			os.Chmod("ffmpeg/ffmpeg", 0755)
			return
		}
	}
}
func ExtFile(filename string, filepath string) int {
	fileSuffix := path.Ext(filename)
	switch fileSuffix {
	case ".zip":
		Unzip(filename, filepath)
		return 1
	case ".xz":
		Untarxz(filename, filepath)
		return 1
	}
	return 0
}
func RandString(n int) string {
	var letters = []byte("abcdefghjkmnpqrstuvwxyz123456789")
	if n <= 0 {
		return ""
	}
	b := make([]byte, n)
	arc := uint8(0)
	if _, err := rand.Read(b[:]); err != nil {
		return ""
	}
	for i, x := range b {
		arc = x & 31
		b[i] = letters[arc]
	}
	return string(b)
}
