<p align="center">
OWSS<br/>
<a href="https://github.com/ronggang/OWSS/releases/latest" title="GitHub Releases"><img src="https://img.shields.io/github/v/release/ronggang/OWSS?label=Latest%20Release"></a>
<img src="https://img.shields.io/badge/Used-TypeScript-blue">
<a href="https://github.com/ronggang/OWSS/LICENSE" title="GitHub license"><img src="https://img.shields.io/github/license/ronggang/OWSS?label=License"></a>
<a href="https://t.me/OWSS_Official_Group"><img src="https://img.shields.io/badge/Telegram-Chat-blue?logo=telegram"></a>
</p>

---
Open Web Simple Storage（OWSS），一个基于 `nodejs` 简单的 Web 存储微服务，可用于私人配置文件集中存储。

## 如何使用
- 部署服务器程序；
- 向已部署的服务器申请一个资源ID（授权码）；
- 开始使用
  - 创建文件；
  - 下载文件；
  - 删除文件；

## 服务器部署
- 安装 [nodejs](https://nodejs.org) ；
- 下载最新的发布已编译版本，[点我前往下载](https://github.com/ronggang/OWSS/releases) ；
- 解压到你想要保存的目录（如：`/OWSS/` ）；
- 运行程序；
  ```
  node ./dist/index.js
  ```
- 默认运行在 `8088` 端口下，可通过 `./config/config.json` （会在第一次运行时自动创建）进行一些参数调整；调整后，重新运行程序即可；

## config 文件说明
``` jsonc
{
  // 服务器配置
  "server": {
    // 服务运行的端口号
    "port": 8118,
    // 是否启用访问白名单
    "enableAccessWhitelist": false,
    // 访问白名单列表
    "accessWhitelist": [
      "127.0.0.1",
      "localhost",
      "::1"
    ],
    // 部署类型（Private, Public）
    // 设置为私有时，默认仅在本机可申请创建资源，其他接口可正常使用
    "deployType": "Private"
  }
}
```
示例：
``` json
{
  "server": {
    "port": 8118,
    "deployType": "Private"
  }
}
```

## 客户端使用
- 请求根路径默认为： `http(s)://ip_or_host:port/storage/` ，以下简称：`service_url/`


### GET `service_url/create`
- 申请一个资源ID（`resourceId`），该资源ID用于后续所有操作；
- 如果服务器部署配置为 `Private` ，那么默认情况下，仅允许 `本机` 访问创建资源；

### GET `service_url/:resourceId/list`
- 列出当前资源下的符合条件的文件；
- 可用查询参数：
  - `search`: 要过滤的关键字，默认为所有；
  - `orderBy`: 排序方式，可用：`time`（默认）, `name`, `size` ；
  - `orderMode`: 排序模式，可用：`desc`（默认）, `asc` ；

### POST `service_url/:resourceId/add`
- 添加一个文件，需提供以下字段：
  - `name`: 文件名称；
  - `data`: 文件内容字段；

### GET `service_url/:resourceId/get/:path`
- 获取（下载）一个文件

### POST `service_url/:resourceId/delete/:path`
- 删除一个文件