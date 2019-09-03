import * as PATH from "path";
import * as FS from "fs";
import { IAppConfig, EDeployType } from "./interface/common";
import App from "./app";

function main() {
  // 由环境变量指定部署类型
  let deployType = process.env.DEPLOY_TYPE;
  let confPath = PATH.join(__dirname, "../config");
  let conf = PATH.join(confPath, "config.json");
  if (!FS.existsSync(conf)) {
    if (!FS.existsSync(confPath)) {
      FS.mkdirSync(confPath, {
        recursive: true
      });
    }

    let defaultConf: IAppConfig = {
      server: {
        port: 8088,
        name: "OWSS",
        version: "0.0.1",
        enableAccessWhitelist: false,
        deployType: deployType || EDeployType.Private
      },
      storage: {
        rootPath: "storage",
        configPath: "conf",
        dataPath: "data"
      }
    };
    FS.writeFileSync(conf, JSON.stringify(defaultConf));
    new App(defaultConf);
    return;
  }

  try {
    let appConf: IAppConfig = JSON.parse(FS.readFileSync(conf, "utf-8"));
    if (deployType) {
      appConf.server.deployType = deployType;
    }
    new App(appConf);
  } catch (error) {
    console.log(error);
  }
}

main();
