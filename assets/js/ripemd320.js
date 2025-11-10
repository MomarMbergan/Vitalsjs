/**
 * RIPEMD-320 Implementation in JavaScript
 * Public Domain / CC0
 * Based on the original RIPEMD reference code
 * Source adapted from CryptoJS community and Paul Johnston’s RIPEMD-160, extended to 320
 */

(function(root) {
  function rotl(x, n) { return (x << n) | (x >>> (32 - n)); }
  function f(j, x, y, z) {
    return j < 16 ? (x ^ y ^ z) :
           j < 32 ? (x & y) | (~x & z) :
           j < 48 ? (x | ~y) ^ z :
           j < 64 ? (x & z) | (y & ~z) :
                    x ^ (y | ~z);
  }

  function K1(j) {
    return j < 16 ? 0x00000000 :
           j < 32 ? 0x5a827999 :
           j < 48 ? 0x6ed9eba1 :
           j < 64 ? 0x8f1bbcdc :
                    0xa953fd4e;
  }

  function K2(j) {
    return j < 16 ? 0x50a28be6 :
           j < 32 ? 0x5c4dd124 :
           j < 48 ? 0x6d703ef3 :
           j < 64 ? 0x7a6d76e9 :
                    0x00000000;
  }

  function bytesToWords(bytes) {
    const words = [];
    for (let i = 0, b = 0; i < bytes.length; i++, b += 8)
      words[b >>> 5] |= bytes[i] << (b % 32);
    return words;
  }

  function wordsToBytes(words) {
    const bytes = [];
    for (let b = 0; b < words.length * 32; b += 8)
      bytes.push((words[b >>> 5] >>> (b % 32)) & 0xff);
    return bytes;
  }

  function ripemd320(messageBytes) {
    const x = bytesToWords(messageBytes);
    const len = messageBytes.length * 8;
    x[len >>> 5] |= 0x80 << (len % 32);
    x[(((len + 64) >>> 9) << 4) + 14] = len;

    let h0 = 0x67452301, h1 = 0xefcdab89, h2 = 0x98badcfe, h3 = 0x10325476, h4 = 0xc3d2e1f0;
    let h5 = 0x76543210, h6 = 0xFEDCBA98, h7 = 0x89ABCDEF, h8 = 0x01234567, h9 = 0x3C2D1E0F;

    for (let i = 0; i < x.length; i += 16) {
      let A1 = h0, B1 = h1, C1 = h2, D1 = h3, E1 = h4;
      let A2 = h5, B2 = h6, C2 = h7, D2 = h8, E2 = h9;

      for (let j = 0; j < 80; j++) {
        const T = rotl(A1 + f(j, B1, C1, D1) + x[i + (j % 16)] + K1(j), [11,14,15,12,5,8,7,9,11,13,14,15,6,7,9,8][j % 16]) + E1;
        A1 = E1; E1 = D1; D1 = rotl(C1, 10); C1 = B1; B1 = T;

        const T2 = rotl(A2 + f(79 - j, B2, C2, D2) + x[i + ((5 * j + 1) % 16)] + K2(j), [8,9,9,11,13,15,15,5,7,7,8,11,14,14,12,6][j % 16]) + E2;
        A2 = E2; E2 = D2; D2 = rotl(C2, 10); C2 = B2; B2 = T2;
      }

      const T = h1 + C1 + D2;
      h1 = h2 + D1 + E2;
      h2 = h3 + E1 + A2;
      h3 = h4 + A1 + B2;
      h4 = h0 + B1 + C2;
      h0 = T;

      const U = h6 + C2 + D1;
      h6 = h7 + D2 + E1;
      h7 = h8 + E2 + A1;
      h8 = h9 + A2 + B1;
      h9 = h5 + B2 + C1;
      h5 = U;
    }

    const result = [h0,h1,h2,h3,h4,h5,h6,h7,h8,h9];
    return wordsToBytes(result).map(b => ('0' + b.toString(16)).slice(-2)).join('');
  }

  root.RIPEMD320 = function(str) {
    const bytes = new TextEncoder().encode(str);
    return ripemd320(bytes);
  };
})(this);
