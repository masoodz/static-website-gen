import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";
import { SignatureV4 } from "@aws-sdk/signature-v4";
import { Sha256 } from "@aws-crypto/sha256-js";
import { HttpRequest } from "@aws-sdk/protocol-http";
import { fetch } from "@whatwg-node/fetch";


const REGION = "us-east-1";
const API_URL = import.meta.env.VITE_API_URL!;
const IDENTITY_POOL_ID = import.meta.env.VITE_IDENTITY_POOL_ID!;

const credentials = fromCognitoIdentityPool({
  identityPoolId: IDENTITY_POOL_ID,
  clientConfig: { region: REGION }
});

export const invokeBedrockAPI = async (prompt: string): Promise<Response> => {
  const creds = await credentials();
  const signer = new SignatureV4({
    credentials: creds,
    service: "execute-api",
    region: REGION,
    sha256: Sha256,
  });

  const request = new HttpRequest({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      host: new URL(API_URL).host,
    },
    body: JSON.stringify({
      prompt,
      sessionId: "web-guest",
    }),
    hostname: new URL(API_URL).host,
    path: new URL(API_URL).pathname,
  });

  const signedRequest = await signer.sign(request);

  const res = await fetch(API_URL, {
    method: "POST",
    headers: signedRequest.headers,
    body: request.body,
  });

  return res;
};



export const uploadToS3 = async (htmlContent: string) => {
  const filename = "websites/web-guest/index.html";

  const response = await fetch(import.meta.env.VITE_PRESIGN_API!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ key: filename }),
  });

  if (!response.ok) throw new Error("Failed to get pre-signed URL");

  const { url } = await response.json();

  const upload = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "text/html",
    },
    body: htmlContent,
  });

  if (!upload.ok) throw new Error("Upload failed");

  return url.split("?")[0]; // Return clean S3 URL
};
