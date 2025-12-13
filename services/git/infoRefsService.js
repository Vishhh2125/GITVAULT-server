import * as git from "isomorphic-git";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import Repo from "../../models/repo.model.js";

export const infoRefsService = async (repoPath, service, req, res) => {
  try {
    console.log("1️⃣ Starting infoRefsService");
    console.log(`2️⃣ Serving refs for: ${repoPath}`);

    // All validation done by gitAuthorize middleware!
    // req.repository ✅ exists in DB
    // req.repoPath ✅ exists on disk
    // req.role ✅ user has access

    res.setHeader("Content-Type", `application/x-${service}-advertisement`);
    res.setHeader("Cache-Control", "no-cache");

    const writePacket = (line) =>
      res.write((line.length + 4).toString(16).padStart(4, "0") + line);

    writePacket(`# service=${service}\n`);
    res.write("0000");

    // Use git-upload-pack --advertise-refs to list refs
    const gitProcess = spawn("git", ["upload-pack", "--advertise-refs", repoPath]);

    gitProcess.stdout.on("data", (data) => {
      res.write(data);
    });

    gitProcess.stderr.on("data", (data) => {
      console.error("Git error:", data.toString());
    });

    gitProcess.on("close", (code) => {
      console.log(`3️⃣ Git process exited with code ${code}`);
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
