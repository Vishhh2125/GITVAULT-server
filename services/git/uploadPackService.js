import { spawn } from "child_process";

export const uploadPackService = async (repoPath, req, res) => {
  try {
    console.log("1️⃣ Starting upload-pack (fetch)");
    console.log(`2️⃣ Fetching from: ${repoPath}`);

    // All validation done by gitAuthorize middleware!
    // req.repository ✅ exists in DB
    // req.repoPath ✅ exists on disk & is valid git repo
    // req.role ✅ user has read access (checked in middleware)

    // Set required Git headers
    res.setHeader("Content-Type", "application/x-git-upload-pack-result");
    res.setHeader("Cache-Control", "no-cache");

    // Spawn native Git upload-pack process
    const gitProcess = spawn("git", [
      "upload-pack",
      "--stateless-rpc",
      repoPath,
    ]);

    // Pipe request body → git-upload-pack stdin
    req.pipe(gitProcess.stdin);

    // Pipe git-upload-pack stdout → client response
    gitProcess.stdout.pipe(res);

    // Log Git stderr (debug)
    gitProcess.stderr.on("data", (data) => {
      console.error("upload-pack stderr:", data.toString());
    });

    gitProcess.on("error", (error) => {
      console.error("Failed to start git-upload-pack:", error);
      if (!res.headersSent) {
        res.status(500).send("Git operation failed");
      }
    });

    // Close response when done
    gitProcess.on("close", (code) => {
      console.log(`3️⃣ Upload-pack completed with code ${code}`);
      if (code !== 0 && !res.headersSent) {
        res.status(500).send("Git fetch failed");
      }
    });
  } catch (error) {
    console.error("❌ Upload-Pack Error:", error);
    if (!res.headersSent) {
      res.status(500).send("Upload-pack failed");
    }
  }
};