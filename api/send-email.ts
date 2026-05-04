import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // POST 요청만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, subject, html } = req.body as { 
      to: string;
      subject: string;
      html: string;
    };

    if (!to || !subject || !html) {
      return res.status(400).json({ error: 'Missing required fields (to, subject, html)' });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('RESEND_API_KEY is not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
      from: 'ARA Support <support@mail.arakorean.com>',
      to: [to],
      subject: subject,
      html: html,
      replyTo: 'koreara25@gmail.com'
    });

    if (error) {
      console.error('Resend API error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ data });
  } catch (error) {
    console.error('Send email error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
