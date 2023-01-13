import bitcoin from 'bitcoinjs-lib';
import { RpcData } from './types/common';
import { CreateGeneration } from './types/transactions';
import { reverseBuffer } from './utils';

function scriptCompile(addrHash: Buffer): Buffer {
  const script = bitcoin.script.compile([
    bitcoin.opcodes.OP_DUP,
    bitcoin.opcodes.OP_HASH160,
    addrHash,
    bitcoin.opcodes.OP_EQUALVERIFY,
    bitcoin.opcodes.OP_CHECKSIG,
  ]);
  return script;
}

export function createGeneration(
  rpcData: RpcData,
  blockReward: number,
  // @ts-ignore
  feeReward: number,
  recipients: any[],
  poolAddress: string
): CreateGeneration {
  let poolAddrHash = bitcoin.address.fromBase58Check(poolAddress).hash;
  let tx = new bitcoin.Transaction();
  let blockHeight = rpcData.height;
  let blockHeightSerial = blockHeight.toString(16);

  if (blockHeight.toString(16).length % 2 !== 0) {
    blockHeightSerial = '0' + blockHeight.toString(16);
  }

  let height = Math.ceil((blockHeight << 1).toString(2).length / 8);
  let lengthDiff = blockHeightSerial.length / 2 - height;

  for (let i = 0; i < lengthDiff; i++) {
    blockHeightSerial = blockHeightSerial + '00';
  }

  const length = '0' + height;
  let serializedBlockHeight = Buffer.concat([
    new Buffer(length, 'hex'),
    reverseBuffer(new Buffer(blockHeightSerial, 'hex')),
    new Buffer('00', 'hex'), // OP_0
  ]);
  tx.addInput(
    new Buffer(
      '0000000000000000000000000000000000000000000000000000000000000000',
      'hex'
    ),
    0xffffffff,
    0xffffffff,
    // https://github.com/RavenCommunity/kawpow-stratum-pool/commit/f59b1e2c0485804782fea99c024a29fde666e648
    Buffer.concat([serializedBlockHeight, new Buffer('6b6177706f77', 'hex')])
  );
  let feePercent = 0;
  for (let i = 0; i < recipients.length; i++) {
    feePercent = feePercent + recipients[i].percent;
  }
  let rewardToPool = Math.floor(blockReward * (1 - feePercent / 100));
  tx.addOutput(scriptCompile(poolAddrHash), rewardToPool);
  for (let i = 0; i < recipients.length; i++) {
    tx.addOutput(
      scriptCompile(
        bitcoin.address.fromBase58Check(recipients[i].address).hash
      ),
      Math.round(blockReward * (recipients[i].percent / 100))
    );
  }
  if (rpcData.default_witness_commitment !== undefined) {
    tx.addOutput(new Buffer(rpcData.default_witness_commitment, 'hex'), 0);
  }

  const txHex = tx.toHex();
  const txHash = tx.getHash().toString('hex');

  rpcData.rewardToPool = rewardToPool;

  return {
    txHex,
    txHash,
  };
}

// Transaction Fee
export function getFees(feeArray: any[]) {
  let fee = Number();
  feeArray.forEach((value: any) => {
    fee = fee + Number(value.fee);
  });
  return fee;
}
