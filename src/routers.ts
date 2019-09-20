// 导入基础库
import * as restify from "restify";
import { StorageController } from "./controllers/storage";
import App from "./app";
import ERROR from "./interface/errorCodes";

export class Routers {
  public server: restify.Server;
  constructor(public app: App) {
    this.server = {} as any;
  }

  /**
   * 挂载路由
   */
  private mountRoutes(): void {
    this.server.get(
      "/storage",
      (req: restify.Request, res: restify.Response, next: restify.Next) => {
        res.send(200, "Welcome to use OWSS.");
        next();
      }
    );

    let storage = new StorageController(this.app);

    // 创建
    this.server.get(
      "/storage/create",
      (req: restify.Request, res: restify.Response, next: restify.Next) => {
        storage.create(req, res, next);
      }
    );

    // 获取列表
    this.server.get(
      "/storage/:resourceId/list",
      (req: restify.Request, res: restify.Response, next: restify.Next) => {
        storage.list(req, res, next);
      }
    );

    this.server.post(
      "/storage/:resourceId/add",
      (req: restify.Request, res: restify.Response, next: restify.Next) => {
        storage.add(req, res, next);
      }
    );

    this.server.get(
      "/storage/:resourceId/get/:path",
      (req: restify.Request, res: restify.Response, next: restify.Next) => {
        storage.get(req, res, next);
      }
    );

    this.server.post(
      "/storage/:resourceId/delete/:path",
      (req: restify.Request, res: restify.Response, next: restify.Next) => {
        storage.delete(req, res, next);
      }
    );
  }

  /**
   * 初始化插件
   */
  private initPlugins(server: restify.Server) {
    // 使用数据解析器
    server.use(
      restify.plugins.bodyParser({
        uploadDir: this.app.config.storage.tmpPath
      }),
      restify.plugins.queryParser()
    );

    // 设置允许跨域头信息
    server.use(function crossOrigin(req, res, next) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "X-Requested-With");
      return next();
    });

    // 验证白名单
    server.use((req, res, next) => {
      if (req.socket.remoteAddress && this.app.isWhitelist(req)) {
        next();
      } else {
        res.send(401, ERROR.PermissionDenied);
      }
    });
  }

  /**
   * 启动服务
   */
  public start() {
    let server = restify.createServer({
      name: this.app.config.server.name
    });

    this.initPlugins(server);

    this.server = server;
    this.mountRoutes();

    const port = this.app.config.server.port;

    server.listen(port, () => {
      const storageConfg = this.app.config.storage;
      console.log(
        "\n%s 服务已启动 \n当前版本：%s \n本地端口：%s \n部署类型：%s \n自动清理：%s \n服务地址：%s \n%s \n使用说明：%s",
        this.server.name,
        this.app.config.server.version,
        port,
        this.app.config.server.deployType,
        storageConfg.autoCleanOldResource
          ? `已启用，每个授权码最多可存储 ${storageConfg.maxResource} 个资源`
          : "未启用",
        `http://127.0.0.1:${port}/stroage`,
        "-----------------------------------------",
        "https://github.com/ronggang/OWSS"
      );
    });
  }
}
