import * as Koa from "koa";
import * as path from "path";
import * as fs from "fs";
import { promisify } from 'util';
import * as Router from "koa-router";
import { bp } from "./blueprint";
import { BaseContext } from "koa";
import logger from "./logger";
const readDir = promisify(fs.readdir);
const HASLOADED = Symbol('hasloaded')

interface SubString {
  isFound: boolean,
  source: string
}
interface FileModule {
  module: any,
  filename: string
}
export class Loader {
  router: Router = new Router;
  app: Koa;
  constructor(app: Koa){
    this.app = app;
  }
  private appDir(): string {
    const subString = removeString(__dirname, 'node_modules');
    if (subString.isFound) {
      return subString.source
    }
    return subString.source.slice(0, -4) + '/';
  }

  private fileLoader(url: string): Promise<Array<FileModule>> {
    const merge = this.appDir() + url;
    return readDir(merge).then(dirs => {
      return dirs.map(name => {
        return {
          module: require(merge + '/' + name).default,
          filename: name,
        }
      })
    }).catch(e => {
      logger.error(`目录${url}不存在`);
      return [];
    })
  }

  private loadToContext(target: Array<FileModule>, app: Koa, property: string) {
    Object.defineProperty(app.context, property, {
      get(){
        if (!(<any>this)[HASLOADED]){
          (<any>this)[HASLOADED] = {};
        }
        const loaded = (<any>this)[HASLOADED];
        if (!loaded[property]){
          loaded[property] = {};
          target.forEach((item: FileModule) => {
            const { filename, module: _class } = item;
            const [name] = filename.split('.');
            if (_class){
              loaded[property][name] = new _class(this, app);
            }
          })
        }
        return loaded[property];
      }
    })
  }
  /**
   * 装载 src/extends/*
   */
  loadPlugin() {
    const pDir = this.appDir() + 'app/config/plugin.js';
    const pluginModule = require(pDir);
    Object.keys(pluginModule).forEach(key => {
      if (pluginModule[key].enable) {
        const plugin = require(path.join(this.appDir(), 'app/config', pluginModule[key].packagePath)).default;
        plugin(this.app);
      }
    })
  }
  /**
   * 装载 src/config/config.[default|dev|pro].js
   */
  loadConfig() {
    const configDef = this.appDir() + 'app/config/config.default.js';
    const configEnv = this.appDir() + (process.env.NODE_ENV === 'production' ? 'app/config/config.pro.js' : 'app/config/config.dev.js');
    const conf = require(configDef).default || require(configDef);
    const confDef = require(configEnv).default || require(configEnv);
    const merge = Object.assign({}, conf, confDef);
    Object.defineProperty(this.app, 'config', {
      get() {
        return merge;
      }
    })
  }
  /**
   * 装载 src/service/*
   * this.ctx.service.[文件名].[方法名] 对于每一个ctx也需要有唯一的service
   */
  async loadService() {
    const modules = await this.fileLoader('app/service');
    this.loadToContext(modules, this.app, 'service');
  }
  /**
   * 装载 src/controller/*
   */
  async loadController() {
    await this.fileLoader('app/controller');
  }

  /**
   * 装载 src/router.ts
   */
  loadRouter() {
    const r = bp.getRoute();
    Object.keys(r).forEach((url: string) => {
      r[url].forEach((object) => {
        (<any>this.router)[object.httpMethod](url, async (ctx: BaseContext) => {
          const instance = new object.constructor(ctx, this.app);
          await instance[object.handler]();
        })
      })
    })

    this.app.use(this.router.routes());
  }
  async load() {
    try {
      this.loadPlugin();
      this.loadConfig();
    } catch(e) {
      logger.error(e);
    }
    await this.loadController();
    await this.loadService();
    this.loadRouter(); // 依赖
  }
}

function removeString(source: string, str: string): SubString {
  const index = source.indexOf(str);
  if (index > 0) {
    return {
      isFound: true,
      source: source.substr(0, index)
    }
  }
  return {
    isFound: false,
    source
  }
}
