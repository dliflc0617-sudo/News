export function isAuthorizedCronRequest(request: Request) {
  const expected = process.env.CRON_SECRET;

  if (!expected) {
    return true;
  }

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${expected}`;
}
