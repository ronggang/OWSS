import * as PATH from "path";
import * as FS from "fs";
import * as CryptoJS from "crypto-js";
import App from "../app";
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
    maxResource: 100,
    autoCleanOldResource: false
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
      JSON.stringify(
        Object.assign({ authType: "none", resourceCount: 0 }, options)
      )
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
        FS.readFile(fullPath, (err, data) => {
          resolve(data);
        });
      } else {
        reject(ERROR.InvalidResourceName);
      }
    });
  }

  public getShare(shareId: string): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      if (!this.config.sharePath) {
        reject(null);
        return;
      }

      const sharePath = PATH.join(this.config.sharePath, shareId);

      if (FS.existsSync(sharePath)) {
        const filePath = FS.readFileSync(sharePath);
        FS.readFile(filePath, (err, data) => {
          resolve(data);
        });
      } else {
        reject(ERROR.InvalidResourceId);
      }
    });
  }  

  /**
   * 获取指定路径下的资源列表
   * @param path 路径
   * @param search 搜索关键字
   * @param page 页码
   * @param pageSize 需要显示的数量
   * @param orderBy 排序字段
   * @param orderMode 排序模式（asc, desc）
   */
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
      .slice(startIndex, pageSize === -1 ? undefined : startIndex + pageSize);
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
            this.resourceCountDecrement(resourceId);
            resolve(true);
          } else {
            reject(error);
          }
        });
      } else {
        FS.unlink(fullPath, error => {
          if (!error) {
            this.resourceCountDecrement(resourceId);
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
  public add(resourceId: string, name: string, data: any, share: boolean=false): Promise<any> {
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

      const config = this.getConfig(resourceId);
      if (config.resourceCount === undefined) {
        this.resetResourceCount(resourceId);
      }

      this.cleanOldResource(resourceId);

      // 替换非法文件名称
      name = name.replace(/(<|>|\/|\||\\|\:|\"|\*|\?)/g, "_");

      const currentDirectory = this.getDataDirectory(resourceId);
      const path = PATH.join(currentDirectory, name);

      try {
        if (PATH.isAbsolute(data)) {
          FS.renameSync(data, path)
        } else {
          FS.writeFileSync(path, data);
        }
  
        this.resourceCountIncrement(resourceId);
  
        // 是否共享
        if (share && this.config.sharePath) {
          const shareId = this.getNewId();
          const sharePath = PATH.join(this.config.sharePath, shareId);
          FS.writeFileSync(sharePath, path);
          resolve({
            shareId
          })
          return;
        }
  
        resolve(true);
      } catch (error) {
        reject(error)
      }
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

  /**
   * 重置指定资源的文件数量（不包含子目录）
   * @param resourceId
   */
  public resetResourceCount(resourceId: string) {
    const config = this.getConfig(resourceId);
    if (config.resourceCount === undefined) {
      config.resourceCount = 0;
    }

    const configFile = this.getConfigFile(resourceId);

    const currentDirectory = this.getDataDirectory(resourceId);

    config.resourceCount = FS.readdirSync(currentDirectory, {
      withFileTypes: true
    }).filter(item => {
      return item.isFile();
    }).length;

    FS.writeFileSync(configFile, JSON.stringify(config));
  }

  public resourceCountIncrement(resourceId: string): number {
    const config = this.getConfig(resourceId);
    if (config.resourceCount === undefined) {
      config.resourceCount = 0;
    }

    const configFile = this.getConfigFile(resourceId);

    config.resourceCount++;

    FS.writeFileSync(configFile, JSON.stringify(config));

    return config.resourceCount;
  }

  public resourceCountDecrement(resourceId: string, count: number = 1): number {
    const config = this.getConfig(resourceId);
    if (config.resourceCount === undefined) {
      config.resourceCount = 0;
    }

    const configFile = this.getConfigFile(resourceId);

    config.resourceCount = config.resourceCount - count;
    if (config.resourceCount < 0) {
      config.resourceCount = 0;
    }

    FS.writeFileSync(configFile, JSON.stringify(config));

    return config.resourceCount;
  }

  /**
   * 清理老文件
   * @param resourceId
   */
  private cleanOldResource(resourceId: string) {
    if (!this.config.maxResource || !this.config.autoCleanOldResource) {
      return;
    }

    const config = this.getConfig(resourceId);

    if (!config.resourceCount) {
      return;
    }

    // 如果超出最大数量，则删除最老的文件
    if (config.resourceCount >= this.config.maxResource) {
      const cleanCount = config.resourceCount - this.config.maxResource + 1;
      const currentDirectory = this.getDataDirectory(resourceId);
      const list = this.getResourceList(
        currentDirectory,
        "",
        1,
        cleanCount,
        EResourceOrderBy.time,
        EResourceOrderMode.asc
      );

      if (list.length > 0) {
        list.forEach(item => {
          const fullPath = PATH.join(currentDirectory, item.name);
          FS.unlinkSync(fullPath);
        });

        this.resourceCountDecrement(resourceId, cleanCount);
      }
    }
  }
}
