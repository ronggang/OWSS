// 导入基础库
import * as restify from "restify";
import { IAppConfig } from "./interface/common";
import * as PATH from "path";
import * as FS from "fs";
import { Routers } from "./routers";
import * as extend from "extend";
import * as requestIP from "request-ip";

/**
 * 默认APP
 */
class App {
  public routers: Routers = new Routers(this);
  public config: IAppConfig = {
    server: {
      port: 8088,
      name: "OWSS"
    },
    storage: {
      rootPath: "storage",
      configPath: "conf",
      dataPath: "data"
    }
  };
  public rootPath: string = "";

  constructor(config?: IAppConfig) {
    this.rootPath = PATH.join(__dirname, "../");
    this.config.storage.tmpPath = PATH.join(
      this.rootPath,
      this.config.storage.rootPath,
      "tmp"
    );
    if (!FS.existsSync(this.config.storage.tmpPath)) {
      FS.mkdirSync(this.config.storage.tmpPath, { recursive: true });
    }
    this.config = extend(true, this.config, config);
    this.routers.start();
  }

  /**
   * 验证ip白名单
   * @param req
   */
  public isWhitelist(req: restify.Request, whitelist?: string[]): boolean {
    let ip = requestIP.getClientIp(req);

    if (!this.config.server.enableAccessWhitelist && !whitelist) {
      return true;
    }

    if (!ip) {
      return false;
    }

    if (!whitelist) {
      const config = this.config.server;
      whitelist = config.accessWhitelist;
    }

    let result = false;
    if (whitelist && whitelist.length > 0) {
      whitelist.some(item => {
        let rule = item.replace(/\*/g, "\\d+");
        rule = rule.replace(/\./g, "\\.");
        let match = new RegExp(`^(${rule})$`, "");
        if (match.test(ip)) {
          result = true;
          return true;
        }
        return false;
      });
    }
    return result;
  }
}

export default App;
