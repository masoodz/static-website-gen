import { useState } from "react";
import { uploadToS3, invokeBedrockAPI } from "./awsClient";

function App() {
  const [prompt, setPrompt] = useState("");
  const [preview, setPreview] = useState("");
  const [status, setStatus] = useState("");

  const generateSite = async () => {
    setStatus("Generating...");
    try {
      const res = await invokeBedrockAPI(prompt);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Generation failed");
      setPreview(data.html);
      setStatus("Generated successfully");
    } catch (err) {
      console.error(err);
      setStatus("Generation failed");
    }
  };

  const handleDeploy = async () => {
    try {
      setStatus("Uploading...");
      const location = await uploadToS3(preview);
      setStatus(`Deployed: ${location}`);
    } catch (err) {
      console.error(err);
      setStatus("Upload failed");
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h2>AI Website Generator</h2>
      <textarea
        placeholder="e.g. A modern, responsive website for a freelance graphic designer showcasing portfolio, services, and a contact form"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={4}
        style={{ width: "100%", padding: "0.5rem", fontSize: "1rem" }}
      />
      <br />
      <button onClick={generateSite} style={{ marginRight: "1rem", marginTop: "1rem" }}>
        Generate
      </button>
      <button onClick={handleDeploy} disabled={!preview} style={{ marginTop: "1rem" }}>
        Deploy to S3
      </button>
      <p>Status: {status}</p>

      {!preview ? (
        <div
          style={{
            width: "100%",
            height: "500px",
            marginTop: "1rem",
            border: "1px solid #ccc",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#fafafa",
            color: "#777",
            fontStyle: "italic",
          }}
        >
          Website preview will appear here after generation
        </div>
      ) : (
        <iframe
          title="Preview"
          srcDoc={preview}
          style={{
            width: "100%",
            height: "500px",
            marginTop: "1rem",
            border: "1px solid #ccc",
          }}
        />
      )}
    </div>
  );
}

export default App;
