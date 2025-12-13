import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import Repo from "../../models/repo.model.js";

export const uploadPackService = async (repoPath, req, res) => {
  try {
    // Extract repo name from path - same method as infoRefsService
    const pathParts = repoPath.split("/");
    const repoName = pathParts[pathParts.length - 1].replace(".git", "");

    console.log("1️⃣ Validating repo:", repoName);

    // 1️⃣ Validate DB repo exists
    const repoExists = await Repo.findOne({ name: repoName });
    if (!repoExists) {
      console.log("❌ Repo not found in DB");
      return res.status(404).send("Repository not found");
    }

    // 2️⃣ Resolve full path
    const fullRepoPath = path.resolve(repoPath);
    
    // 3️⃣ Validate directory
    if (!fs.existsSync(fullRepoPath)) {
      console.log("❌ Repo directory missing");
      return res.status(404).send("Repository not found on server");
    }

    // 4️⃣ Check git config
    const configPath = path.join(fullRepoPath, "config");
    if (!fs.existsSync(configPath)) {
      console.log("❌ Missing git config, invalid repo");
      return res.status(400).send("Invalid git repository");
    }

    console.log("2️⃣ Repo validated, starting upload-pack");

    // 5️⃣ Required Git headers
    res.setHeader("Content-Type", "application/x-git-upload-pack-result");
    res.setHeader("Cache-Control", "no-cache");

    // 6️⃣ Spawn native Git upload-pack process
    const child = spawn("git", [
      "upload-pack",
      "--stateless-rpc",
      fullRepoPath,
    ]);

    // 7️⃣ Pipe request body → git-upload-pack stdin
    req.pipe(child.stdin);

    // 8️⃣ Pipe git-upload-pack stdout → client response
    child.stdout.pipe(res);

    // 9️⃣ Log Git stderr (debug)
    child.stderr.on("data", (data) => {
      console.log("❗ upload-pack stderr:", data.toString());
    });

    // 🔟 Close response when done
    child.on("close", (code) => {
      console.log(`🔚 upload-pack exited with code ${code}`);
      res.end();
    });

  } catch (error) {
    console.error("❌ Upload-Pack Error:", error);
    if (!res.headersSent) {
      res.status(500).send("Upload-pack failed");
    }
  }
};