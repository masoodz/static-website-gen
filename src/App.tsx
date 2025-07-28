import { useState, useRef, useEffect } from "react";
import {
  Container,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Paper,
  Stack,
  Link,
} from "@mui/material";
import { invokeBedrockAPI, checkStatus, generateSessionId } from "./awsClient";

const defaultPrompt =
  "A modern, responsive website for a freelance graphic designer showcasing portfolio, services, and a contact form";

export default function App() {
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [s3Url, setS3Url] = useState("");
  const pollingRef = useRef<number | null>(null);

  const pollUntilReady = async (id: string) => {
    setStatus("Waiting for HTML...");
    pollingRef.current = setInterval(async () => {
      const url = await checkStatus(id);
      if (url) {
        clearInterval(pollingRef.current!);
        setS3Url(url);
        setStatus("Generated successfully");
        setLoading(false);
      } else {
        console.log("Still pending...");
      }
    }, 10000);
  };

  const generateSite = async () => {
    const id = generateSessionId();
    setStatus("Submitting to Bedrock...");
    setLoading(true);
    setS3Url("");
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
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        AI Website Generator by Maze
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
          {loading ? <CircularProgress size={24} /> : "Generate"}
        </Button>
      </Stack>

      <Typography variant="body1" sx={{ mb: 1 }}>
        Status: {status}
      </Typography>

      {s3Url && (
        <Typography variant="body2" sx={{ mb: 2 }}>
          Public Link:{" "}
          <Link href={s3Url} target="_blank" rel="noopener noreferrer">
            {s3Url}
          </Link>
        </Typography>
      )}

      <Paper
        variant="outlined"
        sx={{
          height: "500px",
          p: 1,
          overflow: "hidden",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          bgcolor: "#fafafa",
        }}
      >
        {s3Url ? (
          <iframe
            title="Website Preview"
            src={s3Url}
            style={{ width: "100%", height: "100%", border: "none" }}
          />
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
