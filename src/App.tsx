import { useState, useRef, useEffect } from "react";
import {
  Container,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Paper,
  Stack,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { invokeBedrockAPI, checkStatus, generateSessionId } from "./awsClient";

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

  const pollingRef = useRef<number | null>(null);

  const pollUntilReady = async (id: string) => {
    setStatus("Waiting for HTML...");
    pollingRef.current = setInterval(async () => {
      const result = await checkStatus(id);
      if (result) {
        clearInterval(pollingRef.current!);
        const res = await fetch(result);
        const text = await res.text();
        setHtml(text);
        setPreview(result);
        setStatus("Generated successfully");
        setLoading(false);
      } else {
        console.log("Still pending...");
      }
    }, 5000); // 5-second interval
  };

  const generateSite = async () => {
    const id = sessionId || generateSessionId(); // reuse session if exists
    setSessionId(id);
    setStatus("Submitting to Bedrock...");
    setLoading(true);
    setHtml("");
    setPreview("");
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

      <Typography variant="body1" sx={{ mb: 1 }}>
        Status: {status}
      </Typography>

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
