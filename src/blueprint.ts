import logger from './logger';

interface Bp {
  httpMethod: string,
  constructor: any,
  handler: string
}

interface Bps {
  [key: string]: Array<Bp>
}
interface Decorator {
  (target: any, propertyKey: string): void
}
const methods = ['get', 'post', 'patch', 'del', 'options', 'put'];

export interface blueprint extends Blueprint {
  /**
   * @instance.[httpMethods]('/')
   * @param url
   */
  get(url: string): Decorator
  post(url: string): Decorator
  patch(url: string): Decorator
  del(url: string): Decorator
  options(url: string): Decorator
  put(url: string): Decorator
}
export class Blueprint {
  router: Bps = {}
  setRouter(url: string, blueprint: Bp) {
    const _bp = this.router[url];
    if (_bp) {
      const isExist = _bp.some(it1 => it1.httpMethod === blueprint.httpMethod);
      isExist ?
        logger.error(`路由地址 ${blueprint.httpMethod} ${url} 已经存在`) :
        this.router[url].push(blueprint);
    } else {
      this.router[url] = [blueprint];
    }
  }



  /**
   * use('get /') | use('get', '/');
   * @param method string
   * @param url string
   */
  use(method: string, url?: string) {
    if (url == undefined){
      [method, url] = method.split(' ');
    }
    return (target: any, propertyKey: string) => {
      (<any>this).setRouter(url, {
        httpMethod: method,
        constructor: target.constructor,
        handler: propertyKey
      })
    }
  }
  /**
   * 返回路由
   */
  getRoute() {
    return this.router;
  }
}

methods.forEach(httpMethods => {
  Object.defineProperty(Blueprint.prototype, httpMethods, {
    get() {
      return (url: string) => {
        return (target: any, propertyKey: string) => {
          (<any>this).setRouter(url, {
            httpMethod: httpMethods,
            constructor: target.constructor,
            handler: propertyKey
          })
        }
      }
    }
  })
})
export const bp: blueprint = <any>new Blueprint;
