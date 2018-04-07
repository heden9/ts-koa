import { Controller } from "./base";
import { bp } from "../blueprint";
export default class User extends Controller{
  @bp.get('/')
  async user(){
    const num = await this.ctx.service.check.index();
    this.ctx.body = 'hello user ' + num;
  }
  @bp.get('/userInfo')
  async userInfo(){
    this.ctx.body = 'hello userInfo';
  }
}
