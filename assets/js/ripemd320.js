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
    return 0xa953
