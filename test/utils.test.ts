import * as utils from '../src/utils';

describe('Utils', () => {
  const address = 'mqn4qcJGP5BQbMxBPcm8aeBkGH1CZ3cBdZ';

  // it('addressFromEx', function() {

  // })

  it('getVersionByte should return a Uint8Array', function() {
    const uint8 = new Uint8Array([111]);
    expect(utils.getVersionByte(address)).toEqual(uint8);
  });

  // it('sha256', function() {

  // })

  // it('sha256d', function() {

  // })

  // it('reverseBuffer', function() {

  // })

  // it('reverseHex', function() {

  // })

  // it('reverseByteOrder', function() {

  // })

  // it('uint256BufferFromHash', function() {

  // })

  // it('hexFromReversedBuffer', function() {

  // })

  // it('varIntBuffer', function() {

  // })

  // it('varStringBuffer', function() {

  // })

  // it('serializeNumber', function() {

  // })

  // it('serializeString', function() {

  // })

  // it('packUInt16LE', function() {

  // })

  // it('packInt32LE', function() {

  // })

  // it('packInt32BE', function() {

  // })

  // it('packUInt32LE', function() {

  // })

  // it('packUInt32BE', function() {

  // })

  // it('packInt64LE', function() {

  // })

  // it('range', function() {

  // })

  // it('pubkeyToScript', function() {

  // })

  // it('miningKeyToScript', function() {

  // })

  // it('addressToScript', function() {

  // })

  // it('getReadableHashRateString', function() {

  // })

  // it('shiftMax256Right', function() {

  // })

  // it('bufferToCompactBits', function() {

  // })

  // it('bignumFromBitsBuffer', function() {

  // })

  // it('bignumFromBitsHex', function() {

  // })

  // it('convertBitsToBuff', function() {

  // })

  // it('getTruncatedDiff', function() {

  // })
});
