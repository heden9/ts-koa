import * as Koa from 'Koa';
import { Loader } from './loader';
import { Controller } from './base/controller';
import { Service } from './base/service';
import { blueprint, bp } from './blueprint';

const noop = () => {};
interface RunCallback {
  (port : number, ip : string) : void
}
export class Bengi extends Koa {
  private loader: Loader;
  private port: number = 3000;
  private ip: string = '127.0.0.1';
  static Controller: typeof Controller = Controller
  static Service: typeof Service = Service;
  static Blueprint: blueprint = bp;
  config: any = {};
  constructor() {
    super();
    this.loader = new Loader(this);
  }
  error() {
    this.use(async(ctx, next) => {
      try {
        await next();
        if (ctx.status === 404) {
          ctx.body = `<h1>404 not found</h1>`;
          ctx.set('Content-Type', 'text/html');
        }
      } catch (e) {
        let status = e.status || 500;
        let message = e.message || '服务器错误';

        var err = `
            <h3>${status}</h3>
            <h3>${message}</h3>
            `
        e.stack.split('\n').forEach((stk: string, index: number) => {
            if (index !== 0)
              err = err + `<p>${stk}</p>`;
            }
          )

        ctx.body = err;
        ctx.set('Content-Type', 'text/html');
      }
    })
  }
  runInDev(handler: Function) {
    if (process.env.NODE_ENV !== 'production') {
      handler.call(this);
    }
  }
  async run(fn : RunCallback = noop, port?: number, ip?: string) {
    this.runInDev(this.error);
    await this.loader.load();
    return this.listen(port || this.port, ip || this.ip, () => {
      fn(port || this.port, ip || this.ip);
    });
  }
}
