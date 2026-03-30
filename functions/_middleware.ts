export async function onRequest(context: EventContext<any, string, Record<string, unknown>>) {
  // Set security headers
  const response = await context.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "0");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return response;
}
