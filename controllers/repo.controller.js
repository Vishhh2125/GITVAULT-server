import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import Repository from "../models/repo.model.js";
import User from "../models/user.model.js";
import fs from 'fs';
import { execSync } from "child_process";

const createRepo = asyncHandler(async (req, res) => {
    const { description, name, visibility } = req.body;

    if (!name) throw new ApiError(400, "Repository name is required");

    const username = req.user.username;
    const basePath = `./repos/${username}`;
    const repoPath = `${basePath}/${name}.git`;

    // Step 1: Check DB uniqueness
    const exists = await Repository.findOne({ owner: req.user._id, name });
    if (exists) throw new ApiError(400, "Repository with this name already exists");

    // Step 2: Create parent folder safely
    fs.mkdirSync(basePath, { recursive: true });

    // Step 3: Check again if repo folder exists
    if (fs.existsSync(repoPath)) {
        throw new ApiError(400, "Repository folder already exists on disk");
    }

    // Step 4: Create bare repo folder
    try {
        fs.mkdirSync(repoPath);  // no recursive here because .git is the repo
    } catch (err) {
        throw new ApiError(500, "Failed to create repository folder");
    }

    // Step 5: Initialize git repo
    try {
        execSync(`git init --bare`, { cwd: repoPath });
    } catch (err) {
        // rollback folder
        fs.rmSync(repoPath, { recursive: true, force: true });
        throw new ApiError(500, "Failed to initialize git repository");
    }

    // Step 6: Create MongoDB entry
    let newRepo;
    try {
        newRepo = await Repository.create({
            name,
            description,
            owner: req.user._id,
            visibility: visibility || "public",
            url: repoPath,
        });
    } catch (err) {
        // rollback folder
        fs.rmSync(repoPath, { recursive: true, force: true });
        throw new ApiError(500, "Failed to save repository metadata");
    }

    // Step 7: Success
    return res
        .status(201)
        .json(new ApiResponse(201, newRepo, "Repository created successfully"));
});




const getRepoByUser= asyncHandler(async(req,res)=>{
    const userId = req.user._id;

    // Find repos where user is the owner
    const ownedRepos = await Repository.find({ owner: userId })
        .populate("owner", "username email")
        .populate("collaborators.user", "username email");

    // Find repos where user is a collaborator - use $elemMatch for precise matching
    const collaboratorRepos = await Repository.find({
        collaborators: {
            $elemMatch: {
                user: userId
            }
        }
    })
    .populate("owner", "username email")
    .populate("collaborators.user", "username email");

    // Filter collaborator repos to ensure user is actually in the array (double-check)
    const validCollaboratorRepos = collaboratorRepos.filter(repo => {
        // Make sure user is not the owner (to avoid duplicates)
        const ownerId = repo.owner._id ? repo.owner._id.toString() : repo.owner.toString();
        if (ownerId === userId.toString()) {
            return false; // Skip if user is owner (already in ownedRepos)
        }
        
        // Verify user is actually a collaborator
        return repo.collaborators && repo.collaborators.some(collab => {
            if (!collab || !collab.user) return false;
            const collabUserId = collab.user._id ? collab.user._id.toString() : collab.user.toString();
            return collabUserId === userId.toString();
        });
    });

    // Combine both arrays
    const allRepos = [...ownedRepos, ...validCollaboratorRepos];

    if(allRepos.length === 0) {
        return res.status(200).json(new ApiResponse(200, [], "No repositories found for this user"));
    }

    return res.status(200).json(new ApiResponse(200, allRepos, "Repositories fetched successfully for the user"));
})

const getAllRepos = asyncHandler(async(req, res) => {
    const repos = await Repository.find();
    if(repos.length === 0) return res.status(200).json(new ApiResponse(200, [], "No repositories found"));

    return res.status(200).json(new ApiResponse(200, repos, "Repositories fetched successfully"));
});


const getRepoInfo = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id) throw new ApiError(400, "Repository id is required");

    const repo = await Repository.findById(id)
        .populate("owner", "username email")
        .populate("collaborators.user", "username email");

    if (!repo) throw new ApiError(404, "Repository not found");

    const collab = repo.collaborators
        .filter(instance => instance.user) // filter out null/undefined users
        .map((instance) => ({
            user: instance.user._id,
            username: instance.user.username,
            role: instance.role
        }));

    const data = {
        _id: repo._id,
        name: repo.name,
        url: repo.url,
        description: repo.description,
        visibility: repo.visibility,
        owner: {
            _id: repo.owner._id,
            username: repo.owner.username,
            email: repo.owner.email
        },
        collaborators: collab,
        createdAt: repo.createdAt,
        updatedAt: repo.updatedAt
    };

    res.status(200).json(new ApiResponse(200, data, "Repository info fetched successfully"));
});

const updateRepo = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { description, visibility } = req.body;
    const userId = req.user._id;

    if (!id) throw new ApiError(400, "Repository id is required");

    const repo = await Repository.findById(id);
    if (!repo) throw new ApiError(404, "Repository not found");

    // Check if user is owner
    if (repo.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "Only repository owner can update settings");
    }

    // Update fields
    if (description !== undefined) repo.description = description;
    if (visibility !== undefined) {
        if (!["public", "private"].includes(visibility)) {
            throw new ApiError(400, "Visibility must be 'public' or 'private'");
        }
        repo.visibility = visibility;
    }

    await repo.save();

    return res.status(200).json(
        new ApiResponse(200, repo, "Repository updated successfully")
    );
});

const deleteRepo = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    if (!id) throw new ApiError(400, "Repository id is required");

    const repo = await Repository.findById(id);
    if (!repo) throw new ApiError(404, "Repository not found");

    // Check if user is owner
    if (repo.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "Only repository owner can delete repository");
    }

    // Delete repository folder
    const repoPath = repo.url;
    if (fs.existsSync(repoPath)) {
        try {
            fs.rmSync(repoPath, { recursive: true, force: true });
        } catch (err) {
            console.error("Error deleting repo folder:", err);
            // Continue with DB deletion even if folder deletion fails
        }
    }

    // Delete from database
    await Repository.findByIdAndDelete(id);

    return res.status(200).json(
        new ApiResponse(200, {}, "Repository deleted successfully")
    );
});


// const getReposByUsername = asyncHandler(async(req, res) => {
//     const { username } = req.params;

//     if(!username) throw new ApiError(400, "Username is required");

//     const repos = await Repository.find({ owner: username });

//     if(repos.length === 0) return res.status(200).json(new ApiResponse(200, [], "No repositories found for this user"));

//     return res.status(200).json(new ApiResponse(200, repos, "Repositories fetched successfully for the user"));
// });



export { createRepo, getAllRepos, getRepoByUser, getRepoInfo, updateRepo, deleteRepo };