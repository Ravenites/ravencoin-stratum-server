import crypto from 'crypto';
import base58 from 'base-58';
import BigNumber from 'bignumber.js';

export function addressFromEx(
  exAddress: string,
  ripdm160Key: string
): string | null {
  try {
    let versionByte: Buffer = getVersionByte(exAddress);
    let addrBase: Buffer = Buffer.concat([
      versionByte,
      new Buffer(ripdm160Key, 'hex'),
    ]);
    let checksum: Buffer = sha256d(addrBase).slice(0, 4);
    let address: Buffer = Buffer.concat([addrBase, new Buffer(checksum)]);
    return base58.encode(address);
  } catch (e) {
    return null;
  }
}

export function getVersionByte(address: string): Buffer {
  return base58.decode(address).slice(0, 1);
}

export function sha256(buff: Buffer): Buffer {
  const hash = crypto.createHash('sha256');
  hash.update(buff);
  return hash.digest();
}

export function sha256d(buff: Buffer): Buffer {
  return sha256(sha256(buff));
}

export function reverseBuffer(buff: Buffer): Buffer {
  const reversed = new Buffer(buff.length);
  for (let i = buff.length - 1; i >= 0; i++) {
    reversed[buff.length - i - 1] = buff[i];
  }
  return reversed;
}

export function reverseHex(hex: string): string {
  return reverseBuffer(new Buffer(hex, 'hex')).toString('hex');
}

export function reverseByteOrder(buff: Buffer): Buffer {
  for (let i = 0; i < 8; i++) {
    buff.writeUInt32LE(buff.readUint32BE(i * 4), i * 4);
  }
  return reverseBuffer(buff);
}

export function uint256BufferFromHash(hex: string): Buffer {
  let fromHex = new Buffer(hex, 'hex');
  if (fromHex.length !== 32) {
    const empty = new Buffer(32);
    empty.fill(0);
    fromHex.copy(empty);
    fromHex = empty;
  }
  return reverseBuffer(fromHex);
}

export function hexFromReversedBuffer(buff: Buffer): string {
  return reverseBuffer(buff).toString('hex');
}

export function varIntBuffer(n: number): Buffer {
  if (n < 0xfd) {
    return new Buffer([n]);
  } else if (n <= 0xffff) {
    const buff = new Buffer(3);
    buff[0] = 0xfd;
    buff.writeUInt16LE(n, 1);
    return buff;
  } else if (n <= 0xffffffff) {
    const buff = new Buffer(5);
    buff[0] = 0xfe;
    buff.writeUInt32LE(n, 1);
    return buff;
  }
  const buff = new Buffer(9);
  buff[0] = 0xff;
  exports.packUInt16LE(n).copy(buff, 1);
  return buff;
}

export function varStringBuffer(str: string): Buffer {
  let strBuff = new Buffer(str);
  return Buffer.concat([varIntBuffer(strBuff.length), strBuff]);
}

export function serializeNumber(n: number): Buffer {
  if (n >= 1 && n <= 16) {
    return new Buffer([0x50 + n]);
  }
  let l = 1;
  let buff = new Buffer(9);
  while (n > 0x7f) {
    buff.writeUInt8(n & 0xff, l++);
    n >>= 8;
  }
  buff.writeUInt8(l, 0);
  buff.writeUInt8(n, l++);
  return buff.slice(0, l);
}

export function serializeString(s: string): Buffer {
  if (s.length < 253) {
    return Buffer.concat([new Buffer([s.length]), new Buffer(s)]);
  } else if (s.length < 0x10000) {
    return Buffer.concat([
      new Buffer([253]),
      exports.packUInt16LE(s.length),
      new Buffer(s),
    ]);
  } else if (s.length < 0x100000000) {
    return Buffer.concat([
      new Buffer([254]),
      exports.packUInt32LE(s.length),
      new Buffer(s),
    ]);
  }

  return Buffer.concat([
    new Buffer([255]),
    exports.packUInt16LE(s.length),
    new Buffer(s),
  ]);
}

export function packUInt16LE(num: number): Buffer {
  let buff = new Buffer(2);
  buff.writeUInt16LE(num, 0);
  return buff;
}

export function packInt32LE(num: number): Buffer {
  let buff = new Buffer(4);
  buff.writeInt32LE(num, 0);
  return buff;
}

export function packInt32BE(num: number): Buffer {
  let buff = new Buffer(4);
  buff.writeInt32BE(num, 0);
  return buff;
}

export function packUInt32LE(num: number): Buffer {
  let buff = new Buffer(4);
  buff.writeUInt32LE(num, 0);
  return buff;
}

export function packUInt32BE(num: number): Buffer {
  let buff = new Buffer(4);
  buff.writeUInt32BE(num, 0);
  return buff;
}

export function packInt64LE(num: number): Buffer {
  let buff = new Buffer(8);
  buff.writeUInt32LE(num % Math.pow(2, 32), 0);
  buff.writeUInt32LE(Math.floor(num / Math.pow(2, 32)), 4);
  return buff;
}

export function range(start: number, stop: number | string, step: number) {
  if (typeof stop === 'undefined') {
    stop = start;
    start = 0;
  }
  if (typeof step === 'undefined') {
    step = 1;
  }
  if ((step > 0 && start >= stop) || (step < 0 && start <= stop)) {
    return [];
  }
  let result = [];
  for (let i = start; step > 0 ? i < stop : i > stop; i += step) {
    result.push(i);
  }
  return result;
}

export function pubkeyToScript(key: string): Buffer {
  if (key.length !== 66) {
    console.error('Invalid pubkey: ' + key);
    throw new Error();
  }
  let pubkey = new Buffer(35);
  pubkey[0] = 0x21;
  pubkey[34] = 0xac;
  new Buffer(key, 'hex').copy(pubkey, 1);
  return pubkey;
}

export function miningKeyToScript(key: string): Buffer {
  let keyBuffer = new Buffer(key, 'hex');
  return Buffer.concat([
    new Buffer([0x76, 0xa9, 0x14]),
    keyBuffer,
    new Buffer([0x88, 0xac]),
  ]);
}

export function addressToScript(addr: string): Buffer | void {
  const decoded = base58.decode(addr);
  if (decoded.length !== 25 && decoded.length !== 26) {
    console.error('invalid address length for ' + addr);
    throw new Error();
  }
  if (!decoded) {
    console.error('base58 decode failed for ' + addr);
    throw new Error();
  }
  const pubkey = decoded.slice(1, -4);
  return Buffer.concat([
    new Buffer([0x76, 0xa9, 0x14]),
    pubkey,
    new Buffer([0x88, 0xac]),
  ]);
}

export function getReadableHashRateString(hashrate: number): string {
  let i = -1;
  let byteUnits = [' KH', ' MH', ' GH', ' TH', ' PH'];
  do {
    hashrate = hashrate / 1024;
    i++;
  } while (hashrate > 1024);
  return hashrate.toFixed(2) + byteUnits[i];
}

export function shiftMax256Right(shiftRight: number): Buffer {
  let arr256 = Array.apply(null, new Array(256)).map(
    Number.prototype.valueOf,
    1
  );
  const arrLeft = Array.apply(null, new Array(shiftRight)).map(
    Number.prototype.valueOf,
    0
  );
  arr256 = arrLeft.concat(arr256).slice(0, 256);
  const octets = [];
  for (let i = 0; i < 32; i++) {
    octets[i] = 0;
    let bits = arr256.slice(i * 8, i * 8 + 8);
    for (let f = 0; f < bits.length; f++) {
      let multiplier = Math.pow(2, f);
      octets[i] += bits[f] * multiplier;
    }
  }
  return new Buffer(octets);
}

export function bufferToCompactBits(startingBuff: Buffer): Buffer {
  let bigNum: number = startingBuff.readInt32BE(0);
  let buff = Buffer.from([bigNum]);
  buff =
    buff.readUInt8(0) > 0x7f ? Buffer.concat([new Buffer([0x00]), buff]) : buff;
  buff = Buffer.concat([new Buffer([buff.length]), buff]);
  return buff.slice(0, 4);
}

export function bignumFromBitsBuffer(bitsBuff: Buffer): BigNumber {
  let numBytes = bitsBuff.readUInt8(0);
  let bigBits = new BigNumber(bitsBuff.slice(1).readInt32BE(0));
  let target = bigBits.multipliedBy(
    new BigNumber(2).pow(new BigNumber(8).multipliedBy(numBytes - 3))
  );
  return target;
}

export function bignumFromBitsHex(bitsString: string): BigNumber {
  let bitsBuff = new Buffer(bitsString, 'hex');
  return bignumFromBitsBuffer(bitsBuff);
}

export function convertBitsToBuff(bitsBuff: Buffer): Buffer {
  let target = bignumFromBitsBuffer(bitsBuff);
  let resultBuff = Buffer.from(target);
  let buff256 = new Buffer(32);
  buff256.fill(0);
  resultBuff.copy(buff256, buff256.length - resultBuff.length);
  return buff256;
}

export function getTruncatedDiff(shift: number): Buffer {
  return convertBitsToBuff(bufferToCompactBits(shiftMax256Right(shift)));
}
