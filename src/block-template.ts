import BigNumber from 'bignumber.js';
import { SHA3 } from 'sha3';
import { diff1 } from './algo-properties';
import { getRoot } from './merkle-tree';
import { createGeneration, getFees } from './transactions';
import { RpcData } from './types/common';
import { JobParams } from './types/stratum';
import { packUInt32BE, reverseBuffer, sha256d, varIntBuffer } from './utils';

const EPOCH_LENGTH = 7500;

export class BlockTemplate {
  curTime: number = (Date.now() / 1000) | 0;
  difficulty: number;
  genTx?: string;
  genTxHash?: string;
  jobId: string;
  merkleRoot?: string;
  merkleRootReversed?: string;
  nTime: string;
  prevHashReversed: string;
  rewardFees: number;
  rpcData: RpcData;
  submits: string[] = [];
  target_hex: string;
  target: BigNumber;
  txCount: number;

  // Job Params
  jobParams?: JobParams;
  localTarget: string;
  seedhash: string;
  epoch_number: number;
  header_hash: string;

  constructor(
    jobId: string,
    rpcData: RpcData,
    // @ts-ignore
    reward: string,
    recipients: any[],
    poolAddress: string
  ) {
    this.jobId = jobId;
    this.rpcData = rpcData;
    this.target = new BigNumber(this.rpcData.target, 16);
    this.target_hex = this.rpcData.target;
    this.difficulty = parseFloat((diff1 / this.target.toNumber()).toFixed(9));

    this.nTime = packUInt32BE(this.rpcData.curtime).toString('hex');

    const blockReward = this.rpcData.coinbasevalue;
    const fees: number[] = [];

    this.rpcData.transactions.forEach((value: any) => {
      fees.push(value);
    });

    this.rewardFees = getFees(fees);

    this.rpcData.rewardFees = this.rewardFees;

    if (typeof this.genTx === 'undefined') {
      const createTx = createGeneration(
        this.rpcData,
        blockReward,
        this.rewardFees,
        recipients,
        poolAddress
      );
      this.genTx = createTx.txHex;
      this.genTxHash = createTx.txHash;
    }

    this.prevHashReversed = reverseBuffer(
      new Buffer(this.rpcData.previousblockhash, 'hex')
    ).toString('hex');
    this.getRoot();
    this.txCount = this.rpcData.transactions.length + 1; // add total txs and new coinbase

    const powLimit = algos.kawpow.diff;
    const adjPow = powLimit / this.difficulty;

    let zeroPad = '';
    if (64 - adjPow.toString(16).length !== 0) {
      zeroPad = '0';
      zeroPad = zeroPad.repeat(64 - adjPow.toString(16).length);
    }

    this.localTarget = (zeroPad + adjPow.toString(16)).substr(0, 64);
    let d = new SHA3.SHA3Hash(256);
    let seedhash_buf = new Buffer(32);
    this.seedhash = seedhash_buf.toString('hex');

    this.epoch_number = Math.floor(this.rpcData.height / EPOCH_LENGTH);

    for (let i = 0; i < this.epoch_number; i++) {
      d = new SHA3.SHA3Hash(256);
      d.update(seedhash_buf);
      seedhash_buf = d.digest();
      this.seedhash = d.digest('hex');
    }

    const header_hash = this.serializeHeader();
    this.header_hash = reverseBuffer(sha256d(header_hash)).toString('hex');

    let override_target = 0;
    if (override_target !== 0 && adjPow > override_target) {
      zeroPad = '0';
      zeroPad = zeroPad.repeat(64 - override_target.toString(16).length);
      this.localTarget = (zeroPad + override_target.toString(16)).substr(0, 64);
    }
  }

  async init() {
    await this.getRoot();
  }

  async getRoot() {
    this.merkleRoot = await getRoot(this.rpcData, this.genTxHash!);
    this.merkleRootReversed = reverseBuffer(
      new Buffer(this.merkleRoot, 'hex')
    ).toString('hex');
  }

  serializeHeader(): Buffer {
    let header = new Buffer(80);
    let position = 0;
    header.write(
      packUInt32BE(this.rpcData.height).toString('hex'),
      position,
      4,
      'hex'
    );
    header.write(this.rpcData.bits, (position += 4), 4, 'hex');
    header.write(this.nTime, (position += 4), 4, 'hex');
    header.write(this.merkleRoot!, (position += 4), 32, 'hex');
    header.write(this.rpcData.previousblockhash, (position += 32), 32, 'hex');
    // @ts-ignore TODO: Identify which offset is intended
    header.writeUInt32BE(this.rpcData.version, position + 32, 4);
    header = reverseBuffer(header);
    return header;
  }

  serializeBlock(
    // @ts-ignore
    header_hash: Buffer,
    nonce: Buffer,
    mixhash: Buffer
  ): Buffer {
    let header = this.serializeHeader();
    let foo = new Buffer(40);
    foo.write(reverseBuffer(nonce).toString('hex'), 0, 8, 'hex');
    foo.write(reverseBuffer(mixhash).toString('hex'), 8, 32, 'hex');
    let buf = Buffer.concat([
      header,
      foo,
      varIntBuffer(this.rpcData.transactions.length + 1),
      new Buffer(this.genTx!, 'hex'),
    ]);
    if (this.rpcData.transactions.length > 0) {
      this.rpcData.transactions.forEach((value: any) => {
        const tmpBuf = Buffer.concat([buf, new Buffer(value.data, 'hex')]);
        buf = tmpBuf;
      });
    }
    return buf;
  }

  registerSubmit(header: string, nonce: string): boolean {
    var submission = header + nonce;
    if (this.submits.indexOf(submission) === -1) {
      this.submits.push(submission);
      return true;
    }
    return false;
  }

  getJobParams(): JobParams {
    if (!this.jobParams) {
      this.jobParams = [
        this.jobId,
        this.header_hash,
        this.seedhash,
        this.localTarget,
        true,
        this.rpcData.height,
        this.rpcData.bits,
      ];
    }
    return this.jobParams;
  }
}
