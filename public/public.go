package public

var Config_ Config

const (
	ConfigFile = "config/config.json"
	FFmpegPath = "ffmpeg/"
)

type Config struct {
	ServerConfig ServerConfig `json:"ServerConfig"`
	SecConfig    SecConfig    `json:"SecConfig"`
	ConverConfig ConverConfig `json:"ConverConfig"`
}

type ServerConfig struct {
	Port                 int    `json:"Port"`                 // 服务器端口
	UploadPath           string `json:"UploadPath"`           // 上传文件路径
	OutPutPath           string `json:"OutPutPath"`           // 输出文件路径
	UploadFileSize       int    `json:"UploadFileSize"`       // 允许上传的最大文件大小 单位MB
	Qscale               int    `json:"Qscale"`               // 默认质量
	EnableQscaleControl  bool   `json:"EnableQscaleControl"`  // 是否允许用户手动调整质量
	CoverGruopProcessNum int    `json:"CoverGruopProcessNum"` // 转换进程并发数
}
type SecConfig struct {
	PassWord string `json:"PassWord"` // 密码 留空则不开启密码
}
type ConverConfig struct {
	VideoFormats []string `json:"VideoFormats"`
	AudioFormats []string `json:"AudioFormats"`
	ImageFormats []string `json:"ImageFormats"`
}

// FFmpeg 格式配置
type FFmpegFormats struct {
	VideoFormats []string `json:"VideoFormats"`
	AudioFormats []string `json:"AudioFormats"`
	ImageFormats []string `json:"ImageFormats"`
}

// FFmpeg 编码器配置
type FFmpegEncoders struct {
	VideoEncoders []string `json:"VideoEncoders"`
	AudioEncoders []string `json:"AudioEncoders"`
}

var FormatCategory = make(map[string]string) // 格式类型映射

var UploadWriteList = []string{}

var VideoEncoders = []string{
	// 最常用的视频编码器
	"libx264", "libx265", "libvpx", "libvpx-vp9", "libaom-av1", "libsvtav1",
	// H.264系列
	"h264_nvenc", "h264_qsv", "h264_amf", "h264_vaapi", "libopenh264", "h264_mf",
	// H.265/HEVC系列
	"hevc_nvenc", "hevc_qsv", "hevc_amf", "hevc_vaapi", "hevc_mf", "hevc_vulkan",
	// AV1系列
	"av1_nvenc", "av1_qsv", "av1_amf", "av1_vaapi", "av1_vulkan", "av1_mf",
	// MPEG系列
	"mpeg4", "libxvid", "mpeg2video", "mpeg1video", "mpeg2_qsv", "mpeg2_vaapi",
	// 苹果系列
	"prores", "prores_ks", "prores_aw",
	// 微软系列
	"wmv1", "wmv2", "msmpeg4", "msmpeg4v2",
	// 图像编码
	"png", "jpeg2000", "libopenjpeg", "mjpeg", "mjpeg_qsv", "mjpeg_vaapi",
	"libjxl", "libwebp", "libwebp_anim", "gif", "bmp", "tiff",
	// 其他常用
	"ffv1", "ffvhuff", "huffyuv", "dnxhd", "rawvideo", "utvideo",
	"vp8_vaapi", "vp9_vaapi", "vp9_qsv", "libvvenc",
	// 专业格式
	"exr", "dpx", "hap", "cfhd", "vc2",
	// 较老但仍在使用
	"h263", "h263p", "h261", "flv", "rv10", "rv20", "svq1",
	"cinepak", "qtrle", "rpza", "zmbv",
	// 图像序列格式
	"apng", "qoi", "sgi", "targa", "xwd", "xbm", "sunrast", "pam", "pbm", "pgm", "ppm",
	"pfm", "phm", "pcx", "wbmp", "fits", "hdr",
	// 其他编码器
	"a64multi", "a64multi5", "alias_pix", "amv", "liboapv", "asv1", "asv2",
	"librav1e", "avrp", "libxavs2", "avui", "bitpacked", "cljr", "dvvideo",
	"dxv", "ffv1_vulkan", "flashsv", "flashsv2", "libx264rgb", "h264_vulkan",
	"hevc_d3d12va", "libkvazaar", "jpegls", "libjxl_anim", "ljpeg", "magicyuv",
	"msrle", "msvideo1", "pgmyuv", "r10k", "r210", "roqvideo", "smc", "snow",
	"speedhq", "libtheora", "v210", "v308", "v408", "v410", "vbn", "vnull",
	"wrapped_avframe", "xface", "y41p", "yuv4", "zlib",
}

var AudioEncoders = []string{
	// 最常用的音频编码器
	"aac", "libmp3lame", "libopus", "libvorbis", "flac", "alac",
	// AAC系列
	"aac_mf",
	// MP3系列
	"mp3_mf", "libtwolame", "mp2", "mp2fixed",
	// Opus系列
	"opus",
	// AC3系列
	"ac3", "ac3_mf", "ac3_fixed", "eac3",
	// PCM系列
	"pcm_s16le", "pcm_s24le", "pcm_s32le", "pcm_f32le", "pcm_f64le",
	"pcm_s16be", "pcm_s24be", "pcm_s32be", "pcm_f32be", "pcm_f64be",
	"pcm_s16le_planar", "pcm_s24le_planar", "pcm_s32le_planar",
	"pcm_s16be_planar", "pcm_s8", "pcm_u8", "pcm_s8_planar",
	"pcm_u16le", "pcm_u16be", "pcm_u24le", "pcm_u24be", "pcm_u32le", "pcm_u32be",
	"pcm_alaw", "pcm_mulaw", "pcm_bluray", "pcm_dvd", "pcm_vidc", "pcm_s24daud",
	// 无损格式
	"wavpack", "tta",
	// ADPCM系列
	"adpcm_ms", "adpcm_ima_wav", "adpcm_swf", "adpcm_yamaha", "adpcm_ima_qt",
	"adpcm_adx", "adpcm_argo", "g722", "g726", "g726le",
	"adpcm_ima_alp", "adpcm_ima_amv", "adpcm_ima_apm", "adpcm_ima_ssi", "adpcm_ima_ws",
	// 专业音频
	"truehd", "mlp", "dca", "s302m",
	// 其他常用
	"vorbis", "wmav1", "wmav2", "nellymoser", "real_144",
	// 蓝牙音频
	"aptx", "aptx_hd", "sbc",
	// 移动设备
	"libopencore_amrnb", "g723_1",
	// 特殊用途
	"comfortnoise", "dfpwm", "roq_dpcm", "anull",
}
