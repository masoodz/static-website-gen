import { useState, useRef, useEffect } from "react";
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  CircularProgress,
  LinearProgress,
  Paper,
  Stack,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { invokeBedrockAPI, checkStatus, generateSessionId } from "./awsClient";
import type { GenerationStatus } from "./awsClient";

const defaultPrompt =
  "A modern, responsive website for a freelance graphic designer showcasing portfolio, services, and a contact form";

export default function App() {
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [preview, setPreview] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [html, setHtml] = useState("");
  const [viewRaw, setViewRaw] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [progress, setProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pollingRef = useRef<number | null>(null);
  const heroImageUrlRef = useRef<string | null>(null);

  const pollUntilReady = async (id: string) => {
    setStatus("Waiting for HTML...");
    pollingRef.current = setInterval(async () => {
      const data: GenerationStatus | null = await checkStatus(id);
      if (!data) {
        console.log("Still pending...");
        return;
      }

      // Handle error stage
      if (data.stage === 'error') {
        setError(data.message || 'Generation failed');
        setStatus("Generation failed");
        setLoading(false);
        clearInterval(pollingRef.current!);
        return;
      }

      // Handle complete — new shape
      if (data.stage === 'complete' && data.siteUrl) {
        const res = await fetch(data.siteUrl);
        const text = await res.text();
        setHtml(text);
        setPreview(data.siteUrl);
        setProgress(100);
        setStatusMessage('Your site is ready');
        setStatus("Generated successfully");
        setLoading(false);
        clearInterval(pollingRef.current!);
        return;
      }

      // Handle legacy complete shape (backwards compatibility)
      if (data.status === 'ready' && data.url) {
        const res = await fetch(data.url);
        const text = await res.text();
        setHtml(text);
        setPreview(data.url);
        setProgress(100);
        setStatus("Generated successfully");
        setLoading(false);
        clearInterval(pollingRef.current!);
        return;
      }

      // Handle intermediate progress stages
      if (data.progress) {
        setProgress(data.progress);
      }
      if (data.message) {
        setStatusMessage(data.message);
      }
      if (data.heroImageUrl && !heroImageUrlRef.current) {
        heroImageUrlRef.current = data.heroImageUrl;
        setHeroImageUrl(data.heroImageUrl);
      }
    }, 5000);
  };

  const generateSite = async () => {
    const id = sessionId || generateSessionId(); // reuse session if exists
    setSessionId(id);
    setStatus("Submitting to Bedrock...");
    setLoading(true);
    setHtml("");
    setPreview("");
    setProgress(0);
    setStatusMessage("");
    setHeroImageUrl(null);
    heroImageUrlRef.current = null;
    setError(null);
    try {
      const res = await invokeBedrockAPI(prompt, id);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Generation failed");
      setStatus("Generation started...");
      pollUntilReady(id);
    } catch (err: any) {
      console.error(err);
      setStatus("Generation failed");
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        AI Website Generator
      </Typography>

      <TextField
        fullWidth
        multiline
        minRows={4}
        label="Prompt"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        sx={{ mb: 2 }}
      />

      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Button
          variant="contained"
          onClick={generateSite}
          disabled={loading || !prompt.trim()}
        >
          {loading ? (
            <CircularProgress size={24} />
          ) : sessionId ? (
            "Update Site"
          ) : (
            "Generate"
          )}
        </Button>
      </Stack>

      {sessionId && (
        <Typography variant="caption" sx={{ mb: 1 }}>
          Session ID: {sessionId}
        </Typography>
      )}

      {preview && (
        <>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Deployed URL:{" "}
            <a href={preview} target="_blank" rel="noopener noreferrer">
              {preview}
            </a>
          </Typography>
        </>
      )}

      <FormControlLabel
        control={
          <Switch
            checked={viewRaw}
            onChange={() => setViewRaw((prev) => !prev)}
            disabled={!html && status !== "Generated successfully"}
          />
        }
        label="View Raw HTML"
      />

      {error && (
        <Typography variant="body1" color="error" sx={{ mb: 1 }}>
          Error: {error}
        </Typography>
      )}

      {!loading && status && (
        <Typography variant="body1" sx={{ mb: 1 }}>
          Status: {status}
        </Typography>
      )}

      {loading && (
        <Box sx={{ mt: 1, mb: 2, width: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <LinearProgress
              variant={progress > 0 ? 'determinate' : 'indeterminate'}
              value={progress}
              sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
            />
            {progress > 0 && (
              <Typography variant="caption" sx={{ minWidth: 35 }}>
                {progress}%
              </Typography>
            )}
          </Box>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2, minHeight: 20 }}
          >
            {statusMessage || 'Starting generation...'}
          </Typography>
          {heroImageUrl && (
            <Box sx={{ mt: 2 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mb: 1 }}
              >
                Hero image preview
              </Typography>
              <Box
                component="img"
                src={heroImageUrl}
                alt="Generated hero image"
                sx={{
                  width: '100%',
                  borderRadius: 2,
                  maxHeight: 300,
                  objectFit: 'cover',
                }}
              />
            </Box>
          )}
        </Box>
      )}

      <Paper
        variant="outlined"
        sx={{
          width: "100%",
          height: "calc(100vh - 300px)",
          p: 1,
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
          bgcolor: "#fafafa",
        }}
      >
        {preview ? (
          viewRaw ? (
            <pre
              style={{
                whiteSpace: "pre-wrap",
                overflow: "auto",
                fontSize: "0.85rem",
                padding: "8px",
                margin: 0,
                flex: 1,
              }}
            >
              {html}
            </pre>
          ) : (
            <iframe
              title="Website Preview"
              src={preview}
              style={{ width: "100%", height: "100%", border: "none" }}
            />
          )
        ) : (
          <Typography
            variant="body1"
            color="textSecondary"
            sx={{ fontStyle: "italic" }}
          >
            Website preview will appear here after generation
          </Typography>
        )}
      </Paper>
    </Container>
  );
}
