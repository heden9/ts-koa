import { Controller } from "./base";

export default class User extends Controller{
  async user(){
    const num = await this.ctx.service.check.index();
    this.ctx.body = 'hello user ' + num;
  }
  async userInfo(){
    this.ctx.body = 'hello userInfo';
  }
}
