import * as git from "isomorphic-git";
import fs from "fs";
import path from "path";
import Repo from "../../models/repo.model.js";

export const infoRefsService = async (repoPath, service, req, res) => {
  try {

    
    
    // Extract username and repo name from path
    const pathParts = repoPath.split("/");
    const repoName = pathParts[pathParts.length - 1].replace(".git", "");
    const username = pathParts[pathParts.length - 2];


    // Check if repo exists in database
    const repoExists = await Repo.findOne({
      name: repoName,
    //   owner: username,
    });


    if (!repoExists) {
      console.log(`❌ Repo not found`);
      return res.status(404).send(`Repository ${username}/${repoName} not found`);
    }

    // Check if repo directory exists on filesystem
    const fullRepoPath = path.resolve(repoPath);
    console.log(`5️⃣ Checking filesystem: ${fullRepoPath}`);
    
    if (!fs.existsSync(fullRepoPath)) {
      console.log(`❌ Directory not found`);
      return res.status(404).send("Repository not found on server");
    }

    console.log(`6️⃣ Repo found, serving refs`);

    res.setHeader("Content-Type", `application/x-${service}-advertisement`);
    res.setHeader("Cache-Control", "no-cache");

    const writePacket = (line) =>
      res.write((line.length + 4).toString(16).padStart(4, "0") + line);

    console.log("7️⃣ Writing service header");
    writePacket(`# service=${service}\n`);
    res.write("0000");

    // List refs
    try {
      console.log("8️⃣ Listing refs...");
      const refs = await git.listRefs({
        fs,
        gitdir: fullRepoPath,
      });

      console.log(`9️⃣ Found ${refs.length} refs`);

      for (const ref of refs) {
        console.log(`📝 Processing ref: ${ref}`);
        const oid = await git.resolveRef({ fs, gitdir: fullRepoPath, ref });
        writePacket(`${oid} ${ref}\n`);
      }
    } catch (refError) {
      console.log("⚠️ Error in refs:", refError.message);
    }

    console.log("🔟 Ending response");
    res.end("0000");
  } catch (error) {
    console.error("❌ Outer catch error:", error.message);
    console.error("Stack trace:", error.stack);
    
    if (!res.headersSent) {
      res.status(500).send("Git server error");
    }
  }
};
