import { Service } from "./base";

export default class Check extends Service{
  async index(){
    return 2 + 3;
  }
}
