import * as restify from "restify";
import App from "../app";
import { Storage } from "../class/storage";
import { EDeployType } from "../interface/common";
import ERROR from "../interface/errorCodes";

export class StorageController {
  public service: Storage;
  constructor(public app: App) {
    this.service = new Storage(app);
  }

  /**
   * 获取指定的资源
   * @param req
   * @param res
   * @param next
   */
  public get(req: restify.Request, res: restify.Response, next: restify.Next) {
    this.service
      .get(req.params.resourceId, req.params.path)
      .then(result => {
        res.send(200, result, {
          "Content-Type": "application/octet-stream",
          "Content-Disposition":
            "attachment; filename=" + (req.params.name || req.params.path)
        });
      })
      .catch(err => {
        res.json({
          error: err
        });
      });

    next();
  }

  /**
   * 获取资源列表
   * @param req
   * @param res
   * @param next
   */
  public list(req: restify.Request, res: restify.Response, next: restify.Next) {
    this.service
      .list(
        req.params.resourceId,
        req.query.search,
        req.query.page,
        req.query.pageSize,
        req.query.orderBy,
        req.query.orderMode
      )
      .then(result => {
        res.json({
          data: result
        });
      })
      .catch(err => {
        res.json({
          error: err
        });
      });

    next();
  }

  /**
   * 创建资源
   * @param req
   * @param res
   * @param next
   */
  public create(
    req: restify.Request,
    res: restify.Response,
    next: restify.Next
  ) {
    console.log("create", req.socket.remoteAddress);
    if (this.app.config.server.deployType === EDeployType.Private) {
      if (!this.app.isWhitelist(req, ["::1", "127.0.0.1", "localhost"])) {
        res.send(401, ERROR.PermissionDenied);
        return;
      }
    }

    this.service
      .create()
      .then(result => {
        res.json({
          data: result
        });
      })
      .catch(err => {
        res.json({
          error: err
        });
      });

    next();
  }

  /**
   * 增加资源
   * @param req
   * @param res
   * @param next
   */
  public add(req: restify.Request, res: restify.Response, next: restify.Next) {
    if (req.files && req.files.data) {
      this.service
        .add(req.params.resourceId, req.params.name, req.files.data.path)
        .then(result => {
          res.json({
            data: result
          });
        })
        .catch(err => {
          res.json({
            error: err
          });
        });
    } else if (req.params.type == "dir") {
      this.service
        .addFolder(req.params.resourceId, req.params.name)
        .then(result => {
          res.json({
            data: result
          });
        })
        .catch(err => {
          res.json({
            error: err
          });
        });
    } else {
      res.send(400, ERROR.InvalidRequest);
    }

    next();
  }

  /**
   * 删除指定的文件或目录
   * @param req
   * @param res
   * @param next
   */
  public delete(
    req: restify.Request,
    res: restify.Response,
    next: restify.Next
  ) {
    this.service
      .delete(req.params.resourceId, req.params.path)
      .then(result => {
        res.json({
          data: result
        });
      })
      .catch(err => {
        res.json({
          error: err
        });
      });

    next();
  }
}
