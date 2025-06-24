import { useState } from 'react';
import {
  Container,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Paper,
  Stack,
} from '@mui/material';
import { uploadToS3, invokeBedrockAPI } from './awsClient';

const defaultPrompt =
  'A modern, responsive website for a freelance graphic designer showcasing portfolio, services, and a contact form';

export default function App() {
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [preview, setPreview] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const generateSite = async () => {
    setStatus('Generating...');
    setLoading(true);
    try {
      const res = await invokeBedrockAPI(prompt);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Generation failed');
      setPreview(data.html);
      setStatus('Generated successfully');
    } catch (err: any) {
      console.error(err);
      setStatus('Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeploy = async () => {
    setStatus('Uploading...');
    try {
      const location = await uploadToS3(preview);
      setStatus(`Deployed: ${location}`);
    } catch (err: any) {
      console.error(err);
      setStatus('Upload failed');
    }
  };

  const downloadHTML = () => {
    const blob = new Blob([preview], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'website.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        AI Website Generator by MAZE
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
          {loading ? <CircularProgress size={24} /> : 'Generate'}
        </Button>
        <Button
          variant="outlined"
          onClick={handleDeploy}
          disabled={!preview}
        >
          Deploy to S3
        </Button>
        <Button
          variant="outlined"
          onClick={downloadHTML}
          disabled={!preview}
        >
          Download HTML
        </Button>
      </Stack>

      <Typography variant="body1" sx={{ mb: 2 }}>
        Status: {status}
      </Typography>

      <Paper
        variant="outlined"
        sx={{
          height: '500px',
          p: 1,
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          bgcolor: '#fafafa',
        }}
      >
        {preview ? (
          <iframe
            title="Website Preview"
            srcDoc={preview}
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        ) : (
          <Typography
            variant="body1"
            color="textSecondary"
            sx={{ fontStyle: 'italic' }}
          >
            Website preview will appear here after generation
          </Typography>
        )}
      </Paper>
    </Container>
  );
}
