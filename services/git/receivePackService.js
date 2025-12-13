import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import Repo from "../../models/repo.model.js";

export const receivePackService = async (repoPath, req, res) => {
  try {
    // Extract repo name from path
    const pathParts = repoPath.split("/");
    const repoName = pathParts[pathParts.length - 1].replace(".git", "");

    console.log("1️⃣ Validating repo for push:", repoName);

    // Check if repo exists in database
    const repoExists = await Repo.findOne({ name: repoName });

    if (!repoExists) {
      console.log("❌ Repo not found in database");
      return res.status(404).send("Repository not found");
    }

    // Check if repo directory exists on filesystem
    const fullRepoPath = path.resolve(repoPath);
    if (!fs.existsSync(fullRepoPath)) {
      console.log("❌ Repo directory not found");
      return res.status(404).send("Repository not found on server");
    }

    // Check if it's a valid git repo
    const gitConfigPath = path.join(fullRepoPath, "config");
    if (!fs.existsSync(gitConfigPath)) {
      console.log("❌ Not a valid git repository");
      return res.status(400).send("Invalid git repository");
    }

    console.log("2️⃣ Repo validated, starting receive-pack (push)");

    res.setHeader("Content-Type", "application/x-git-receive-pack-result");
    res.setHeader("Cache-Control", "no-cache");

    // Spawn git-receive-pack process
    const gitProcess = spawn("git-receive-pack", ["--stateless-rpc", fullRepoPath]);

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