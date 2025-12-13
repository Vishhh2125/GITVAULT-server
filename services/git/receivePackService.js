import { spawn } from "child_process";

export const receivePackService = async (repoPath, req, res) => {
  try {
    console.log("1️⃣ Starting receive-pack (push)");
    console.log(`2️⃣ Pushing to: ${repoPath}`);

    // All validation done by gitAuthorize middleware!
    // req.repository ✅ exists in DB
    // req.repoPath ✅ exists on disk & is valid git repo
    // req.role ✅ user has write/admin access (checked in middleware)

    res.setHeader("Content-Type", "application/x-git-receive-pack-result");
    res.setHeader("Cache-Control", "no-cache");

    // Spawn git-receive-pack process
    const gitProcess = spawn("git-receive-pack", ["--stateless-rpc", repoPath]);

    // Pipe request body to git process stdin
    req.pipe(gitProcess.stdin);

    // Pipe git process stdout to response
    gitProcess.stdout.pipe(res);

    // Handle errors
    gitProcess.stderr.on("data", (data) => {
      console.error("git-receive-pack stderr:", data.toString());
    });

    gitProcess.on("error", (error) => {
      console.error("Failed to start git-receive-pack:", error);
      if (!res.headersSent) {
        res.status(500).send("Git operation failed");
      }
    });

    gitProcess.on("close", (code) => {
      console.log(`3️⃣ Receive-pack completed with code ${code}`);
      if (code !== 0 && !res.headersSent) {
        res.status(500).send("Git push failed");
      }
    });
  } catch (error) {
    console.error("❌ Receive-Pack Error:", error);
    if (!res.headersSent) {
      res.status(500).send("Receive-pack failed");
    }
  }
};