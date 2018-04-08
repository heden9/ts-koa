import { Controller }  from '../../src/base/controller';
import { bp } from '../../src/blueprint';
import * as cluster from 'cluster';
export default class User extends Controller {
  @bp.get('/user')
  async index(){
    const who = cluster.isMaster ? 'master' : 'worker';
    this.ctx.body = 'hello world ' + who + ':' + process.pid;
  }
}
