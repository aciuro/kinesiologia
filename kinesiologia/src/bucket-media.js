const crypto = require('crypto');
const https = require('https');
const path = require('path');

function hash(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function hmac(key, value, encoding) {
  return crypto.createHmac('sha256', key).update(value).digest(encoding);
}

function signingKey(secret, date, region) {
  return hmac(hmac(hmac(hmac(`AWS4${secret}`, date), region), 's3'), 'aws4_request');
}

function storageConfig() {
  const endpoint = process.env.BUCKET_ENDPOINT || process.env.ENDPOINT;
  const bucket = process.env.BUCKET || process.env.BUCKET_NAME;
  const accessKeyId = process.env.BUCKET_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID;
  const secretAccessKey = process.env.BUCKET_SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY;
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) return null;

  const url = new URL(endpoint);
  if (!url.hostname.startsWith(`${bucket}.`)) url.hostname = `${bucket}.${url.hostname}`;
  return { url, accessKeyId, secretAccessKey, region: process.env.BUCKET_SIGNING_REGION || 'sjc' };
}

function safeVideoKey(filename) {
  if (!filename || filename !== path.basename(filename) || !filename.toLowerCase().endsWith('.mp4')) return null;
  return filename;
}

function signedGet(config, key, range) {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const date = amzDate.slice(0, 8);
  const canonicalUri = `/${encodeURIComponent(key)}`;
  const payloadHash = hash('');
  const headers = {
    host: config.url.host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
  };
  if (range && /^bytes=\d*-\d*(,\d*-\d*)*$/.test(range)) headers.range = range;

  const signedHeaderNames = Object.keys(headers).sort();
  const canonicalHeaders = signedHeaderNames.map(name => `${name}:${headers[name]}\n`).join('');
  const signedHeaders = signedHeaderNames.join(';');
  const scope = `${date}/${config.region}/s3/aws4_request`;
  const canonicalRequest = `GET\n${canonicalUri}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${hash(canonicalRequest)}`;
  const signature = hmac(signingKey(config.secretAccessKey, date, config.region), stringToSign, 'hex');

  return {
    hostname: config.url.hostname,
    port: config.url.port || 443,
    method: 'GET',
    path: canonicalUri,
    headers: {
      ...headers,
      authorization: `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    },
  };
}

function serveExerciseVideo(req, res) {
  const key = safeVideoKey(req.params.filename);
  const config = storageConfig();
  if (!key) return res.status(400).json({ error: 'Video inválido' });
  if (!config) return res.status(503).json({ error: 'El almacenamiento de videos todavía no está configurado' });

  const upstream = https.request(signedGet(config, key, req.headers.range), response => {
    if (![200, 206].includes(response.statusCode)) {
      response.resume();
      return res.status(response.statusCode === 404 ? 404 : 502).json({ error: response.statusCode === 404 ? 'Video no encontrado' : 'No se pudo cargar el video' });
    }

    res.status(response.statusCode);
    res.setHeader('Content-Type', response.headers['content-type'] || 'video/mp4');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
    for (const header of ['content-length', 'content-range']) {
      if (response.headers[header]) res.setHeader(header, response.headers[header]);
    }
    response.pipe(res);
  });

  upstream.on('error', () => {
    if (!res.headersSent) res.status(502).json({ error: 'No se pudo conectar al almacenamiento de videos' });
  });
  upstream.end();
}

module.exports = { serveExerciseVideo };
