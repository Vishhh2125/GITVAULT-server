import * as git from "isomorphic-git";
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

    await git.receivePack({
      fs,
      gitdir: fullRepoPath,
      request: req,     // data from Git CLI (push data)
      response: res,    // data from server to Git CLI
    });

    res.end();
  } catch (error) {
    console.error("❌ Receive-Pack Error:", error);
    if (!res.headersSent) {
      res.status(500).send("Receive-pack failed");
    }
  }
};