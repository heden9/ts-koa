import { Bengi } from './core';
import * as cluster from 'cluster';
import * as os from 'os';
import { EventEmitter } from 'events';
import logger from './logger';

interface IPCMessage {
  action: string;
  data: any;
  from: string;
}

class Message {
  master: BengiCluster;
  constructor(master: BengiCluster) {
    this.master = master;
  }
  sendToMaster(data: IPCMessage) {
    this.master.emit(data.action, data.data);
  }
  appSendToMaster(data: IPCMessage) {
    process.send && process.send(data);
  }
}

export default class BengiCluster extends EventEmitter {
  ip: string = '127.0.0.1';
  port: number = 3001;
  workersCount: number = 0;
  numCPUs: number = os.cpus().length;
  messager: Message = new Message(this);

  constructor() {
    super();
    this.onAppStart = this.onAppStart.bind(this);
    this.onAppExit = this.onAppExit.bind(this);
    this.forkWorkers = this.forkWorkers.bind(this);
    this.startCluster = this.startCluster.bind(this);
    this.on('app-worker-start', this.onAppStart);
  }
  onAppStart() {
    logger.green(`[master]#${process.pid} bengi app started ${this.ip}:${this.port}`);
  }
  onAppExit() {
    logger.green(`[master]#${process.pid} bengi app exit ${this.ip}:${this.port}`);
  }
  forkWorkers() {
    const { numCPUs } = this;
    if (cluster.isMaster) {
      for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
      }
      cluster.on('fork', (worker) => {
        worker.on('message', (msg: IPCMessage) => {
          if (msg.action === 'app-start') {
            this.workersCount ++;
          }
        })
      });
      cluster.on('exit', (worker, code, signal) => {
        logger.error(`worker ${+ worker.process.pid} died`);

        cluster.fork();
      });
      cluster.on('disconnect', (worker) => {
        logger.error(`worker ${+ worker.process.pid} disconnect`);
      });
      cluster.on('listening', (worker, address) => {
        logger.blue(`[worker]#${worker.process.pid} start listening ${address.address}:${address.port}`);
        if (this.workersCount === this.numCPUs) {
            this.messager.sendToMaster({ action: 'app-worker-start', data: '', from: worker.process.pid + '' })
        }
      });
    } else {
      const app = new Bengi;
      app.run(() => {}, this.port, this.ip);
      this.messager.appSendToMaster({
        action: 'app-start',
        data: { pid: process.pid },
        from: 'app'
      })
    }
  }
  startCluster() {
    this.forkWorkers();
  }
}
