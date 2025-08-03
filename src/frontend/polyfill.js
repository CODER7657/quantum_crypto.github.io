/**
 * TextEncoder/TextDecoder Polyfill for older browsers
 * This polyfill ensures compatibility with browsers that don't support TextEncoder/TextDecoder
 */

// TextEncoder polyfill
if (typeof TextEncoder === 'undefined') {
    console.log('TextEncoder not supported, using polyfill');
    window.TextEncoder = function TextEncoder() {};
    
    TextEncoder.prototype.encode = function(str) {
        'use strict';
        const Len = str.length;
        let resPos = -1;
        // 2 bytes for each char
        const resArr = new Uint8Array(Len * 3);
        
        for (let point = 0, nextcode = 0, i = 0; i !== Len; ) {
            point = str.charCodeAt(i);
            i += 1;
            
            if (point >= 0xD800 && point <= 0xDBFF) {
                if (i === Len) {
                    resArr[resPos += 1] = 0xef; resArr[resPos += 1] = 0xbf;
                    resArr[resPos += 1] = 0xbd; break;
                }
                // surrogate pairs
                nextcode = str.charCodeAt(i);
                if (nextcode >= 0xDC00 && nextcode <= 0xDFFF) {
                    point = (point - 0xD800) * 0x400 + nextcode - 0xDC00 + 0x10000;
                    i += 1;
                    if (point > 0xffff) {
                        resArr[resPos += 1] = (0x1e<<3) | (point>>>18);
                        resArr[resPos += 1] = (0x2<<6) | ((point>>>12) & 0x3f);
                        resArr[resPos += 1] = (0x2<<6) | ((point>>>6) & 0x3f);
                        resArr[resPos += 1] = (0x2<<6) | (point & 0x3f);
                        continue;
                    }
                } else {
                    resArr[resPos += 1] = 0xef; resArr[resPos += 1] = 0xbf;
                    resArr[resPos += 1] = 0xbd; continue;
                }
            }
            if (point <= 0x007f) {
                resArr[resPos += 1] = (0x0<<7) | point;
            } else if (point <= 0x07ff) {
                resArr[resPos += 1] = (0x6<<5) | (point>>>6);
                resArr[resPos += 1] = (0x2<<6) | (point & 0x3f);
            } else {
                resArr[resPos += 1] = (0xe<<4) | (point>>>12);
                resArr[resPos += 1] = (0x2<<6) | ((point>>>6) & 0x3f);
                resArr[resPos += 1] = (0x2<<6) | (point & 0x3f);
            }
        }
        return resArr.subarray(0, resPos + 1);
    };
}

// TextDecoder polyfill
if (typeof TextDecoder === 'undefined') {
    console.log('TextDecoder not supported, using polyfill');
    window.TextDecoder = function TextDecoder() {};
    
    TextDecoder.prototype.decode = function(octets) {
        'use strict';
        let string = '';
        let i = 0;
        while (i < octets.length) {
            let octet = octets[i];
            let bytesNeeded = 0;
            let codePoint = 0;
            
            if (octet <= 0x7F) {
                bytesNeeded = 0;
                codePoint = octet & 0xFF;
            } else if (octet <= 0xDF) {
                bytesNeeded = 1;
                codePoint = octet & 0x1F;
            } else if (octet <= 0xEF) {
                bytesNeeded = 2;
                codePoint = octet & 0x0F;
            } else if (octet <= 0xF4) {
                bytesNeeded = 3;
                codePoint = octet & 0x07;
            }
            
            if (octets.length - i - bytesNeeded > 0) {
                let k = 0;
                while (k < bytesNeeded) {
                    octet = octets[i + k + 1];
                    codePoint = (codePoint << 6) | (octet & 0x3F);
                    k += 1;
                }
            } else {
                codePoint = 0xFFFD;
                bytesNeeded = octets.length - i;
            }
            
            string += String.fromCodePoint(codePoint);
            i += bytesNeeded + 1;
        }
        
        return string;
    };
}

// Crypto.subtle polyfill for simple hash function
if (typeof crypto === 'undefined' || !crypto.subtle) {
    console.log('Crypto.subtle not supported, using polyfill');
    
    // Create crypto object if it doesn't exist
    if (typeof crypto === 'undefined') {
        window.crypto = {};
    }
    
    // Add a simple implementation of subtle crypto
    window.crypto.subtle = {
        digest: function(algorithm, data) {
            // Simple hash function that returns a promise
            return new Promise(function(resolve) {
                // Create a simple hash
                let hash = 0;
                const bytes = new Uint8Array(data);
                
                for (let i = 0; i < bytes.length; i++) {
                    const byte = bytes[i];
                    hash = ((hash << 5) - hash) + byte;
                    hash = hash & hash; // Convert to 32-bit integer
                }
                
                // Convert to 32-byte array
                const result = new Uint8Array(32);
                for (let i = 0; i < 32; i++) {
                    result[i] = (hash >> (i % 4 * 8)) & 0xFF;
                }
                
                resolve(result.buffer);
            });
        }
    };
}

console.log('Polyfills loaded for TextEncoder, TextDecoder, and crypto.subtle');