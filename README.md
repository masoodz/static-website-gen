# AI Site Generator (Frontend)

A modern React + Vite web application for generating AI-powered HTML websites. Users provide a prompt, and the app interfaces with AWS services to deliver a responsive, styled site — viewable in-browser and hosted on S3.

---

## 🚀 Features

- ✨ Prompt-driven AI HTML generation
- 🧠 Integration with AWS Bedrock (via backend)
- 🔐 Secure API Gateway calls using Cognito Identity Pools (IAM auth)
- 🧾 S3-hosted site previews with live iframe + public link
- 🧱 Fully typed with TypeScript
- 🎨 UI built with Material UI (MUI)

---

## 📦 Technologies Used

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [AWS SDK v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [Cognito Identity Pool](https://docs.aws.amazon.com/cognito/latest/developerguide/identity-pools.html)
- [Amazon S3](https://aws.amazon.com/s3/)
- [API Gateway + Lambda (IAM auth)](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-control-access-to-api.html)
- [Material UI](https://mui.com/)

---

## ⚙️ Setup Instructions

### 1. Clone the repo


### 2. Install dependencies

```bash
npm install
```

### 3. Set environment variables

Create a `.env` file in the root of the project with the following values:

```env
VITE_REGION=us-east-1
VITE_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod/generate
VITE_STATUS_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod/status
VITE_IDENTITY_POOL_ID=us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

> Make sure your Identity Pool allows unauthenticated access and is attached to a role with `execute-api:Invoke` permissions.

### 4. Start the app locally

```bash
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173)

---

## 🧪 Testing

- After clicking **Generate**, the app securely signs and sends a prompt to the backend.
- It polls the status endpoint every 10 seconds until the HTML is ready.
- The response S3 URL is rendered via an iframe and shared as a public link.

---

## 📁 Project Structure

```
src/
├── App.tsx               # Main React component
├── awsClient.ts          # AWS request signing and API call logic
├── main.tsx              # React DOM rendering entry point
├── vite-env.d.ts         # Vite's type definitions
└── styles/, components/  # (optional) UI or style files
```

---

## 🔐 Security Notes

- All API calls are signed via AWS Signature v4 using Cognito Identity Pool credentials.
- Only users with access to the Identity Pool (unauth or auth) can invoke the API Gateway endpoint.
- S3 bucket serves public HTML files after generation, optionally customizable with private access + presigned URLs.

---

## 🛠️ Build for Production

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

---

## 📜 License

MIT