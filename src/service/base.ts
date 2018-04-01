import { BaseContext } from "koa";

export class Service {
  ctx: BaseContext;
  constructor(ctx: BaseContext){
    this.ctx = ctx;
  }
}
