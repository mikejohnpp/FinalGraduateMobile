import { sha256 } from 'js-sha256';

export const UNSIGNED_PAYLOAD = 'UNSIGNED-PAYLOAD';

const ALGORITHM = 'AWS4-HMAC-SHA256';
const SERVICE = 's3';

const REGION = 'auto';

export interface SignParams {
  method: string;

  url: string;
  accessKeyId: string;
  secretAccessKey: string;

  headers: Record<string, string>;
}

function buildTimestamps(now: Date): { amzDate: string; dateStamp: string } {
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  return { amzDate, dateStamp: amzDate.slice(0, 8) };
}

export function encodeObjectKey(key: string): string {
  return key
    .split('/')
    .map((seg) =>
      encodeURIComponent(seg).replace(
        /[!'()*]/g,
        (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
      )
    )
    .join('/');
}

function hmacBytes(key: string | number[], data: string): number[] {
  return sha256.hmac.array(key, data);
}

export function signRequest(params: SignParams): Record<string, string> {
  const { method, url, accessKeyId, secretAccessKey, headers } = params;
  const parsed = new URL(url);
  const { amzDate, dateStamp } = buildTimestamps(new Date());

  const allHeaders: Record<string, string> = {
    ...headers,
    host: parsed.host,
    'x-amz-content-sha256': UNSIGNED_PAYLOAD,
    'x-amz-date': amzDate,
  };

  const sortedKeys = Object.keys(allHeaders)
    .map((k) => k.toLowerCase())
    .sort();
  const canonicalHeaders = sortedKeys
    .map((k) => {
      const original = Object.keys(allHeaders).find((h) => h.toLowerCase() === k) as string;
      return `${k}:${String(allHeaders[original]).trim()}\n`;
    })
    .join('');
  const signedHeaders = sortedKeys.join(';');

  const canonicalRequest = [
    method,
    parsed.pathname,
    parsed.searchParams.toString(),
    canonicalHeaders,

    signedHeaders,
    UNSIGNED_PAYLOAD,
  ].join('\n');

  const credentialScope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
  const stringToSign = [ALGORITHM, amzDate, credentialScope, sha256(canonicalRequest)].join('\n');

  const kDate = hmacBytes(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmacBytes(kDate, REGION);
  const kService = hmacBytes(kRegion, SERVICE);
  const kSigning = hmacBytes(kService, 'aws4_request');
  const signature = sha256.hmac.hex(kSigning, stringToSign);

  return {
    ...headers,
    'x-amz-content-sha256': UNSIGNED_PAYLOAD,
    'x-amz-date': amzDate,
    Authorization: `${ALGORITHM} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
  };
}
