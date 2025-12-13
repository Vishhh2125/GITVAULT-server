import * as git from "isomorphic-git";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import Repo from "../../models/repo.model.js";

export const infoRefsService = async (repoPath, service,req, res) => {
  try {
    console.log("1️⃣ Starting infoRefsService");
    
    // Extract repo name from path
    const pathParts = repoPath.split("/");
    const repoName = pathParts[pathParts.length - 1].replace(".git", "");
    const username = pathParts[pathParts.length - 2];

    console.log(`2️⃣ Parsed: username=${username}, repo=${repoName}`);

    // Check if repo exists in database
    const repoExists = await Repo.findOne({
      name: repoName,
    });

    if (!repoExists) {
      console.log(`❌ Repo not found`);
      return res.status(404).send(`Repository ${username}/${repoName} not found`);
    }

    // Check if repo directory exists on filesystem
    const fullRepoPath = path.resolve(repoPath);
    console.log(`3️⃣ Checking filesystem: ${fullRepoPath}`);
    
    if (!fs.existsSync(fullRepoPath)) {
      console.log(`❌ Directory not found`);
      return res.status(404).send("Repository not found on server");
    }

    console.log(`4️⃣ Repo found, serving refs using child_process`);

    res.setHeader("Content-Type", `application/x-${service}-advertisement`);
    res.setHeader("Cache-Control", "no-cache");

    const writePacket = (line) =>
      res.write((line.length + 4).toString(16).padStart(4, "0") + line);

    writePacket(`# service=${service}\n`);
    res.write("0000");

    // Use git-upload-pack --advertise-refs to list refs
    const gitProcess = spawn("git", ["upload-pack", "--advertise-refs", fullRepoPath]);

    gitProcess.stdout.on("data", (data) => {
      res.write(data);
    });

    gitProcess.stderr.on("data", (data) => {
      console.error("Git error:", data.toString());
    });

    gitProcess.on("close", (code) => {
      console.log(`5️⃣ Git process exited with code ${code}`);
      res.end();
    });

    gitProcess.on("error", (error) => {
      console.error("❌ Spawn error:", error);
      if (!res.headersSent) {
        res.status(500).send("Git error");
      }
    });

  } catch (error) {
    console.error("❌ Error:", error.message);
    if (!res.headersSent) {
      res.status(500).send("Git server error");
    }
  }
};
