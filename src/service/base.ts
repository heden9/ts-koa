import * as Koa from "koa";
import { BaseContext } from "koa";

export class Service {
  ctx: BaseContext;
  app: Koa;
  constructor(ctx: BaseContext, app: Koa){
    this.ctx = ctx;
    this.app = app;
  }
}
