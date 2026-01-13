import Repository from "../models/repo.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import User from "../models/user.model.js";



// Helper function to check if user is owner or admin
const checkAdminOrOwner = (repo, userId) => {
    // Check if user is owner
    if (repo.owner.toString() === userId.toString()) {
        return true;
    }
    
    // Check if user is admin collaborator
    const collab = repo.collaborators.find(
        (c) => c.user && c.user.toString() === userId.toString() && c.role === "admin"
    );
    
    return !!collab;
};

const addCollaborator = asyncHandler(async (req, res) => {
    const { email, role } = req.body;
    const { repoId } = req.params;
    const userId = req.user._id;

    if (!email) throw new ApiError(400, "Email is required");
    if (!role) throw new ApiError(400, "Role is required");
    if (!["read", "write", "admin"].includes(role)) {
        throw new ApiError(400, "Invalid role. Must be 'read', 'write', or 'admin'");
    }

    // 1️⃣ Find repo and check permissions
    const repo = await Repository.findById(repoId);
    if (!repo) throw new ApiError(404, "Repository not found");

    // Check if user is owner or admin
    if (!checkAdminOrOwner(repo, userId)) {
        throw new ApiError(403, "Only repository owner or admin can add collaborators");
    }

    // 2️⃣ Find the user by email
    const user = await User.findOne({ email });
    if (!user) throw new ApiError(404, "User with this email not found");

    // 3️⃣ Check if user is already a collaborator
    const alreadyExists = repo.collaborators.some(
        (c) => c.user && c.user.toString() === user._id.toString()
    );

    if (alreadyExists) throw new ApiError(400, "User is already a collaborator");

    // 4️⃣ Check if trying to add owner as collaborator
    if (repo.owner.toString() === user._id.toString()) {
        throw new ApiError(400, "Repository owner cannot be added as a collaborator");
    }

    // 5️⃣ Push collaborator to repo.collaborators
    await Repository.updateOne(
        { _id: repoId },
        {
            $push: {
                collaborators: {
                    user: user._id,
                    role: role
                }
            }
        }
    );

    // 6️⃣ Also update the user.collaboratorRepos
    await User.updateOne(
        { _id: user._id },
        {
            $push: {
                collaboratorRepos: {
                    repoId: repo._id,
                    repoName: repo.name,
                    role: role
                }
            }
        }
    );

    return res.status(200).json(
        new ApiResponse(200, { email, role }, "Collaborator added successfully")
    );
});






const getAllUserCollaboratorRepos = asyncHandler(async(req,res)=>{


    const userId = req.user._id;


    if(!userId) throw new ApiError(400,"User id is required");


    const user = await User.findById(userId);

    if(!user) throw new ApiError(400,"Invalid user");

    const data = user.collaboratorRepos;


    return res.status(200).json(new ApiResponse(200,data,"User collaborator repos fetched successfully"));
})




const updateCollaboratorRole = asyncHandler(async (req, res) => {
    const { repoId, collaboratorId } = req.params;
    const { role } = req.body;
    const userId = req.user._id;

    if (!role) throw new ApiError(400, "Role is required");
    if (!["read", "write", "admin"].includes(role)) {
        throw new ApiError(400, "Invalid role. Must be 'read', 'write', or 'admin'");
    }

    // 1️⃣ Find repo and check permissions
    const repo = await Repository.findById(repoId);
    if (!repo) throw new ApiError(404, "Repository not found");

    // Check if user is owner or admin
    if (!checkAdminOrOwner(repo, userId)) {
        throw new ApiError(403, "Only repository owner or admin can change collaborator roles");
    }

    // 2️⃣ Find the collaborator
    const collaborator = repo.collaborators.id(collaboratorId);
    if (!collaborator) {
        throw new ApiError(404, "Collaborator not found");
    }

    // 3️⃣ Update role in repository
    collaborator.role = role;
    await repo.save();

    // 4️⃣ Update role in user.collaboratorRepos
    await User.updateOne(
        { _id: collaborator.user, "collaboratorRepos.repoId": repo._id },
        {
            $set: {
                "collaboratorRepos.$.role": role
            }
        }
    );

    return res.status(200).json(
        new ApiResponse(200, { role }, "Collaborator role updated successfully")
    );
});

const deleteCollaborator = asyncHandler(async (req, res) => {
    const { repoId, collaboratorId } = req.params;
    const userId = req.user._id;

    // 1️⃣ Find repo and check permissions
    const repo = await Repository.findById(repoId);
    if (!repo) throw new ApiError(404, "Repository not found");

    // Check if user is owner or admin
    if (!checkAdminOrOwner(repo, userId)) {
        throw new ApiError(403, "Only repository owner or admin can remove collaborators");
    }

    // 2️⃣ Find the collaborator
    const collaborator = repo.collaborators.id(collaboratorId);
    if (!collaborator) {
        throw new ApiError(404, "Collaborator not found");
    }

    const collaboratorUserId = collaborator.user;

    // 3️⃣ Remove collaborator from repository
    repo.collaborators.pull(collaboratorId);
    await repo.save();

    // 4️⃣ Remove from user.collaboratorRepos
    await User.updateOne(
        { _id: collaboratorUserId },
        {
            $pull: {
                collaboratorRepos: {
                    repoId: repo._id
                }
            }
        }
    );

    return res.status(200).json(
        new ApiResponse(200, {}, "Collaborator removed successfully")
    );
});

const getCollaboratorsDetails = asyncHandler(async(req, res) => {
    const { repoId } = req.params;
    const userId = req.user._id;

    if (!repoId) throw new ApiError(400, "Repository id is required");

    const repo = await Repository.findById(repoId)
        .populate('collaborators.user', 'username email')
        .populate('owner', 'username email _id');
    
    if (!repo) throw new ApiError(404, "Repository not found");

    // Check if user has access (owner, collaborator, or public repo)
    const isOwner = repo.owner._id.toString() === userId.toString();
    const isCollaborator = repo.collaborators.some(
        (c) => c.user && c.user._id.toString() === userId.toString()
    );

    if (!isOwner && !isCollaborator && repo.visibility === "private") {
        throw new ApiError(403, "You do not have access to this repository");
    }

    // Return collaborators with owner info for permission checks
    return res.status(200).json(
        new ApiResponse(200, {
            collaborators: repo.collaborators,
            owner: repo.owner,
            isOwner: isOwner,
            isAdmin: isOwner || repo.collaborators.some(
                (c) => c.user && c.user._id.toString() === userId.toString() && c.role === "admin"
            )
        }, "Collaborators details fetched successfully")
    );
});

export { addCollaborator, getAllUserCollaboratorRepos, getCollaboratorsDetails, updateCollaboratorRole, deleteCollaborator };