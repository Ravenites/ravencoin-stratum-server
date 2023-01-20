import denodeify from 'denodeify';
import { reverseBuffer } from './utils';

const merklebitcoin = denodeify(require('merkle-bitcoin'));

function _calcRoot(hashes: string[]): string {
  const result: Record<string, any> = merklebitcoin(hashes);
  return Object.values(result)[2].root;
}

type Transaction = {
  txid: string;
  hash: string;
};

type RpcData = {
  transactions: Transaction[];
};

export function getRoot(rpcData: RpcData, generateTxRaw: string): string {
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

  const result = _calcRoot(hashes);
  return result;
}
