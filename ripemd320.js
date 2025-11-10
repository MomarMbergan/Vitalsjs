/**
 * RIPEMD-320 Implementation in JavaScript (exported as RIPEMD320)
 * Adapted for browser use. Returns a lowercase hex string.
 *
 * Note: This is a pure-JS implementation embedded as requested.
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
    x[(((bitLength + 64) >>> 9) << 4) + 14] = bitLength >>> 0;

    var h0 = 0x67452301, h1 = 0xefcdab89, h2 = 0x98badcfe, h3 = 0x10325476, h4 = 0xc3d2e1f0;
    var h5 = 0x76543210, h6 = 0xFEDCBA98, h7 = 0x89ABCDEF, h8 = 0x01234567, h9 = 0x3C2D1E0F;

    var R1 = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,
              7,4,13,1,10,6,15,3,12,0,9,5,2,14,11,8,
              3,10,14,4,9,15,8,1,2,7,0,6,13,11,5,12,
              1,9,11,10,0,8,12,4,13,3,7,15,14,5,6,2,
              4,0,5,9,7,12,2,10,14,1,3,8,11,6,15,13];
    var R2 = [5,14,7,0,9,2,11,4,13,6,15,8,1,10,3,12,
              6,11,3,7,0,13,5,10,14,15,8,12,4,9,1,2,
              15,5,1,3,7,14,6,9,11,8,12,2,10,0,4,13,
              8,6,4,1,3,11,15,0,5,12,2,13,9,7,10,14,
              12,15,10,4,1,5,8,7,6,2,13,14,0,3,9,11];
    var S1 = [11,14,15,12,5,8,7,9,11,13,14,15,6,7,9,8,
              7,6,8,13,11,9,7,15,7,12,15,9,11,7,13,12,
              11,13,6,7,14,9,13,15,14,8,13,6,5,12,7,5,
              11,12,14,15,14,15,9,8,9,14,5,6,8,6,5,12,
              9,15,5,11,6,8,13,12,5,12,13,14,11,8,5,6];
    var S2 = [8,9,9,11,13,15,15,5,7,7,8,11,14,14,12,6,
              9,13,15,7,12,8,9,11,7,7,12,7,6,15,13,11,
              9,7,15,11,8,6,6,14,12,13,5,14,13,13,7,5,
              15,5,8,11,14,14,6,14,6,9,12,9,12,5,15,8,
              8,5,12,9,12,5,14,6,8,13,6,5,15,13,11,11];

    for (var i = 0; i < x.length; i += 16) {
      var A1 = h0, B1 = h1, C1 = h2, D1 = h3, E1 = h4;
      var A2 = h5, B2 = h6, C2 = h7, D2 = h8, E2 = h9;
      for (var j = 0; j < 80; j++) {
        var T = (rotl(((A1 + f(j, B1, C1, D1) + (x[i + R1[j]] >>> 0) + K1(j)) >>> 0), S1[j]) + E1) >>> 0;
        A1 = E1; E1 = D1; D1 = rotl(C1, 10) >>> 0; C1 = B1; B1 = T;
        var T2 = (rotl(((A2 + f(79 - j, B2, C2, D2) + (x[i + R2[j]] >>> 0) + K2(j)) >>> 0), S2[j]) + E2) >>> 0;
        A2 = E2; E2 = D2; D2 = rotl(C2, 10) >>> 0; C2 = B2; B2 = T2;
      }
      var T = (h1 + C1 + D2) >>> 0;
      h1 = (h2 + D1 + E2) >>> 0;
      h2 = (h3 + E1 + A2) >>> 0;
      h3 = (h4 + A1 + B2) >>> 0;
      h4 = (h0 + B1 + C2) >>> 0;
      h0 = T;
      var U = (h6 + C2 + D1) >>> 0;
      h6 = (h7 + D2 + E1) >>> 0;
      h7 = (h8 + E2 + A1) >>> 0;
      h8 = (h9 + A2 + B1) >>> 0;
      h9 = (h5 + B2 + C1) >>> 0;
      h5 = U;
    }
    var result = [h0,h1,h2,h3,h4,h5,h6,h7,h8,h9];
    var bytes = wordsToBytes(result);
    var hex = bytes.map(function(b){ return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
    return hex;
  }

  root.RIPEMD320 = function(str) {
    var enc = new TextEncoder().encode(str);
    // convert Uint8Array to Array for ripemd320 helper
    return ripemd320(Array.from(enc));
  };
})(this);
