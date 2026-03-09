// This API is handled by the tkd-api Cloudflare Worker.
// See api/ directory for the Worker implementation.
export async function GET() {
  return new Response("Use tkd-api Worker", { status: 302 });
}
