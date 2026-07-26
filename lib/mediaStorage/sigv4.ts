// Ký AWS Signature V4 cho request PUT object lên Cloudflare R2 (S3-compatible API).
//
// Vì sao tự ký thay vì dùng @aws-sdk/client-s3 như web:
// - Bundle browser của aws-sdk cần `crypto.subtle` (WebCrypto), Hermes/RN không có.
// - Các polyfill WebCrypto cho RN đều là native module → phải prebuild lại app.
// `js-sha256` là pure JS (không native), nên chỉ cần cài package là chạy được.
//
// Dùng `x-amz-content-sha256: UNSIGNED-PAYLOAD` để KHÔNG phải đọc toàn bộ tệp vào RAM
// chỉ để băm — quan trọng với video vài chục MB trên máy yếu. R2 chấp nhận giá trị này
// khi request đi qua HTTPS.
import { sha256 } from 'js-sha256';

export const UNSIGNED_PAYLOAD = 'UNSIGNED-PAYLOAD';

const ALGORITHM = 'AWS4-HMAC-SHA256';
const SERVICE = 's3';
// R2 không phân vùng theo region, luôn dùng "auto" (giống web: `region: "auto"`).
const REGION = 'auto';

export interface SignParams {
    method: string;
    // URL đầy đủ của object, vd https://{account}.r2.cloudflarestorage.com/{bucket}/{key}
    url: string;
    accessKeyId: string;
    secretAccessKey: string;
    // Các header cần được ký (ngoài host và x-amz-*).
    headers: Record<string, string>;
}

// Chuỗi thời gian dạng 20260726T051200Z và 20260726.
function buildTimestamps(now: Date): { amzDate: string; dateStamp: string } {
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    return { amzDate, dateStamp: amzDate.slice(0, 8) };
}

// Encode object key theo RFC 3986 (giữ "/" làm dấu phân tách segment).
// encodeURIComponent bỏ sót ! ' ( ) * nên phải encode thủ công.
// Provider PHẢI dùng hàm này khi ghép URL, để canonical URI lúc ký trùng khít
// với path thật sự được gửi đi — nếu lệch, R2 trả 403 SignatureDoesNotMatch.
export function encodeObjectKey(key: string): string {
    return key
        .split('/')
        .map((seg) =>
            encodeURIComponent(seg).replace(
                /[!'()*]/g,
                (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
            ),
        )
        .join('/');
}


// HMAC-SHA256 trả về mảng byte để làm khoá cho vòng ký tiếp theo.
function hmacBytes(key: string | number[], data: string): number[] {
    return sha256.hmac.array(key, data);
}

// Ký request và trả về các header cần gắn (Authorization, x-amz-date, ...).
export function signRequest(params: SignParams): Record<string, string> {
    const { method, url, accessKeyId, secretAccessKey, headers } = params;
    const parsed = new URL(url);
    const { amzDate, dateStamp } = buildTimestamps(new Date());

    // Gộp header do caller truyền vào với các header bắt buộc của SigV4.
    const allHeaders: Record<string, string> = {
        ...headers,
        host: parsed.host,
        'x-amz-content-sha256': UNSIGNED_PAYLOAD,
        'x-amz-date': amzDate,
    };

    // Canonical headers phải sắp xếp theo tên (đã lowercase) và trim giá trị.
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

    // parsed.pathname đã ở dạng encode đúng (provider dùng encodeObjectKey), nên ký y nguyên.
    const canonicalRequest = [
        method,
        parsed.pathname,
        parsed.searchParams.toString(),
        canonicalHeaders,

        signedHeaders,
        UNSIGNED_PAYLOAD,
    ].join('\n');

    const credentialScope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
    const stringToSign = [
        ALGORITHM,
        amzDate,
        credentialScope,
        sha256(canonicalRequest),
    ].join('\n');

    // Chuỗi ký phái sinh: kDate → kRegion → kService → kSigning.
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
