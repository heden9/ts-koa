import * as Koa from "koa";
import * as fs from "fs";
import * as Router from "koa-router";
import { BaseContext } from "koa";


export default class Loader {
  router: Router = new Router;
  controller: any = {};
  app: Koa;
  constructor(app: Koa){
    this.app = app;
  }
  /**
   * 装载 src/service/*
   * this.ctx.service.[文件名].[方法名] 对于每一个ctx也需要有唯一的service
   */
  loadService() {
    const dirs = fs.readdirSync(__dirname + '/service');
    Object.defineProperty(this.app.context, 'service', {
      get(){
        if (!(<any>this).cache){
          (<any>this).cache = {};
        }
        const loaded = (<any>this).cache;
        if (!loaded.service){
          loaded.service = {};
          dirs.forEach((filename: string) => {
            const [name] = filename.split('.');
            const _class = require(__dirname + '/service/' + filename).default;
            if (_class){
              loaded.service[name] = new _class(this);
            }
          })
        }
        return loaded.service;
      }
    })
  }
  /**
   * 装载 src/controller/*
   */
  loadController() {
    const dirs = fs.readdirSync(__dirname + '/controller');
    dirs.forEach((filename: string) => {
      const [property] = filename.split('.');
      const mod = require(__dirname + '/controller/' + filename).default;
      if (mod){
        const methodNames = Object.getOwnPropertyNames(mod.prototype).filter(name => name !== 'constructor');
        const merge: { [key: string]: any } = {};
        methodNames.forEach((name: string) => {
          merge[name] = {
            type: mod,
            methodNames: name
          }
        });
        Object.defineProperty(this.controller, property, {
          get() {
            return merge;
          }
        })
      }
    });
  }

  /**
   * 装载 src/router.ts
   */
  loadRouter() {
    this.loadController();
    this.loadService();
    const configHandle = require(__dirname + '/router.js');
    const routers = configHandle(this.controller);
    Object.keys(routers).forEach((key: string) => {
      const [method, path] = key.split(' ');
      (<any>this.router)[method](path , async (ctx: BaseContext) => {
        const _class = routers[key].type;
        const handler = routers[key].methodNames;
        const instance = new _class(ctx); // 保证每一次请求，都有一个新的ctrl对象
        instance[handler]();
      })
    })
    return this.router.routes();
  }
}
