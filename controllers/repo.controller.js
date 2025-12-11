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
    

    const repos = await Repository.find({owner:req.user._id});

    if(repos.length ===0) return res.status(200).json(new ApiResponse(200,[],"No repositories found for this user"));

    return res.status(200).json(new ApiResponse(200,repos,"Repositories fetched successfully for the user"));
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
        .populate('owner', 'username')
        .populate('collaborators.user', 'username');

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
        owner: repo.owner._id,
        ownername: repo.owner.username,
        collaborators: collab,
        createdAt: repo.createdAt,
        updatedAt: repo.updatedAt
    };

    res.status(200).json(new ApiResponse(200, data, "Repository info fetched successfully"));
});


// const getReposByUsername = asyncHandler(async(req, res) => {
//     const { username } = req.params;

//     if(!username) throw new ApiError(400, "Username is required");

//     const repos = await Repository.find({ owner: username });

//     if(repos.length === 0) return res.status(200).json(new ApiResponse(200, [], "No repositories found for this user"));

//     return res.status(200).json(new ApiResponse(200, repos, "Repositories fetched successfully for the user"));
// });



export { createRepo, getAllRepos, getRepoByUser,getRepoInfo };