import type { APIRoute } from 'astro';
import { Resend } from 'resend';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
	const apiKey = import.meta.env.RESEND_API_KEY;
	const toEmail = import.meta.env.CONTACT_EMAIL ?? 'jan@janrosell.com';
	const fromEmail = import.meta.env.RESEND_FROM ?? 'onboarding@resend.dev';

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

	const resend = new Resend(apiKey);

	const { error } = await resend.emails.send({
		from: fromEmail,
		to: toEmail,
		replyTo: email,
		subject: `Contact form: ${name}`,
		html: `
			<p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
			<p><strong>Message:</strong></p>
			<p>${escapeHtml(message).replace(/\n/g, '<br />')}</p>
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
