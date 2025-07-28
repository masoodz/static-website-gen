import { useState, useRef, useEffect } from "react";
import {
  Container,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Paper,
  Stack,
} from "@mui/material";
import { invokeBedrockAPI, checkStatus, generateSessionId } from "./awsClient";

const defaultPrompt =
  "A modern, responsive website for a freelance graphic designer showcasing portfolio, services, and a contact form";

export default function App() {
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [preview, setPreview] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const pollUntilReady = async (id: string) => {
    setStatus("Waiting for HTML...");
    pollingRef.current = setInterval(async () => {
      const html = await checkStatus(id);
      if (html) {
        clearInterval(pollingRef.current!);
        setPreview(html);
        setStatus("Generated successfully");
        setLoading(false);
      } else {
        console.log("Still pending...");
      }
    }, 20000);
  };

  const generateSite = async () => {
  const id = generateSessionId();
  setStatus("Submitting to Bedrock...");
  setLoading(true);
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


  const downloadHTML = () => {
    const blob = new Blob([preview], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "website.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

        <Button variant="outlined" onClick={downloadHTML} disabled={!preview}>
          Download HTML
        </Button>
      </Stack>

      <Typography variant="body1" sx={{ mb: 2 }}>
        Status: {status}
      </Typography>

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
        {preview ? (
          <iframe
            title="Website Preview"
            srcDoc={preview}
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
