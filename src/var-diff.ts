import { EventEmitter } from 'events';
import { StratumClient } from './stratum';

export class RingBuffer {
  data: number[] = [];
  cursor: number = 0;
  isFull: boolean = false;
  maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  append(x: number): void {
    if (this.isFull) {
      this.data[this.cursor] = x;
      this.cursor = (this.cursor + 1) % this.maxSize;
    } else {
      this.data.push(x);
      this.cursor++;
      if (this.data.length === this.maxSize) {
        this.cursor = 0;
        this.isFull = true;
      }
    }
  }

  avg(): number {
    const sum = this.data.reduce((a, b) => a + b);
    return sum / (this.isFull ? this.maxSize : this.cursor);
  }

  size(): number {
    return this.isFull ? this.maxSize : this.cursor;
  }

  clear(): void {
    this.data = [];
    this.cursor = 0;
    this.isFull = false;
  }
}

export function toFixed(num: number, len: number) {
  return parseFloat(num.toFixed(len));
}

export type VarDiffOptions = {
  targetTime: number;
  variancePercent: number;
  retargetTime: number;
  maxDiff: number;
  minDiff: number;
  x2mode?: boolean;
};

export class VarDiff extends EventEmitter {
  bufferSize: number;
  tMin: number;
  tMax: number;
  port: number | string;
  varDiffOptions: VarDiffOptions;

  constructor(port: number | string, varDiffOptions: VarDiffOptions) {
    super();

    let variance =
      varDiffOptions.targetTime * (varDiffOptions.variancePercent / 100);
    this.bufferSize =
      (varDiffOptions.retargetTime / varDiffOptions.targetTime) * 4;
    this.tMin = varDiffOptions.targetTime - variance;
    this.tMax = varDiffOptions.targetTime + variance;
    this.port = port;
    this.varDiffOptions = varDiffOptions;
  }

  manageClient(client: StratumClient): void {
    let stratumPort = client.socket.localPort;
    if (stratumPort !== this.port) {
      console.error('Handling a client which is not of this vardiff?');
    }

    let _this = this;
    let lastTimeStamp: number;
    let lastRtc: number;
    let timeBuffer: RingBuffer;
    client.on('submit', () => {
      let ts = (Date.now() / 1000) | 0;
      if (!lastRtc) {
        lastRtc = ts - _this.varDiffOptions.retargetTime / 2;
        lastTimeStamp = ts;
        timeBuffer = new RingBuffer(_this.bufferSize);
        return;
      }
      let sinceLast = ts - lastTimeStamp;
      timeBuffer.append(sinceLast);
      lastTimeStamp = ts;
      if (
        ts - lastRtc < _this.varDiffOptions.retargetTime &&
        timeBuffer.size() > 0
      )
        return;
      lastRtc = ts;
      let avg = timeBuffer.avg();
      let ddiff = _this.varDiffOptions.targetTime / avg;
      if (
        avg > _this.tMax &&
        client.difficulty > _this.varDiffOptions.minDiff
      ) {
        if (_this.varDiffOptions.x2mode) {
          ddiff = 0.5;
        }
        if (ddiff * client.difficulty < _this.varDiffOptions.minDiff) {
          ddiff = _this.varDiffOptions.minDiff / client.difficulty;
        }
      } else if (avg < _this.tMin) {
        if (_this.varDiffOptions.x2mode) {
          ddiff = 2;
        }
        let diffMax = _this.varDiffOptions.maxDiff;
        if (ddiff * client.difficulty > diffMax) {
          ddiff = diffMax / client.difficulty;
        }
      } else {
        return;
      }
      let newDiff = toFixed(client.difficulty * ddiff, 8);
      timeBuffer.clear();
      // TODO: test 'this' change to 'client'
      client.emit('newDifficulty', client, newDiff);
    });
  }
}
