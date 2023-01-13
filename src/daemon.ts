import { EventEmitter } from 'events';
import http from 'http';
import { CmdReturnObj, Daemon as DaemonCommon } from './types/daemon';
import { StratumError } from './types/error';

type Daemon = DaemonCommon & {
  index?: number;
};

export class DaemonInterface extends EventEmitter {
  private _daemons: Daemon[];
  private _logger: any;

  constructor(daemons: Daemon[], logger: any) {
    super();

    for (let i = 0; i < daemons.length; i++) {
      daemons[i]['index'] = i;
    }

    this._daemons = daemons;
    this._logger = logger;
  }

  init() {
    this.isOnline((online: boolean) => {
      if (online) {
        this.emit('online');
      }
    });
  }

  isOnline(callback: (online: boolean) => void) {
    this.cmd('getinfo', [], (results: any) => {
      const allOnline = results.every(() => !results.error);
      callback(allOnline);
      if (!allOnline) {
        this.emit('connectionFailed', results);
      }
    });
  }

  performHttpRequest(instance: Daemon, jsonData: string, callback: any) {
    let options = {
      hostname:
        typeof instance.host === 'undefined' ? '127.0.0.1' : instance.host,
      port: instance.port,
      method: 'POST',
      auth: instance.user + ':' + instance.password,
      headers: {
        'Content-Length': jsonData.length,
      },
    };

    const parseJson = (res: http.IncomingMessage, data: string | any) => {
      let dataJson;
      if (res.statusCode === 401) {
        this.logger(
          'error',
          'Unauthorized RPC access - invalid RPC username or password'
        );
        return;
      }

      try {
        dataJson = JSON.parse(data);
      } catch (e) {
        if (data.indexOf(':-nan') !== -1) {
          data = data.replace(/:-nan,/g, ':0');
          parseJson(res, data);
          return;
        }
        this.logger(
          'error',
          'Could not parse rpc data from daemon instance  ' +
            instance.index +
            '\nRequest Data: ' +
            jsonData.substr(0, 200) +
            '\nResponse Data: ' +
            data.substr(0, 200)
        );
      }
      if (dataJson && callback) {
        callback(dataJson.error, dataJson, data);
      }
    };

    const req = http.request(options, res => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', function(chunk) {
        data += chunk;
      });
      res.on('end', function() {
        parseJson(res, data);
      });
    });

    req.on('error', function(e: StratumError) {
      if (e.code === 'ECONNREFUSED') {
        callback({ type: 'offline', message: e.message }, null);
      } else {
        callback({ type: 'request error', message: e.message }, null);
      }
    });

    req.end(jsonData);
  }

  batchCmd(cmdArray: any[], callback: any) {
    var requestJson = [];
    for (var i = 0; i < cmdArray.length; i++) {
      requestJson.push({
        method: cmdArray[i][0],
        params: cmdArray[i][1],
        id: Date.now() + Math.floor(Math.random() * 10) + i,
      });
    }
    var serializedRequest = JSON.stringify(requestJson);
    this.performHttpRequest(
      this._daemons[0],
      serializedRequest,
      (error: string, result: any) => callback(error, result)
    );
  }

  cmd(
    method: string,
    params: any[],
    callback: any,
    streamResults?: any,
    returnRawData?: any
  ) {
    const results: any[] = [];
    this._daemons.forEach(async daemon => {
      let itemFinished = function(error: any, result: any, data: any) {
        const returnObj: CmdReturnObj = {
          error: error,
          response: (result || {}).result,
          instance: daemon,
        };
        if (returnRawData) {
          returnObj.data = data;
        }
        if (streamResults) {
          callback(returnObj);
        } else {
          results.push(returnObj);
          callback(results);
        }
        itemFinished = () => {};
      };
      var requestJson = JSON.stringify({
        jsonrpc: '1.0',
        method: method,
        params: params,
        id: Date.now() + Math.floor(Math.random() * 10),
      });
      this.performHttpRequest(
        daemon,
        requestJson,
        (error: any, result: any, data: any) => {
          itemFinished(error, result, data);
        }
      );
    });
  }

  logger(severity: string, message: string) {
    if (this._logger) {
      return this._logger(severity, message);
    }
    console.log(severity + ': ' + message);
  }
}
