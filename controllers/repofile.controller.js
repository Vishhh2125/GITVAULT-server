import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {ApiError} from "../utils/ApiError.js";  
import Repo from '../models/repo.model.js';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import { promisify as fsPromisify } from 'util';

// Fix for __dirname in ES6 modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const execAsync = promisify(exec);
const accessAsync = fsPromisify(fs.access);

// Get shell for Windows compatibility
const getShell = () => {
    if (process.platform === 'win32') {
        return process.env.COMSPEC || 'cmd.exe';
    }
    return '/bin/sh';
};






const getRepoTree = asyncHandler(async (req, res) => {
  const { repoId } = req.params;
  const { path: dirPath = "/", ref = "main" } = req.query;

  console.log(
    `Getting repo tree for repoId: ${repoId}, path: ${dirPath}, ref: ${ref}`
  );

  // 1️⃣ Fetch repo from DB with populated owner
  const repo = await Repo.findById(repoId).populate("owner", "username");
  if (!repo) {
    throw new ApiError(404, "Repository not found");
  }

  // 2️⃣ Check if user is owner or collaborator
  const ownerId = repo.owner._id ? repo.owner._id.toString() : repo.owner.toString();
  const isOwner = ownerId === req.user._id.toString();
  const isCollaborator = repo.collaborators && repo.collaborators.some(
    collab => collab.user && collab.user.toString() === req.user._id.toString()
  );

  if (!isOwner && !isCollaborator) {
    // Check visibility for public repos
    if (repo.visibility !== "public") {
      throw new ApiError(403, "You do not have access to this repository");
    }
  }

  // 3️⃣ Resolve repo path on disk (BARE repo) - use owner's username, not current user's
  if (!repo.owner.username) {
    throw new ApiError(500, "Unable to determine repository owner username");
  }
  const repoPath = path.resolve(
    "./repos",
    repo.owner.username,
    `${repo.name}.git`
  );

  try {
    await accessAsync(repoPath, fs.constants.F_OK);
  } catch {
    throw new ApiError(
      404,
      `Repository directory not found at ${repoPath}`
    );
  }

  // 4️⃣ 🔴 CRITICAL FIX — normalize Git path
  let normalizedPath = dirPath;

  // Remove leading slash (Git paths are repo-relative)
  if (normalizedPath.startsWith("/")) {
    normalizedPath = normalizedPath.slice(1);
  }

  // Remove trailing slash (except root)
  if (normalizedPath.endsWith("/") && normalizedPath.length > 1) {
    normalizedPath = normalizedPath.slice(0, -1);
  }

  // Build git ls-tree target
  const treeTarget = normalizedPath
    ? `${ref}:${normalizedPath}`
    : ref;

  const command = `git --git-dir="${repoPath}" ls-tree ${treeTarget}`;

  console.log("Running command:", command);

  // 5️⃣ Execute git command
  let stdout;
  try {
    ({ stdout } = await execAsync(command, {
      maxBuffer: 10 * 1024 * 1024,
    }));
  } catch (err) {
    if (err.message.includes("Not a valid object name")) {
      return res.status(200).json(
        new ApiResponse(200, {
          path: dirPath,
          ref,
          items: [],
        }, "Repository is empty or branch does not exist")
      );
    }

    if (err.message.includes("not a tree object")) {
      throw new ApiError(400, "Path is not a directory");
    }

    throw new ApiError(500, err.message);
  }

  // 6️⃣ Parse git output
  const items = stdout
    .trim()
    .split("\n")
    .filter(Boolean)
    .map(line => {
      const [meta, name] = line.split("\t");
      const [mode, type, hash] = meta.split(" ");

      return {
        name,
        type: type === "tree" ? "directory" : "file",
        mode,
        hash,
      };
    });

  // 7️⃣ Respond
  return res.status(200).json(
    new ApiResponse(200, {
      path: dirPath,
      ref,
      items,
    }, "Repository tree retrieved successfully")
  );
});

// export default getRepoTree;


 
const getFileContent = asyncHandler(async (req, res) => {
    const { repoId } = req.params;
    const { path: filePath, ref = 'main' } = req.query; // Changed default from 'HEAD' to 'main'

    // Validate required parameter
    if (!filePath) {
        throw new ApiError(400, 'File path is required');
    }

    // Verify repository exists and user has access
    const repo = await Repo.findById(repoId).populate("owner", "username");
    if (!repo) {
        throw new ApiError(404, 'Repository not found');
    }

    // Check if user is owner or collaborator
    const ownerId = repo.owner._id ? repo.owner._id.toString() : repo.owner.toString();
    const isOwner = ownerId === req.user._id.toString();
    const isCollaborator = repo.collaborators && repo.collaborators.some(
        collab => collab.user && collab.user.toString() === req.user._id.toString()
    );

    if (!isOwner && !isCollaborator) {
        // Check visibility for public repos
        if (repo.visibility !== "public") {
            throw new ApiError(403, 'You do not have access to this repository');
        }
    }

    // Construct the repository path on disk (bare repos have .git extension) - use owner's username
    if (!repo.owner.username) {
        throw new ApiError(500, "Unable to determine repository owner username");
    }
    const repoPath = path.join(__dirname, '..', 'repos', repo.owner.username, `${repo.name}.git`);

    // Check if repository directory exists
    try {
        await accessAsync(repoPath, fs.constants.F_OK);
    } catch (error) {
        const normalizedPath = path.normalize(repoPath);
        throw new ApiError(404, `Repository directory not found at: ${normalizedPath}. Please ensure the repository is initialized.`);
    }

    // 🔴 NORMALIZE FILE PATH - Remove leading slash for Git
    let normalizedFilePath = filePath;
    if (normalizedFilePath.startsWith("/")) {
        normalizedFilePath = normalizedFilePath.slice(1);
    }

    console.log(`Getting file content: ${normalizedFilePath} from ref: ${ref}`);

    // Construct git show command for bare repository
    const command = `git --git-dir="${repoPath}" show ${ref}:${normalizedFilePath}`;
    
    console.log("Running command:", command);

    try {
        const { stdout, stderr } = await execAsync(command, {
            maxBuffer: 10 * 1024 * 1024, // 10MB buffer
            encoding: 'utf8',
            shell: getShell(),
            env: { ...process.env, PATH: process.env.PATH }
        });

        if (stderr && !stderr.includes('warning')) {
            console.error("Git stderr:", stderr);
        }

        return res.status(200).json(
            new ApiResponse(200, {
                path: filePath,
                ref: ref,
                content: stdout
            }, 'File content retrieved successfully')
        );

    } catch (error) {
        console.error("Git command error:", error.message);
        
        // Handle ENOENT errors (file/directory not found)
        if (error.code === 'ENOENT' || error.message.includes('ENOENT')) {
            throw new ApiError(500, 'Git command failed. Please ensure Git is installed and available in PATH.');
        }
        // Handle specific git errors
        if (error.message.includes('Not a valid object name')) {
            throw new ApiError(404, 'Branch or reference not found');
        }
        if (error.message.includes('does not exist') || error.message.includes('Path') || error.message.includes('path')) {
            throw new ApiError(404, `File not found: ${normalizedFilePath}`);
        }
        if (error.message.includes('fatal: not a git repository')) {
            throw new ApiError(500, 'Repository not initialized');
        }
        
        throw new ApiError(500, error.message || 'Failed to retrieve file content');
    }
});

export {
    getRepoTree,
    getFileContent
};
