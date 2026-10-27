/**
 * Cloudflare Pages Function: Reverse Proxy cho toàn bộ request /api/*
 * Định tuyến từ Cloudflare Pages sang Backend Server trên Cloud
 */
export async function onRequest(context: {
  request: Request;
  env: { BACKEND_API_URL?: string };
  params: { path: string[] };
}): Promise<Response> {
  const request = context.request;
  const url = new URL(request.url);

  // Lấy URL của Backend Cloud từ biến môi trường Cloudflare Pages (hoặc mặc định)
  const backendBase = (context.env.BACKEND_API_URL || '').replace(/\/$/, '');

  // Nếu chưa cấu hình BACKEND_API_URL, trả thông báo hướng dẫn rõ ràng
  if (!backendBase) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Cloudflare Pages chưa cấu hình biến môi trường BACKEND_API_URL. Vui lòng thêm BACKEND_API_URL trong Settings -> Environment Variables của Cloudflare Pages.',
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Chuyển tiếp request đến Backend Cloud
  const targetUrl = new URL(url.pathname + url.search, backendBase);

  // Sao chép headers và giữ nguyên client IP / auth headers
  const forwardHeaders = new Headers(request.headers);
  forwardHeaders.set('X-Forwarded-Host', url.host);
  forwardHeaders.set('X-Forwarded-Proto', url.protocol.replace(':', ''));

  const fetchOptions: RequestInit = {
    method: request.method,
    headers: forwardHeaders,
    redirect: 'follow',
  };

  if (!['GET', 'HEAD'].includes(request.method.toUpperCase())) {
    fetchOptions.body = request.body;
    // @ts-ignore - duplex is needed for streaming body in fetch
    fetchOptions.duplex = 'half';
  }

  try {
    const response = await fetch(targetUrl.toString(), fetchOptions);
    return response;
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        message: `Không thể kết nối tới Backend Cloud (${backendBase}): ${err.message}`,
      }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
