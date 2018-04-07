interface Bp {
  httpMethod: string,
  constructor: any,
  handler: string
}

interface Bps {
  [key: string]: Array<Bp>
}


export class Blueprint {
  router: Bps = {}
  setRouter(url: string, blueprint: Bp) {
    const _bp = this.router[url];
    if (_bp) {
      for (const index in _bp){
        const object = _bp[index];
        if (object.httpMethod === blueprint.httpMethod) {
          console.log(`路由地址 ${object.httpMethod} ${url} 已经存在`);
          return;
        }

        this.router[url].push(blueprint);
      }
    } else {
      this.router[url] = [];
      this.router[url].push(blueprint);
    }
  }

  /**
   * @instance.get('/')
   * @param url
   */
  get(url: string) {
    return (target: any, propertyKey: string) => {
      (<any>this).setRouter(url, {
        httpMethod: 'get',
        constructor: target.constructor,
        handler: propertyKey
      })
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

export const bp = new Blueprint;
