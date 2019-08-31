/**
 * 服务器部署类型
 */
export enum EDeployType {
  Private = "Private",
  Public = "Public"
}

/**
 * 用户验证类型
 */
export enum EAuthType {
  OAuth2 = "OAuth2",
  None = "None"
}

export interface IAppConfig {
  server: {
    version: string;
    name: string;
    port: number;
    // 启用访问白名单
    enableAccessWhitelist?: boolean;
    // 访问白名单
    accessWhitelist?: string[];
    // 部署类型，设置为私有时，默认仅在内网可申请创建资源
    deployType?: EDeployType;
  };

  storage: IStorageServiceConfig;
}

export interface IResourceOptions {
  authType?: EAuthType;
}

export interface IStorageServiceConfig {
  dataPath: string;
  configPath: string;
  rootPath: string;
  maxResource?: number;
  tmpPath?: string;
  resourceBlacklist?: string[];
}

export enum EResourceOrderBy {
  time = "time",
  name = "name",
  size = "size"
}

export enum EResourceOrderMode {
  desc = "desc",
  asc = "asc"
}
