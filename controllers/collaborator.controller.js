import Repository from "../models/repo.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import User from "../models/user.model.js";



const addCollaborator = asyncHandler(async (req, res) => {
    const { username, role } = req.body;
    const { repoId } = req.params;

    if (!username) throw new ApiError(400, "Username is required");
    if (!role) throw new ApiError(400, "Role is required");

    // 1️⃣ Find the user by username
    const user = await User.findOne({ username });
    if (!user) throw new ApiError(400, "Invalid user");

    // 2️⃣ Find repo
    const repo = await Repository.findById(repoId);
    if (!repo) throw new ApiError(400, "Invalid repository");

    // 3️⃣ Check if user is already a collaborator
    const alreadyExists = repo.collaborators.some(
        (c) => c.user && c.user.toString() === user._id.toString()
    );

    if (alreadyExists) throw new ApiError(400, "User already added as collaborator");

    // 4️⃣ Push collaborator to repo.collaborators
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

    // 5️⃣ Also update the user.collaboratorRepos
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
        new ApiResponse(200, { username, role }, "Collaborator added successfully")
    );
});

export { addCollaborator };