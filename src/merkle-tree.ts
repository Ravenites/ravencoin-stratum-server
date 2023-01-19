import merkle from 'merkle-bitcoin';
import { reverseBuffer } from './utils';

function _calcRoot(hashes: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    merkle(hashes, (err: any, merkleTree: any[]) => {
      if (err) {
        reject(err);
      } else {
        const result = Object.values(merkleTree)[2].root;
        resolve(result);
      }
    });
  });
}

type Transaction = {
  txid: string;
  hash: string;
};

type RpcData = {
  transactions: Transaction[];
};

export async function getRoot(
  rpcData: RpcData,
  generateTxRaw: string
): Promise<string> {
  const hashes = [
    reverseBuffer(Buffer.from(generateTxRaw, 'hex')).toString('hex'),
  ];
  rpcData.transactions.forEach(value => {
    if (value.txid !== undefined) {
      hashes.push(value.txid);
    } else {
      hashes.push(value.hash);
    }
  });

  if (hashes.length === 1) {
    return hashes[0];
  }

  const result = await _calcRoot(hashes);
  return result;
}
