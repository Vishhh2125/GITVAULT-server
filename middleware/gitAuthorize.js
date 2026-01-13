import fs from "fs";
import path from "path";
import Repo from "../models/repo.model.js";

const gitAuthorize = async (req, res, next) => {
  try {
    const { username, repo } = req.params;
    const repoName = repo.replace(".git", "");
    const userId = req.user; // req.user is just the userId from gitAuth

    console.log(`🔍 Git authorization for repo ${username}/${repoName}`);
    console.log("Authenticated userId:", userId);

    // 1️⃣ Find repo in DB
    const repository = await Repo.findOne({ name: repoName })
      .populate("owner collaborators.user");

    if (!repository) {
      console.log("❌ Repo not found in DB");
      return res.status(404).send("Repository not found");
    }

    // 2️⃣ Validate repo folder exists
    const repoPath = path.resolve(`./repos/${username}/${repoName}.git`);
    if (!fs.existsSync(repoPath)) {
      console.log("❌ Repo folder missing");
      return res.status(404).send("Repository not found on server");
    }

    // 3️⃣ Compute user role + access (FIXED LOGIC)
    let role = "read";        // default role
    let hasAccess = false;    // 🔴 IMPORTANT FIX

    // Only check owner/collaborator if user is authenticated
    if (userId) {
      // OWNER CHECK
      if (repository.owner._id.toString() === userId._id.toString()) {
        role = "admin";
        hasAccess = true;
      } else {
        // FIND collaborator match
        const collab = repository.collaborators.find(
          (c) => c.user && c.user._id.toString() === userId._id.toString()
        );

        if (collab) {
          role = collab.role;   // "read", "write", "admin"
          hasAccess = true;
        }
      }
    }

    // PUBLIC repo → everyone has read access
    if (repository.visibility === "public") {
      hasAccess = true;
    }

    // 4️⃣ Detect Git operation
    const isPush = req.originalUrl.includes("git-receive-pack");
    const isFetch = req.originalUrl.includes("git-upload-pack");
    const isInfoRefs = req.originalUrl.includes("info/refs");

    console.log(`🧪 Operation → push:${isPush} fetch:${isFetch} info:${isInfoRefs}`);
    console.log("🎭 User role:", role, "| hasAccess:", hasAccess);

    // 5️⃣ Apply repository access rules (FIXED)

    // ❗ PRIVATE repo → must have access
    if (repository.visibility === "private" && !hasAccess) {
      return res.status(403).send("Private repository. Access denied.");
    }

    // ❗ PUSH → only 'write' or 'admin'
    if (isPush) {
      if (role !== "write" && role !== "admin") {
        return res.status(403).send("You do not have permission to push.");
      }
    }

    // Attach for next middleware/controller
    req.repository = repository;
    req.role = role;
    req.repoPath = repoPath;

    console.log("✅ Git authorization successful");
    next();

  } catch (err) {
    console.error("❌ Git authorization failed:", err);
    return res.status(500).send("Git authorization error");
  }
};

export default gitAuthorize;
