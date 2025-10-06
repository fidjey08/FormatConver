# FormatCnver
![FormatConver](https://socialify.git.ci/Mangofang/FormatConver/image?custom_description=%E7%AE%80%E5%8D%95%E3%80%81%E5%BF%AB%E9%80%9F%E3%80%81%E8%BD%BB%E9%87%8F%E7%BA%A7%E7%9A%84FFmpeg%E5%9C%A8%E7%BA%BF%E6%96%87%E4%BB%B6%E8%BD%AC%E6%8D%A2%E5%B9%B3%E5%8F%B0&description=1&font=Inter&forks=1&issues=1&logo=https%3A%2F%2Fforeverhome.live%2Ffile%2FFormatConverLogo.png&name=1&owner=1&pattern=Floating+Cogs&stargazers=1&theme=Dark)

> 基于FFmpeg的轻量级的在线文件格式转换平台

**<a href="https://filec.foreverhome.live" target="_blank">演示站：https://filec.foreverhome.live</a>**

🌐 **[English README](README_EN.md)**

如果你有任何问题或反馈程序问题请提交`Issues`

<img src="https://github.com/user-attachments/assets/488e204d-47c6-4e0d-a200-48460fad175c" />

## 关于：
由于作者本人对格式转换功能的需求同时对相关文件上传到`在线平台`可能导致的`信息泄露`的担忧，故有的这个工具

同时与本地转换工具不同，你可将它部署在远程服务器，转换的运算过程将在远程主机上进行，这也为移动端进行转换提供了更多选择

## 声明：
1. 文中所涉及的技术、思路和工具仅供以安全为目的的学习交流使用，任何人不得将其用于非法用途以及盈利等目的，否则后果自行承担！
2. 水平不高，纯萌新面向Google编程借鉴了很多大佬的代码，请自行酌情修改

## 支持平台：
服务端：Windows && Linux

前端：桌面端Web、移动端Web（已做部分适配）

> 前端均由AI生成，如有需要自定更改

## TODO

> [!TIP]
>
> - [ √ ] 文件大小限制 - 允许在config.json中配置文件大小上传限制
> - [ √ ] 自动部署 - 现在仅需要下载静态页面和程序本体即可立即运行
> - [ √ ] 密码保护 - 现在支持在config.json中设定密码保护你的应用

## 部署

你需要下载`static`并根据部署的操作系统下载对应的`FormatConver`两个文件，将他们放在一起

建议在Windows中使用CMD运行FormatConver而不是直接打开
```
# Windows
FormatConver

# Linux
chmod +x FormatConver
./FormatConver
```
运行后程序会自动创建和下载所需文件

在第一次启动时请手动对config/config.json进行配置

## Config.json

以下是对配置文件内容进行解释，仅作参考，不代表你可以直接复制粘贴它们
```
{
  "ServerConfig": {
    "Port": 8081, # webapi端口
    "UploadPath": "upload/", # 用户上传的文件路径
    "OutPutPath": "output/", # 导出的文件路径
    "UploadFileSize": 100, # 允许上传的最大文件大小 根据你的主机性能进行设置
    "Qscale": 1, # 默认的量化参数 越小图像质量越高
    "EnableQscaleControl": true, # 是否允许用户控制量化参数
	  "CoverGruopProcessNum": 2 # 允许并发的转换进程 根据你的主机性能进行设置
  },
  "SecConfig": {
    "PassWord": "" # 访问密码 留空则不进行密码验证
  },
  "ConverConfig": {
    "VideoFormats": [ # 一下均为允许转换的格式
      "MP4",
      ...
    ],
    "AudioFormats": [
      "MP3",
      ...
    ],
    "ImageFormats": [
      "PNG",
      ...
    ]
  }
}
```

## 可能的更新
1. PDF 转换 Office格式
