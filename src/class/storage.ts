import * as PATH from "path";
import * as FS from "fs";
import * as CryptoJS from "crypto-js";
import App from "@/app";
import {
  IStorageServiceConfig,
  IResourceOptions,
  EResourceOrderBy,
  EResourceOrderMode
} from "../interface/common";
import ERROR from "../interface/errorCodes";

export class Storage {
  private rootPath: string = "";
  public config: IStorageServiceConfig = {
    dataPath: "data",
    configPath: "conf",
    rootPath: "storage",
    maxResource: 100
  };

  constructor(app: App) {
    this.config = Object.assign(this.config, app.config.storage);
    this.rootPath = PATH.resolve(app.rootPath, this.config.rootPath);
  }

  /**
   * 创建一个资源目录
   */
  public create(options?: IResourceOptions): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      const id = this.getNewId();
      this.createConfig(id, options);

      resolve(id);
    });
  }

  /**
   * 创建资源配置信息
   * @param resourceId
   * @param options
   */
  private createConfig(resourceId: string, options?: IResourceOptions) {
    const configFile = this.getConfigFile(resourceId);
    const configPath = PATH.parse(configFile).dir;
    const dataPath = this.getDataDirectory(resourceId);
    FS.mkdirSync(configPath, { recursive: true });
    FS.mkdirSync(dataPath, { recursive: true });
    FS.writeFileSync(
      configFile,
      JSON.stringify(Object.assign({ authType: "none" }, options))
    );
  }

  private getConfigFile(resourceId: string): string {
    return PATH.join(
      this.rootPath,
      this.config.configPath,
      resourceId.substr(0, 1),
      `${resourceId}.json`
    );
  }

  private getConfig(resourceId: string): IResourceOptions {
    const path = this.getConfigFile(resourceId);

    const result = FS.readFileSync(path, "utf-8");
    return JSON.parse(result);
  }

  /**
   * 获取当前资源目录
   * @param resourceId
   */
  private getDataDirectory(resourceId: string): string {
    return PATH.join(
      this.rootPath,
      this.config.dataPath,
      resourceId.substr(0, 1),
      resourceId
    );
  }

  public get(resourceId: string, path: string): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      if (!this.checkResourceId(resourceId)) {
        reject(ERROR.InvalidResourceId);
        return;
      }

      const currentDirectory = this.getDataDirectory(resourceId);
      const fullPath = PATH.join(currentDirectory, path);

      if (FS.existsSync(fullPath)) {
        FS.readFile(path, (err, data) => {
          resolve(data);
        });
      } else {
        reject(ERROR.InvalidResourceName);
      }
    });
  }

  private getResourceList(
    path: string,
    search: string = "",
    page: number = 1,
    pageSize: number = 10,
    orderBy: EResourceOrderBy = EResourceOrderBy.time,
    orderMode: EResourceOrderMode = EResourceOrderMode.desc
  ) {
    const startIndex = (page - 1) * pageSize;
    return FS.readdirSync(path)
      .filter(name => {
        return name.indexOf(search) !== -1;
      })
      .map(name => {
        const stat = FS.statSync(PATH.join(path, name));

        return {
          name,
          time: stat.mtime.getTime(),
          type: stat.isDirectory() ? "directory" : "file",
          size: stat.size
        };
      })
      .sort((a, b) => {
        let v1, v2;
        switch (orderBy) {
          case EResourceOrderBy.name:
            v1 = a.name;
            v2 = b.name;
            break;

          case EResourceOrderBy.size:
            v1 = a.size;
            v2 = b.size;
            break;

          default:
            v1 = a.time;
            v2 = b.time;
            break;
        }

        if (orderMode === EResourceOrderMode.desc) {
          return v1.toString().localeCompare(v2) == 1 ? -1 : 1;
        } else {
          return v1.toString().localeCompare(v2);
        }
      })
      .slice(startIndex, startIndex + pageSize);
  }

  public list(
    resourceId: string,
    search: string = "",
    page: number = 1,
    pageSize: number = 10,
    orderBy: EResourceOrderBy = EResourceOrderBy.time,
    orderMode: EResourceOrderMode = EResourceOrderMode.desc
  ): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      if (!this.checkResourceId(resourceId)) {
        reject(ERROR.InvalidResourceId);
        return;
      }
      const currentDirectory = this.getDataDirectory(resourceId);
      const result = this.getResourceList(
        currentDirectory,
        search,
        page,
        pageSize,
        orderBy,
        orderMode
      );

      resolve(result);
    });
  }

  /**
   * 删除指定的文件或目录
   */
  public delete(resourceId: string, path: string): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      if (!this.checkResourceId(resourceId)) {
        reject(ERROR.InvalidResourceId);
        return;
      }

      if (!path) {
        reject(ERROR.InvalidResourcePath);
        return;
      }

      const currentDirectory = this.getDataDirectory(resourceId);
      const fullPath = PATH.join(currentDirectory, path);
      const stat = FS.statSync(fullPath);

      if (stat.isDirectory()) {
        FS.rmdir(fullPath, error => {
          if (!error) {
            resolve(true);
          } else {
            reject(error);
          }
        });
      } else {
        FS.unlink(fullPath, error => {
          if (!error) {
            resolve(true);
          } else {
            reject(error);
          }
        });
      }
    });
  }

  /**
   * 添加文件
   * @param resourceId
   * @param name
   * @param data
   */
  public add(resourceId: string, name: string, data: any): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      if (!this.checkResourceId(resourceId)) {
        reject(ERROR.InvalidResourceId);
        return;
      }

      if (!name) {
        reject(ERROR.InvalidResourceName);
        return;
      }

      if (!data) {
        reject(ERROR.InvalidResourceData);
        return;
      }

      // 替换非法文件名称
      name = name.replace(/(<|>|\/|\||\\|\:|\"|\*|\?)/g, "_");

      const currentDirectory = this.getDataDirectory(resourceId);
      const path = PATH.join(currentDirectory, name);

      if (PATH.isAbsolute(data)) {
        FS.rename(data, path, error => {
          if (!error) {
            resolve(true);
          } else {
            reject(error);
          }
        });
        return;
      } else {
        FS.writeFileSync(path, data);
      }

      resolve(true);
    });
  }

  public addFolder(resourceId: string, path: string): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      if (!this.checkResourceId(resourceId)) {
        reject(ERROR.InvalidResourceId);
        return;
      }

      if (!path) {
        reject(ERROR.InvalidResourcePath);
        return;
      }

      const currentDirectory = this.getDataDirectory(resourceId);
      const fullPath = PATH.join(currentDirectory, path);

      FS.mkdirSync(fullPath, { recursive: true });

      resolve(true);
    });
  }

  public checkResourceId(resourceId: string): boolean {
    if (/^[a-z0-9]{32}$/.test(resourceId)) {
      return FS.existsSync(this.getDataDirectory(resourceId));
    }
    return false;
  }

  private getNewId() {
    const chars =
      "abcdefghijkmnopqrstuvwxyz0123456789ABCDEFGHIJKMNOPQRSTUVWXYZ";
    const maxLength = chars.length;
    const result: string[] = [];
    for (let i = 0; i < 32; i++) {
      result.push(chars.charAt(Math.floor(Math.random() * maxLength)));
    }

    return CryptoJS.MD5(
      new Date().getTime().toString() + result.join("")
    ).toString();
  }
}
