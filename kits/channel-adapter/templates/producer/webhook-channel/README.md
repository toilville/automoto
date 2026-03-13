# __CHANNEL_DISPLAY_NAME__ Webhook Channel

The simplest Agent channel — a plain webhook receiver. No streaming, no Bot Framework. Just HTTP POST in, JSON response out.

## Quick Start

```bash
npm install
npm run dev
curl -X POST http://localhost:3100/webhook \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello", "sourceId": "test"}'
```

## When to Use This Template

- Your integration is a simple HTTP webhook (Slack, GitHub, custom callback)
- You don't need streaming or Bot Framework Activity model
- You want the fastest path to a working channel

## Setup Checklist

- [ ] Replace placeholder types in `src/adapter.ts` with your webhook's payload shape
- [ ] Add channel to `ChannelType` and register in `factory.ts`
- [ ] Set `WEBHOOK_SECRET` for signature verification (if applicable)
- [ ] Update the webhook endpoint field extraction in `server.ts`
