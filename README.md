# Daily AI & Finance Digest

A small MVP for collecting daily AI and finance headlines, translating them into Chinese, and emailing the final digest to yourself.

## Stack

- Next.js on Vercel
- Vercel Cron for daily scheduling
- RSS feeds as the news source
- OpenAI Responses API for selection, translation, and summarization
- Resend for email delivery

## What It Does

1. Pulls recent AI and finance headlines from RSS feeds.
2. Deduplicates and trims the candidate list.
3. Uses OpenAI to turn the candidates into a Chinese digest.
4. Emails the digest to your inbox.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the environment file:

```bash
cp .env.example .env.local
```

3. Fill in:

- `OPENAI_API_KEY`
- `RESEND_API_KEY`
- `RESEND_TO_EMAIL`
- `RESEND_FROM_EMAIL`
- `CRON_SECRET`

For the cheapest first version, you can use Resend's test domain and set:

```env
RESEND_FROM_EMAIL=AI Finance Brief <onboarding@resend.dev>
```

This only works when the recipient is your own Resend account email.

4. Start the app:

```bash
npm run dev
```

5. Test the digest route manually:

```bash
curl "http://localhost:3000/api/cron?dryRun=1"
```

To test with cron auth enabled:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" "http://localhost:3000/api/cron?dryRun=1"
```

To send a real email, remove `dryRun=1`.

## Deploy To Vercel

1. Push this project to GitHub.
2. Import the repo into Vercel.
3. Add the same environment variables in Vercel Project Settings.
4. Deploy.
5. Vercel Cron will call `/api/cron` based on `vercel.json`.

Current schedule:

```json
{
  "path": "/api/cron",
  "schedule": "0 14 * * *"
}
```

That means `14:00 UTC` every day. Adjust it later if you want a different reading time.

## Notes

- This MVP does not use a database.
- It relies on "recent enough" RSS items each run.
- If you later want stronger deduplication or archives, add a small database layer.
- The route returns JSON so you can inspect the digest before turning on email sends.
