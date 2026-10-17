import { appendFile, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import type { APIRoute } from 'astro';

export const prerender = false;

const logFile = path.join(process.cwd(), 'data', 'visits.jsonl');
const hits = new Map<string, { count: number; reset: number }>();
const types = new Set(['enter', 'scroll', 'click', 'leave']);

function clean(value: unknown, max: number): string {
	if (typeof value !== 'string') return '';
	return value.replace(/\s+/g, ' ').trim().slice(0, max);
}

function num(value: unknown, min: number, max: number): number {
	if (typeof value !== 'number' || !Number.isFinite(value)) return min;
	return Math.max(min, Math.min(max, Math.round(value)));
}

function referrerOf(value: unknown): string {
	const raw = clean(value, 300);
	if (!raw) return '';
	try {
		const url = new URL(raw);
		if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
		return `${url.origin}${url.pathname}`.slice(0, 300);
	} catch {
		return raw.startsWith('/') ? raw.split('?')[0] : '';
	}
}

function hrefOf(value: unknown): string {
	const raw = clean(value, 200);
	if (!raw || raw.toLowerCase().startsWith('javascript:')) return '';
	if (raw.startsWith('/') || raw.startsWith('#')) return raw.split('?')[0];
	try {
		const url = new URL(raw);
		if (url.protocol === 'mailto:') return 'mailto';
		if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
		return `${url.origin}${url.pathname}`.slice(0, 200);
	} catch {
		return '';
	}
}

export const POST: APIRoute = async ({ request }) => {
	let text = '';
	try {
		text = await request.text();
	} catch {
		return new Response(null, { status: 400 });
	}
	if (text.length > 12000) return new Response(null, { status: 413 });

	let body: { sid?: unknown; path?: unknown; events?: unknown };
	try {
		body = JSON.parse(text);
	} catch {
		return new Response(null, { status: 400 });
	}

	const sid = clean(body.sid, 16);
	const page = clean(body.path, 200).split('?')[0];
	if (!/^[a-z0-9]{8,16}$/.test(sid) || !page.startsWith('/') || page.includes('..')) {
		return new Response(null, { status: 400 });
	}

	const now = Date.now();
	const bucket = hits.get(sid);
	if (!bucket || now > bucket.reset) hits.set(sid, { count: 1, reset: now + 60_000 });
	else if (bucket.count > 80) return new Response(null, { status: 429 });
	else bucket.count += 1;

	if (!Array.isArray(body.events) || body.events.length === 0 || body.events.length > 20) {
		return new Response(null, { status: 400 });
	}

	const events: Record<string, string | number>[] = [];
	for (const raw of body.events) {
		if (!raw || typeof raw !== 'object') continue;
		const type = clean((raw as { type?: unknown }).type, 16);
		if (!types.has(type)) continue;
		const event: Record<string, string | number> = { type };
		const t = (raw as { t?: unknown }).t;
		if (typeof t === 'number' && Number.isFinite(t)) event.t = Math.round(t);
		if (type === 'enter') {
			const referrer = referrerOf((raw as { referrer?: unknown }).referrer);
			if (referrer) event.referrer = referrer;
			event.w = num((raw as { w?: unknown }).w, 0, 10000);
			event.h = num((raw as { h?: unknown }).h, 0, 10000);
		} else if (type === 'scroll' || type === 'leave') {
			event.depth = num((raw as { depth?: unknown }).depth, 0, 100);
			if (type === 'leave') event.ms = num((raw as { ms?: unknown }).ms, 0, 86_400_000);
		} else {
			const target = clean((raw as { target?: unknown }).target, 80);
			const href = hrefOf((raw as { href?: unknown }).href);
			const kind = clean((raw as { kind?: unknown }).kind, 16);
			if (target) event.target = target;
			if (href) event.href = href;
			if (kind) event.kind = kind;
		}
		events.push(event);
	}
	if (!events.length) return new Response(null, { status: 204 });

	try {
		const info = await stat(logFile).catch(() => null);
		if (info && info.size > 20 * 1024 * 1024) return new Response(null, { status: 429 });
		await mkdir(path.dirname(logFile), { recursive: true });
		await appendFile(
			logFile,
			JSON.stringify({ sid, path: page, received: new Date().toISOString(), events }) + '\n',
			'utf8',
		);
	} catch {
		return new Response(null, { status: 500 });
	}

	return new Response(null, { status: 204 });
};
