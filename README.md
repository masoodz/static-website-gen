# AI Site Generator — Frontend

React + Vite frontend for the AI site generator.
Submit a prompt, watch the agent work in real time,
get a live hosted URL.

Live demo: https://sitegendemo.zubairmasood.com


---

## What it does

Sends a natural language prompt to a serverless
backend, then polls for progress as an agentic
Claude pipeline structures the page, generates
a hero image with Nova Canvas, and deploys the
final HTML to S3.

The UI reflects real backend state as it happens:
- Page structure designed (25%)
- Hero image preview appears (60%)
- Full site loads in iframe (100%)

Progress is real, not simulated. Each stage
corresponds to an actual tool call completing
in the backend agentic loop.

---

## Stack

React, Vite, TypeScript, Material UI,
AWS SDK v3 (SigV4 request signing),
Cognito Identity Pool (unauthenticated IAM auth)

---

## How the polling works

After submitting a prompt the app polls
/status?sessionId=xxx every 3 seconds.

The backend returns one of five states:
```typescript
{ "status": "pending" }
// status.json not written yet, generation starting

{ "stage": "structure_created", "progress": 25,
  "message": "Page structure designed" }
// Claude called create_html_structure tool

{ "stage": "image_generated", "progress": 60,
  "heroImageUrl": "https://...hero.png" }
// Claude called generate_image, Nova Canvas complete

{ "stage": "complete", "progress": 100,
  "siteUrl": "https://...site.html" }
// Claude called deploy_to_s3, site is live

{ "stage": "error", "progress": 0,
  "message": "specific error" }
// Agent loop failed, error written to S3
```

The hero image URL arrives at 60% and renders
as a preview before the full site is ready.
This gives the user real AI output about 25
seconds into a 100 second generation.

---

## Security

All API calls are signed with AWS Signature v4
using temporary credentials from Cognito Identity
Pool. No API keys exist in the frontend code.

CORS on the backend is permissive because security
is enforced at the IAM auth layer, not the CORS
layer. This is intentional.

---

## Running locally
```bash
npm install
```

Create .env:
```
VITE_REGION=us-east-1
VITE_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod/generate
VITE_STATUS_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod/status
VITE_IDENTITY_POOL_ID=us-east-1:xxxxxxxx-xxxx-xxxx-xxxxxxxxxxxx
```

Your Cognito Identity Pool must allow unauthenticated
access with a role that has execute-api:Invoke
permission.
```bash
npm run dev
```

Visit http://localhost:5173

---

## Deploying

Deployed via AWS Amplify connected to this repo.
Push to main triggers a build automatically.
```bash
npm run build   # output in dist/
npm run preview # preview production build locally
```

---

## What I would do differently at production scale

- Add user authentication so generations are
  tied to accounts with history
- WebSocket connection instead of polling so
  progress arrives without repeated HTTP calls
- Stream Claude's thinking text during generation
  so users see the reasoning, not just the stages
- Rate limiting per user to manage Bedrock costs
- The polling interval is 3 seconds which is
  reasonable but still creates up to 3 seconds
  of lag between a stage completing and the UI
  updating

---

## License

MIT
