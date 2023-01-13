import async from 'async';
import BigNumber from 'bignumber.js';
import { EventEmitter } from 'events';
import http from 'http';
import { algos, diff1 } from './algo-properties';
import { BlockTemplate } from './block-template';
import { DaemonInterface } from './daemon';
import { ExtraNonceCounter } from './nonce';
import { JobCounter } from './job-counter';
import { Kawpowhash } from './types/daemon';
import { PoolOptions } from './types/pool';
import { RpcData } from './types/common';
import { reverseBuffer, sha256d } from './utils';

export class JobManager extends EventEmitter {
  private _options: PoolOptions;
  currentJob?: BlockTemplate;
  daemon?: DaemonInterface;
  extraNonceCounter: ExtraNonceCounter = new ExtraNonceCounter();
  hashDigest: string;
  jobCounter: JobCounter = new JobCounter();
  shareMultiplier: number;
  validJobs: Record<string, BlockTemplate> = {};

  constructor(options: PoolOptions) {
    super();

    this._options = options;
    this.shareMultiplier = algos[options.coin.algorithm].multiplier;
    this.hashDigest = algos[options.coin.algorithm].hash(options.coin);

    this.setupJobDaemonInterface(() => {});
  }

  emitLog(text: string) {
    this.emit('log', 'debug', text);
  }

  emitWarningLog(text: string) {
    this.emit('log', 'warning', text);
  }

  emitErrorLog(text: string) {
    this.emit('log', 'error', text);
  }

  emitSpecialLog(text: string) {
    this.emit('log', 'special', text);
  }

  setupJobDaemonInterface(finishedCallback: any) {
    if (
      !Array.isArray(this._options.daemons) ||
      this._options.daemons.length < 1
    ) {
      this.emitErrorLog('No daemons have been configured - pool cannot start');
      return;
    }

    this.daemon = new DaemonInterface(
      this._options.daemons,
      (severity: string, message: string) => {
        this.emit('log', severity, message);
      }
    );

    this.daemon
      .once('online', () => {
        finishedCallback();
      })
      .on('connectionFailed', error => {
        this.emitErrorLog(
          'Failed to connect daemon(s): ' + JSON.stringify(error)
        );
      })
      .on('error', message => {
        this.emitErrorLog(message);
      });

    this.daemon.init();
  }

  isHexString(s: string): boolean {
    const check = String(s).toLowerCase();
    if (check.length % 2) {
      return false;
    }
    for (let i = 0; i < check.length; i = i + 2) {
      const c = check[i] + check[i + 1];
      if (!this.isHex(c)) return false;
    }
    return true;
  }

  isHex(c: string): boolean {
    const a = parseInt(c, 16);
    let b = a.toString(16).toLowerCase();
    if (b.length % 2) {
      b = '0' + b;
    }
    if (b !== c) {
      return false;
    }
    return true;
  }

  updateCurrentJob(rpcData: RpcData): void {
    const tmpBlockTemplate = new BlockTemplate(
      this.jobCounter.next(),
      rpcData,
      this._options.coin.reward,
      this._options.recipients,
      this._options.address
    );

    this.currentJob = tmpBlockTemplate;
    this.emit('updatedBlock', tmpBlockTemplate, true);
    this.validJobs[tmpBlockTemplate.jobId] = tmpBlockTemplate;
  }

  processTemplate(rpcData: RpcData): boolean {
    let isNewBlock = typeof this.currentJob === 'undefined';

    if (
      !isNewBlock &&
      this.currentJob!.rpcData.previousblockhash !== rpcData.previousblockhash
    ) {
      isNewBlock = true;
      if (rpcData.height < this.currentJob!.rpcData.height) {
        return false;
      }
    }

    if (!isNewBlock) {
      return false;
    }

    const tmpBlockTemplate = new BlockTemplate(
      this.jobCounter.next(),
      rpcData,
      this._options.coin.reward,
      this._options.recipients,
      this._options.address
    );

    this.currentJob = tmpBlockTemplate;
    this.validJobs = {};
    this.emit('newBlock', tmpBlockTemplate);
    this.validJobs[tmpBlockTemplate.jobId] = tmpBlockTemplate;
    return true;
  }

  processShare(
    miner_given_jobId: string,
    // @ts-ignore
    previousDifficulty: number,
    difficulty: number,
    miner_given_nonce: string,
    ipAddress: string,
    port: number,
    workerName: string,
    miner_given_header: string,
    miner_given_mixhash: string,
    extraNonce1: string,
    callback_parent: any
  ) {
    const submitTime = (Date.now() / 1000) | 0;

    const shareError = (error: any) => {
      this.emit('share', {
        job: miner_given_jobId,
        ip: ipAddress,
        worker: workerName,
        difficulty: difficulty,
        error: error[1],
      });
      callback_parent({ error: error, result: null });
      return;
    };

    const job = this.validJobs[miner_given_jobId];
    if (typeof job === 'undefined' || job.jobId !== miner_given_jobId) {
      return shareError([20, 'job not found']);
    }

    const headerBuffer = job.serializeHeader();
    const header_hash = reverseBuffer(sha256d(headerBuffer)).toString('hex');

    if (job.curTime < submitTime - 600) {
      return shareError([20, 'job is too old']);
    }

    if (!this.isHexString(miner_given_header)) {
      return shareError([20, 'invalid header hash, must be hex']);
    }

    if (header_hash !== miner_given_header) {
      return shareError([20, 'invalid header hash']);
    }

    if (!this.isHexString(miner_given_nonce)) {
      return shareError([20, 'invalid nonce, must be hex']);
    }

    if (!this.isHexString(miner_given_mixhash)) {
      return shareError([20, 'invalid mixhash, must be hex']);
    }

    if (miner_given_nonce.length !== 16) {
      return shareError([20, 'incorrect size of nonce, must be 8 bytes']);
    }

    if (miner_given_mixhash.length !== 64) {
      return shareError([20, 'incorrect size of mixhash, must be 32 bytes']);
    }

    if (miner_given_nonce.indexOf(extraNonce1.substring(0, 4)) !== 0) {
      return shareError([24, 'nonce out of worker range']);
    }

    if (
      !job.registerSubmit(
        header_hash.toLowerCase(),
        miner_given_nonce.toLowerCase()
      )
    ) {
      return shareError([22, 'duplicate share']);
    }

    let powLimit = algos.kawpow.diff;
    let adjPow = powLimit / difficulty;
    let zeroPad = '';
    if (64 - adjPow.toString(16).length !== 0) {
      zeroPad = '0';
      zeroPad = zeroPad.repeat(64 - adjPow.toString(16).length);
    }

    let target_share_hex = (zeroPad + adjPow.toString(16)).substr(0, 64);
    let blockHashInvalid: boolean;
    let blockHash: Buffer;
    let blockHex: string;

    if (this._options.kawpow_validator === 'kawpowd') {
      async.series(
        [
          (callback: any) => {
            const kawpowd_url =
              'http://' +
              this._options.kawpow_wrapper_host +
              ':' +
              this._options.kawpow_wrapper_port +
              '/' +
              '?header_hash=' +
              header_hash +
              '&mix_hash=' +
              miner_given_mixhash +
              '&nonce=' +
              miner_given_nonce +
              '&height=' +
              job.rpcData.height +
              '&share_boundary=' +
              target_share_hex +
              '&block_boundary=' +
              job.target_hex;
            http.get(kawpowd_url, res => {
              res.setEncoding('utf8');
              let body: any = '';

              res.on('data', data => {
                body += data;
              });

              res.on('end', () => {
                body = JSON.parse(body);
                console.log(
                  '********** INCOMING SHARE FROM WORKER ************'
                );
                console.log('header_hash            = ' + header_hash);
                console.log('miner_sent_header_hash = ' + miner_given_header);
                console.log('miner_sent_mixhash     = ' + miner_given_mixhash);
                console.log('miner_sent_nonce       = ' + miner_given_nonce);
                console.log('height                 = ' + job.rpcData.height);
                console.log('job.difficulty         = ' + job.difficulty);
                console.log('BLOCK.target           = ' + job.target_hex);
                console.log('SHARE.target           = ' + target_share_hex);
                console.log('digest                 = ' + body.digest);
                console.log('miner_sent_jobid       = ' + miner_given_jobId);
                console.log('job                    = ' + miner_given_jobId);
                console.log('worker                 = ' + workerName);
                console.log('height                 = ' + job.rpcData.height);
                console.log('difficulty             = ' + difficulty);
                console.log('kawpowd_url            = ' + kawpowd_url);
                console.log(
                  '********** END INCOMING SHARE FROM WORKER ************'
                );
                if (body.share === false) {
                  if (body.block === false) {
                    callback(
                      "kawpow share didn't meet job or block difficulty level",
                      false
                    );
                    return shareError([20, 'kawpow validation failed']);
                  }
                }
                if (body.block === true) {
                  blockHex = job
                    .serializeBlock(
                      new Buffer(header_hash, 'hex'),
                      new Buffer(miner_given_nonce, 'hex'),
                      new Buffer(miner_given_mixhash, 'hex')
                    )
                    .toString('hex');
                  blockHash = body.digest;
                }
                callback(null, true);
                return;
              });
            });
          },
          callback => {
            const blockDiffAdjusted = job.difficulty * this.shareMultiplier;
            let shareDiffFixed = undefined;
            if (blockHash !== undefined) {
              const headerBigNum = blockHash.readInt32LE(0);
              const shareDiff = (diff1 / headerBigNum) * this.shareMultiplier;
              shareDiffFixed = shareDiff.toFixed(8);
            }
            this.emit(
              'share',
              {
                job: miner_given_jobId,
                ip: ipAddress,
                port: port,
                worker: workerName,
                height: job.rpcData.height,
                blockReward: job.rpcData.reward,
                minerReward: job.rpcData.coinbasevalue,
                difficulty: difficulty,
                shareDiff: shareDiffFixed,
                blockDiff: blockDiffAdjusted,
                blockDiffActual: job.difficulty,
                blockHash: blockHash,
                blockHashInvalid: blockHashInvalid,
              },
              blockHex
            );
            callback_parent({
              result: true,
              error: null,
              blockHash: blockHash,
            });
            callback(null, true);
            return;
          },
        ],
        // @ts-ignore
        (err, results) => {
          if (err !== null) {
            this.emitErrorLog('kawpow verify failed, ERRORS: ' + err);
            return;
          }
        }
      );
    } else {
      this.daemon!.cmd(
        'getkawpowhash',
        [
          header_hash,
          miner_given_mixhash,
          miner_given_nonce,
          job.rpcData.height,
          job.target_hex,
        ],
        (results: Kawpowhash[]) => {
          let digest = results[0].response.digest;
          let result = results[0].response.result;
          let mix_hash = results[0].response.mix_hash;
          // let meets_target = results[0].response.meets_target;
          let blockHex: string;
          let blockHash: string;

          if (result === 'true') {
            const headerBigNum = new BigNumber(digest, 16);
            let blockDiffAdjusted = job.difficulty * this.shareMultiplier;
            const shareDiff = new BigNumber(diff1)
              .div(headerBigNum)
              .multipliedBy(this.shareMultiplier);
            const shareDiffFixed = shareDiff.toFixed(8);

            if (job.target.isGreaterThan(headerBigNum)) {
              blockHex = job
                .serializeBlock(
                  new Buffer(header_hash, 'hex'),
                  new Buffer(miner_given_nonce, 'hex'),
                  new Buffer(mix_hash, 'hex')
                )
                .toString('hex');
              blockHash = digest;
            }

            blockDiffAdjusted = job.difficulty * this.shareMultiplier;
            this.emit(
              'share',
              {
                job: miner_given_jobId,
                ip: ipAddress,
                port: port,
                worker: workerName,
                height: job.rpcData.height,
                blockReward: job.rpcData.coinbasevalue,
                minerReward: job.rpcData.rewardToPool,
                difficulty: difficulty,
                shareDiff: shareDiffFixed,
                blockDiff: blockDiffAdjusted,
                blockDiffActual: job.difficulty,
                blockHash: blockHash!,
                blockHashInvalid: blockHashInvalid,
              },
              blockHex!
            );
            callback_parent({
              result: true,
              error: null,
              blockHash: blockHash!,
            });
          } else {
            return shareError([20, 'bad share: invalid hash']);
          }
        }
      );
    }
  }
}
