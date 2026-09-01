import type { APIRoute } from 'astro';

export const prerender = false;

function getEnv(name: string, fallback = ''): string {
	return process.env[name] ?? import.meta.env[name] ?? fallback;
}

export const POST: APIRoute = async ({ request }) => {
	const apiKey = getEnv('RESEND_API_KEY');
	const toEmail = getEnv('CONTACT_EMAIL', 'jan@janrosell.com');
	const fromEmail = getEnv('RESEND_FROM', 'onboarding@resend.dev');

	if (!apiKey) {
		return new Response(JSON.stringify({ error: 'Email service not configured.' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	let body: { name?: string; email?: string; message?: string };

	try {
		body = await request.json();
	} catch {
		return new Response(JSON.stringify({ error: 'Invalid request body.' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	const name = body.name?.trim();
	const email = body.email?.trim();
	const message = body.message?.trim();

	if (!name || !email || !message) {
		return new Response(JSON.stringify({ error: 'Name, email, and message are required.' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		return new Response(JSON.stringify({ error: 'Please enter a valid email address.' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	const { Resend } = await import('resend');
	const resend = new Resend(apiKey);

	const safeName = escapeHtml(name);
	const safeEmail = escapeHtml(email);
	const safeMessage = escapeHtml(message).replace(/\n/g, '<br />');

	const { error } = await resend.emails.send({
		from: fromEmail,
		to: toEmail,
		replyTo: email,
		subject: `[${email}] Contact from ${name}`,
		text: `From: ${name} <${email}>\n\n${message}`,
		html: `
			<p style="font-size:18px;margin:0 0 16px;">
				<strong>Reply to:</strong>
				<a href="mailto:${safeEmail}">${safeEmail}</a>
			</p>
			<p style="margin:0 0 8px;"><strong>Name:</strong> ${safeName}</p>
			<p style="margin:0 0 16px;"><strong>Email:</strong> ${safeEmail}</p>
			<p style="margin:0 0 8px;"><strong>Message:</strong></p>
			<p style="margin:0;">${safeMessage}</p>
		`,
	});

	if (error) {
		console.error('Resend error:', error);
		return new Response(JSON.stringify({ error: 'Failed to send message. Please try again later.' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	return new Response(JSON.stringify({ success: true }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
};

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}
