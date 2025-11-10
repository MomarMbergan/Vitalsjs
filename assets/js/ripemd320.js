Master Momar Mbergan 
 * RIPEMD-320 Implementation in JavaScript (exported as RIPEMD320)
 * Adapted for browser use. Returns a lowercase hex string.
 *
 * NOTE: This implementation is adapted for embedding. It's the same
 * function the dashboard expects as a global RIPEMD320(string) -> hex
 *
 * Public-domain style adaptation.
 */
(function(root) {
  'use strict';
  function rotl(x, n) { return (x << n) | (x >>> (32 - n)); }
  function f(j, x, y, z) {
    if (j < 16) return x ^ y ^ z;
    if (j < 32) return (x & y) | (~x & z);
    if (j < 48) return (x | ~y) ^ z;
    if (j < 64) return (x & z) | (y & ~z);
    return x ^ (y | ~z);
  }
  function K1(j) {
    if (j < 16) return 0x00000000;
    if (j < 32) return 0x5a827999;
    if (j < 48) return 0x6ed9eba1;
    if (j < 64) return 0x8f1bbcdc;
    return 0xa953fd4e;
  }
  function K2(j) {
    if (j < 16) return 0x50a28be6;
    if (j < 32) return 0x5c4dd124;
    if (j < 48) return 0x6d703ef3;
    if (j < 64) return 0x7a6d76e9;
    return 0x00000000;
  }
  function bytesToWords(bytes) {
    var words = [];
    for (var i = 0; i < bytes.length; i++) {
      words[i >>> 2] |= bytes[i] << ((i % 4) * 8);
    }
    return words;
  }
  function wordsToBytes(words) {
    var bytes = [];
    for (var i = 0; i < words.length * 4; i++) {
      bytes.push((words[i >>> 2] >>> ((i % 4) * 8)) & 0xff);
    }
    return bytes;
  }
  function ripemd320(msgBytes) {
    var x = bytesToWords(msgBytes.slice());
    var bitLength = msgBytes.length * 8;
    x[bitLength >>> 5] |= 0x80 << (bitLength % 32);
    x[(((bitLength + 64) >>> 9) << 4) + 14] = bitLength;

    var h0 = 0x67452301, h1 = 0xefcdab89, h2 = 0x98badcfe, h3 = 0x10325476, h4 = 0xc3d2e1f0;
    var h5 = 0x76543210, h6 = 0xFEDCBA98, h7 = 0x89ABCDEF, h8 = 0x01234567, h9 = 0x3C2D1E0F;

    var R1 = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,
