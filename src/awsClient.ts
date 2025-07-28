import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";
import { SignatureV4 } from "@aws-sdk/signature-v4";
import { Sha256 } from "@aws-crypto/sha256-js";
import { HttpRequest } from "@aws-sdk/protocol-http";

const REGION = "us-east-1";
const API_URL = "https://12qmaamafi.execute-api.us-east-1.amazonaws.com/prod/generate";
const STATUS_API_URL = "https://12qmaamafi.execute-api.us-east-1.amazonaws.com/prod/status";
const IDENTITY_POOL_ID = "us-east-1:18da943d-b375-43ac-b23a-15d5b0bd878b";

const credentials = fromCognitoIdentityPool({
  identityPoolId: IDENTITY_POOL_ID,
  clientConfig: { region: REGION },
});

const signer = new SignatureV4({
  credentials,
  service: "execute-api",
  region: REGION,
  sha256: Sha256,
});

export const invokeBedrockAPI = async (prompt: string, sessionId: string): Promise<Response> => {
  const url = new URL(API_URL);

  const request = new HttpRequest({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      host: url.host,
    },
    body: JSON.stringify({ prompt, sessionId }),
    hostname: url.hostname,
    path: url.pathname,
    protocol: url.protocol,
  });

  const signedRequest = await signer.sign(request);
  console.log("Signed headers:", signedRequest.headers);

  return fetch(API_URL, {
    method: "POST",
    headers: signedRequest.headers,
    body: request.body,
  });
};

export const checkStatus = async (sessionId: string): Promise<string | null> => {
  const fullUrl = `${STATUS_API_URL}?sessionId=${encodeURIComponent(sessionId)}`;
  const url = new URL(fullUrl);

  const request = new HttpRequest({
    method: "GET",
    headers: {
      host: url.host,
    },
    hostname: url.hostname,
    path: url.pathname,
    query: { sessionId },
    protocol: url.protocol,
  });

  const signedRequest = await signer.sign(request);

  const response = await fetch(fullUrl, {
    method: "GET",
    headers: signedRequest.headers,
  });

  if (!response.ok) {
    console.error("Failed to fetch status:", response.status, await response.text());
    return null;
  }

  const data = await response.json();
  return data.url ?? null;
};
export const generateSessionId = (): string =>
  `web-${Math.random().toString(36).substring(2, 10)}`;
