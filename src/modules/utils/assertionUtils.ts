import { JsonWebKey } from 'crypto';

// Base64Url 인코딩 함수 (브라우저 환경용)
export const base64UrlEncode = (arrayBuffer: ArrayBuffer): string => {
  const uint8Array = new Uint8Array(arrayBuffer);
  let base64 = btoa(String.fromCharCode.apply(null, Array.from(uint8Array)));
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

// Base64Url 디코딩 함수 (브라우저 환경용)
export const base64UrlDecode = (str: string): Uint8Array => {
  // base64url을 base64로 변환
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  
  // 패딩 추가 (필요한 경우)
  while (base64.length % 4) {
    base64 += '=';
  }
  
  // 브라우저에서 atob 사용
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// Base64Url 인코딩된 JWK를 JsonWebKey 객체로 변환
export const decodeBase64UrlToJwk = (encodedJwk: string): JsonWebKey => {
  try {
    const decoded = base64UrlDecode(encodedJwk);
    // Uint8Array를 문자열로 변환
    const textDecoder = new TextDecoder('utf-8');
    const jsonString = textDecoder.decode(decoded);
    const jwk = JSON.parse(jsonString) as JsonWebKey;
    return jwk;
  } catch (error) {
    throw new Error(`Failed to decode base64url JWK: ${error}`);
  }
};

// UUID 생성 함수 (crypto.randomUUID 대신 사용)
export const generateUUID = (): string => {
  // 브라우저 환경에서 사용할 수 있는 UUID 생성
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback UUID 생성
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// JWT 서명 생성 함수
export const signJwt = (privateKey: CryptoKey, payload: Record<string, unknown>): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      // 문자열을 ArrayBuffer로 변환
      const encoder = new TextEncoder();
      const headerBuffer = encoder.encode(JSON.stringify({ alg: 'ES256', typ: 'JWT' }));
      const bodyBuffer = encoder.encode(JSON.stringify(payload));
      
      const header = base64UrlEncode(headerBuffer.buffer);
      const body = base64UrlEncode(bodyBuffer.buffer);
      const signingInput = `${header}.${body}`;
      
      // Web Crypto API를 사용한 서명 생성
      const data = encoder.encode(signingInput);
      
      crypto.subtle.sign(
        {
          name: 'ECDSA',
          hash: 'SHA-256',
        },
        privateKey,
        data
      ).then((signature) => {
        const signatureBuffer = new Uint8Array(signature);
        const encodedSignature = base64UrlEncode(signatureBuffer.buffer);
        resolve(`${signingInput}.${encodedSignature}`);
      }).catch(reject);
    } catch (error) {
      reject(error);
    }
  });
};

// JWK를 CryptoKey로 변환
export const jwkToCryptoKey = async (jwk: JsonWebKey): Promise<CryptoKey> => {
  try {
    const cryptoKey = await crypto.subtle.importKey(
      'jwk',
      jwk,
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      false,
      ['sign']
    );
    return cryptoKey;
  } catch (error) {
    throw new Error(`Failed to convert JWK to CryptoKey: ${error}`);
  }
};

// Client Assertion 생성 함수
export const createClientAssertion = async (
  privateKey: string, // base64Url 인코딩된 JWK
  clientId: string,
  audience: string
): Promise<string> => {
  try {
    // Base64Url 인코딩된 JWK를 JsonWebKey로 변환
    const privateJwk = decodeBase64UrlToJwk(privateKey);
    
    // JWK를 CryptoKey로 변환
    const cryptoKey = await jwkToCryptoKey(privateJwk);
    
    const now = Math.floor(Date.now() / 1000);
    const jti = generateUUID();
    const payload = {
      iss: clientId,
      sub: clientId,
      aud: audience,
      iat: now,
      exp: now + 300, // 5분 후 만료
      jti: jti,
    };
    
    return await signJwt(cryptoKey, payload);
  } catch (error) {
    throw new Error(`Failed to create client assertion: ${error}`);
  }
};
