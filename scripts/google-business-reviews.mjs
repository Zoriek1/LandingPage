#!/usr/bin/env node
import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, '.env');
const SCOPE = 'https://www.googleapis.com/auth/business.manage';
const AUTH_BASE = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const ACCOUNTS_URL = 'https://mybusinessaccountmanagement.googleapis.com/v1/accounts';
const LOCATIONS_URL = 'https://mybusinessbusinessinformation.googleapis.com/v1';
const REVIEWS_URL = 'https://mybusiness.googleapis.com/v4';

let TOKEN_PATH;
let OUTPUT_PATH;
let REDIRECT_PORT;
let REDIRECT_URI;

async function loadDotEnv() {
  if (!existsSync(ENV_PATH)) return;

  const raw = await readFile(ENV_PATH, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;

    const [key, ...valueParts] = trimmed.split('=');
    const value = valueParts.join('=').trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

function configureFromEnv() {
  TOKEN_PATH = path.join(ROOT, process.env.GOOGLE_TOKEN_FILE || '.google-business-token.json');
  OUTPUT_PATH = path.join(ROOT, process.env.GOOGLE_REVIEWS_OUTPUT || 'public/lpb/google-reviews.json');
  REDIRECT_PORT = Number(process.env.GOOGLE_OAUTH_PORT || 8765);
  REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || `http://127.0.0.1:${REDIRECT_PORT}/oauth2callback`;
}

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. Add it to .env before running this command.`);
  }
  return value;
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (!item.startsWith('--')) {
      args._.push(item);
      continue;
    }

    const key = item.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

async function postForm(url, fields) {
  const body = new URLSearchParams();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== '') body.set(key, value);
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`Google token request failed (${response.status}): ${JSON.stringify(data, null, 2)}`);
  }

  return data;
}

async function googleGet(url, accessToken) {
  const response = await fetch(url, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`Google API request failed (${response.status}) for ${url}: ${JSON.stringify(data, null, 2)}`);
  }

  return data;
}

async function exchangeCodeForToken(code) {
  const clientId = getRequiredEnv('GOOGLE_CLIENT_ID');
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';

  const token = await postForm(TOKEN_URL, {
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: REDIRECT_URI,
    grant_type: 'authorization_code',
  });

  const saved = {
    ...token,
    created_at: new Date().toISOString(),
    expiry_date: Date.now() + Number(token.expires_in || 3600) * 1000,
  };
  await writeJson(TOKEN_PATH, saved);
  return saved;
}

async function refreshAccessToken() {
  const token = await readJson(TOKEN_PATH);
  if (token.access_token && token.expiry_date && token.expiry_date - Date.now() > 60_000) {
    return token.access_token;
  }

  if (!token.refresh_token) {
    throw new Error(`No refresh_token found in ${TOKEN_PATH}. Run: npm run google:reviews -- auth`);
  }

  const refreshed = await postForm(TOKEN_URL, {
    refresh_token: token.refresh_token,
    client_id: getRequiredEnv('GOOGLE_CLIENT_ID'),
    client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
    grant_type: 'refresh_token',
  });

  const saved = {
    ...token,
    ...refreshed,
    refresh_token: refreshed.refresh_token || token.refresh_token,
    refreshed_at: new Date().toISOString(),
    expiry_date: Date.now() + Number(refreshed.expires_in || 3600) * 1000,
  };
  await writeJson(TOKEN_PATH, saved);
  return saved.access_token;
}

function buildAuthUrl() {
  const url = new URL(AUTH_BASE);
  url.searchParams.set('client_id', getRequiredEnv('GOOGLE_CLIENT_ID'));
  url.searchParams.set('redirect_uri', REDIRECT_URI);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', SCOPE);
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('include_granted_scopes', 'true');
  url.searchParams.set('state', randomBytes(16).toString('hex'));
  return url;
}

async function runAuth() {
  getRequiredEnv('GOOGLE_CLIENT_ID');

  const authUrl = buildAuthUrl();
  console.log('\nOpen this URL in the browser and approve access:\n');
  console.log(authUrl.toString());
  console.log(`\nWaiting for Google redirect on ${REDIRECT_URI} ...\n`);

  await new Promise((resolve, reject) => {
    const server = createServer(async (req, res) => {
      try {
        const requestUrl = new URL(req.url || '/', REDIRECT_URI);
        if (requestUrl.pathname !== '/oauth2callback') {
          res.writeHead(404).end('Not found');
          return;
        }

        const error = requestUrl.searchParams.get('error');
        const code = requestUrl.searchParams.get('code');

        if (error) throw new Error(`OAuth error: ${error}`);
        if (!code) throw new Error('Google redirect did not include an authorization code.');

        const token = await exchangeCodeForToken(code);
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
        res.end('<h1>OK</h1><p>Refresh token saved. You can close this tab.</p>');
        server.close();

        console.log(`Saved token at ${path.relative(ROOT, TOKEN_PATH)}`);
        console.log(token.refresh_token ? 'Refresh token received.' : 'No refresh token returned. Re-run auth and make sure prompt=consent is used.');
        resolve();
      } catch (error) {
        res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
        res.end(error.message);
        server.close();
        reject(error);
      }
    });

    server.on('error', reject);
    server.listen(REDIRECT_PORT, '127.0.0.1');
  });
}

async function listAccountsAndLocations() {
  const accessToken = await refreshAccessToken();
  const accounts = (await googleGet(ACCOUNTS_URL, accessToken)).accounts || [];

  if (!accounts.length) {
    console.log('No Business Profile accounts returned for this Google user.');
    return [];
  }

  const result = [];
  for (const account of accounts) {
    const locations = await listLocationsForAccount(account.name, accessToken);
    result.push({ account, locations });
  }

  console.log(JSON.stringify(result.map(({ account, locations }) => ({
    accountName: account.name,
    accountDisplayName: account.accountName,
    locations: locations.map((location) => ({
      title: location.title,
      name: location.name,
      reviewParent: toReviewParent(account.name, location.name),
      placeId: location.metadata?.placeId || '',
      mapsUri: location.metadata?.mapsUri || '',
    })),
  })), null, 2));

  return result;
}

async function listLocationsForAccount(accountName, accessToken) {
  const locations = [];
  let pageToken = '';

  do {
    const url = new URL(`${LOCATIONS_URL}/${accountName}/locations`);
    url.searchParams.set('readMask', 'name,title,metadata');
    url.searchParams.set('pageSize', '100');
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const data = await googleGet(url.toString(), accessToken);
    locations.push(...(data.locations || []));
    pageToken = data.nextPageToken || '';
  } while (pageToken);

  return locations;
}

function toReviewParent(accountName, locationName) {
  if (locationName.startsWith('accounts/')) return locationName;
  return `${accountName}/${locationName}`;
}

async function fetchReviews(parent, accessToken) {
  const reviews = [];
  let pageToken = '';

  do {
    const url = new URL(`${REVIEWS_URL}/${parent}/reviews`);
    url.searchParams.set('pageSize', '50');
    url.searchParams.set('orderBy', 'updateTime desc');
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const data = await googleGet(url.toString(), accessToken);
    reviews.push(...(data.reviews || []));
    pageToken = data.nextPageToken || '';
  } while (pageToken);

  return reviews;
}

async function runFetch(args) {
  const accessToken = await refreshAccessToken();
  let parent = args.parent;

  if (!parent && args.account && args.location) {
    parent = toReviewParent(args.account, args.location);
  }

  if (!parent) {
    const listed = await listAccountsAndLocations();
    const candidates = listed.flatMap(({ account, locations }) =>
      locations.map((location) => toReviewParent(account.name, location.name)),
    );

    if (candidates.length !== 1) {
      throw new Error('Pass --parent "accounts/ACCOUNT_ID/locations/LOCATION_ID" from the list output.');
    }
    parent = candidates[0];
  }

  const reviews = await fetchReviews(parent, accessToken);
  const payload = {
    source: 'google_business_profile_api',
    parent,
    fetchedAt: new Date().toISOString(),
    count: reviews.length,
    reviews: reviews.map(normalizeReview),
  };

  await writeJson(OUTPUT_PATH, payload);
  console.log(`Saved ${payload.count} reviews to ${path.relative(ROOT, OUTPUT_PATH)}`);
}

function normalizeReview(review) {
  const reviewer = review.reviewer || {};
  const comment = review.comment || '';

  return {
    reviewId: review.reviewId || '',
    authorName: reviewer.displayName || '',
    authorPhotoUrl: reviewer.profilePhotoUrl || '',
    rating: ratingToNumber(review.starRating),
    starRating: review.starRating || '',
    comment,
    createTime: review.createTime || '',
    updateTime: review.updateTime || '',
    reviewReply: review.reviewReply || null,
  };
}

function ratingToNumber(starRating) {
  const ratings = {
    ONE: 1,
    TWO: 2,
    THREE: 3,
    FOUR: 4,
    FIVE: 5,
  };
  return ratings[starRating] || null;
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

async function writeJson(filePath, data) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function printHelp() {
  console.log(`
Usage:
  npm run google:reviews -- auth
  npm run google:reviews -- list
  npm run google:reviews -- fetch --parent "accounts/ACCOUNT_ID/locations/LOCATION_ID"

Env:
  GOOGLE_CLIENT_ID=...
  GOOGLE_CLIENT_SECRET=...
  GOOGLE_REDIRECT_URI=${REDIRECT_URI}

Output:
  ${path.relative(ROOT, OUTPUT_PATH)}
`);
}

await loadDotEnv();
configureFromEnv();

const args = parseArgs(process.argv.slice(2));
const command = args._[0];

try {
  if (command === 'auth') await runAuth();
  else if (command === 'list') await listAccountsAndLocations();
  else if (command === 'fetch') await runFetch(args);
  else printHelp();
} catch (error) {
  console.error(`\n${error.message}\n`);
  process.exitCode = 1;
}
