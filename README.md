<p align="center">
OWSS<br/>
<a href="https://github.com/ronggang/OWSS/releases/latest" title="GitHub Releases"><img src="https://img.shields.io/github/v/release/ronggang/OWSS?label=Latest%20Release"></a>
<a href="https://hub.docker.com/r/ronggang/owss" title="Docker Pulls"><img src="https://img.shields.io/docker/pulls/ronggang/owss?label=Docker%20Pulls"></a>
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
### 方式一：Docker 部署
- 安装 [Docker](https://docker.com) 
- 拉取镜像
  ``` shell
  docker pull ronggang/owss
  ```
- 部署示例
  ``` shell
  # Linux
  docker run -d -v /OWSS/storage:/app/storage -v /OWSS/config:/app/config -p 8088:8088 ronggang/owss

  # Windows
  docker run -d -v "D:/OWSS/storage":/app/storage -v "D:/OWSS/config":/app/config -p 8088:8088 ronggang/owss
  ```
- 数据目录
  - `/app/storage` : 数据存储目录；
  - `/app/config` : 服务运行配置目录；

- 如果您需要部署到 `群晖 NAS` 里，请参考 [Synology 部署说明](https://github.com/ronggang/OWSS/wiki/Install-Synology)；


### 方式二：从源码部署
- 安装环境依赖：
  - [nodejs](https://nodejs.org) ；
  - [pnpm](https://pnpm.io/zh/) ；
- 下载最新的发布版本，[点我前往下载](https://github.com/ronggang/OWSS/releases) ；
- 解压到你想要保存的目录（如：`/OWSS/` ）；
- 如果您已安装 [git](https://git-scm.com) ，也可直接 `clone` 本项目：
  ```
  git clone https://github.com/ronggang/OWSS.git
  ```
- 运行程序；
  ```
  pnpm init
  ```

## 首次运行说明
- 首次运行时，会自动创建一个 `./config/config.json` 文件，同时生成一个授权码，请留意 `stdout` 输出内容；
- 程序默认运行在 `8088` 端口下，可通过 `./config/config.json` 进行参数调整；调整后，重新运行程序即可；

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
    // 设置为私有时，默认仅在本机可申请创建资源，其他接口（如上传、下载）可正常使用
    "deployType": "Private"
  },
  // 存储配置
  "storage": {
    // 最大资源数量
    "maxResource": 10,
    // 是否启用自动清理，如果启用该参数，每个授权码最多允许存储 `maxResource` 个文件，超过时会自动删除最老的文件
    "autoCleanOldResource": false
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
- 请求根路径默认为： `http(s)://ip_or_host:port/storage` ，该地址为服务地址，例：
  - `http://192.168.10.10:8088/storage`

- 为行文方便，服务地址以下简称：`service_url/`


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
  - `share`: 是否共享文件，默认为 `false`
    - 当启用共享文件时，创建成功后会同时返回一个 `shareId` ，可根据这个 `shareId` 来访问资源，而不必暴露 `resourceId`
    - 访问方法：`http(s)://ip_or_host:port/share/shareId` ，如：
      - `http://192.168.10.10:8088/share/abc1234567890`

### GET `service_url/:resourceId/get/:path`
- 获取（下载）一个文件

### POST `service_url/:resourceId/delete/:path`
- 删除一个文件

### GET `service_url/share/:id`
- 获取（下载）一个已共享的文件