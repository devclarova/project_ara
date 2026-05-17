import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SITE_URL = 'https://arakorean.com';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function normalizeUrl(url?: string | null) {
  if (!url) return `${SITE_URL}/images/font_slogan_logo.png?v=2`;
  return url.startsWith('http') ? url : `${SITE_URL}${url}`;
}

function getFirstImage(imageUrl: unknown) {
  if (!imageUrl) return null;

  if (Array.isArray(imageUrl)) {
    return typeof imageUrl[0] === 'string' ? imageUrl[0] : null;
  }

  if (typeof imageUrl === 'string') {
    try {
      const parsed = JSON.parse(imageUrl);
      if (Array.isArray(parsed)) return parsed[0] ?? null;
    } catch {
      return imageUrl;
    }

    return imageUrl;
  }

  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = String(req.query.id ?? '');

  const fallbackTitle = 'ARA 커뮤니티';
  const fallbackDescription = 'ARA 커뮤니티에서 공유된 게시글입니다.';
  const fallbackImage = `${SITE_URL}/images/font_slogan_logo.png?v=2`;

  if (!id || !supabase) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(
      renderHtml({
        title: fallbackTitle,
        description: fallbackDescription,
        image: fallbackImage,
        shareUrl: `${SITE_URL}/share/sns/${id}`,
        redirectUrl: `${SITE_URL}/sns/${id}`,
      }),
    );
    return;
  }

  const { data, error } = await supabase
    .from('tweets')
    .select(
      `
      id,
      content,
      image_url,
      author_id,
      profiles:author_id (
        nickname,
        avatar_url
      )
    `,
    )
    .eq('id', id)
    .maybeSingle();

  if (error || !data) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(
      renderHtml({
        title: fallbackTitle,
        description: fallbackDescription,
        image: fallbackImage,
        shareUrl: `${SITE_URL}/share/sns/${id}`,
        redirectUrl: `${SITE_URL}/sns/${id}`,
      }),
    );
    return;
  }

  const profile = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;
  const nickname = profile?.nickname || 'ARA 사용자';

  const title = `${nickname}님의 게시글 | ARA 커뮤니티`;
  const description = 'ARA 커뮤니티에서 공유된 게시글입니다.';
  const image = normalizeUrl(getFirstImage(data.image_url));
  const shareUrl = `${SITE_URL}/share/sns/${data.id}`;
  const redirectUrl = `${SITE_URL}/sns/${data.id}`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  // 카톡/페북 캐시가 너무 오래 남지 않게 짧게 둠
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

  res.status(200).send(
    renderHtml({
      title,
      description,
      image,
      shareUrl,
      redirectUrl,
    }),
  );
}

function renderHtml({
  title,
  description,
  image,
  shareUrl,
  redirectUrl,
}: {
  title: string;
  description: string;
  image: string;
  shareUrl: string;
  redirectUrl: string;
}) {
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeImage = escapeHtml(image);
  const safeShareUrl = escapeHtml(shareUrl);
  const safeRedirectUrl = escapeHtml(redirectUrl);

  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <title>${safeTitle}</title>

    <meta name="description" content="${safeDescription}" />

    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDescription}" />
    <meta property="og:image" content="${safeImage}" />
    <meta property="og:url" content="${safeShareUrl}" />
    <meta property="og:type" content="article" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDescription}" />
    <meta name="twitter:image" content="${safeImage}" />

    <link rel="canonical" href="${safeShareUrl}" />

    <meta http-equiv="refresh" content="0;url=${safeRedirectUrl}" />
    <script>
      window.location.replace(${JSON.stringify(safeRedirectUrl)});
    </script>
  </head>
  <body>
    <p>
      ARA로 이동 중입니다.
      <a href="${safeRedirectUrl}">바로가기</a>
    </p>
  </body>
</html>`;
}
