import * as PATH from "path";
import * as FS from "fs";
import { IAppConfig, EDeployType } from "./interface/common";
import App from "./app";

function main() {
  // 由环境变量指定部署类型
  const deployType = process.env.DEPLOY_TYPE;
  const confPath = PATH.join(__dirname, "../config");
  const conf = PATH.join(confPath, "config.json");
  const packageFile = FS.readFileSync(
    PATH.join(__dirname, "../package.json"),
    "utf-8"
  );

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
        dataPath: "data",
        autoCleanOldResource: false,
        maxResource: 100
      }
    };
    FS.writeFileSync(conf, JSON.stringify(defaultConf));
    defaultConf.isFirstTime = true;
    new App(defaultConf);
    return;
  }

  try {
    let appConf: IAppConfig = JSON.parse(FS.readFileSync(conf, "utf-8"));
    if (deployType) {
      appConf.server.deployType = deployType;
    }
    appConf.server.version = JSON.parse(packageFile).version;
    new App(appConf);
  } catch (error) {
    console.log(error);
  }
}

main();
