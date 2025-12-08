import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import Repository from "../models/repo.model.js";




const  getAllRepos= asyncHandler(async(req,res)=>{


    const repos = await Repository.find();
    if(repos.length===0) return res.status(200).json(new ApiResponse(200,[], "No repositories found"));

    return res.status(200).json(new ApiResponse(200,repos,"Repositories fetched successfully"));
})


const getReposByUsername= asyncHandler(async(req,res)=>{

    const {username} = req.params;

    if(!username)  throw new ApiError(400,"Username is required");

    const repos= await Repository.find({owner:username});

    if(repos.length===0) return res.status(200).json(new ApiResponse(200,[], "No repositories found for this user"));

    return res.status(200).json(new ApiResponse(200,repos,"Repositories fetched successfully for the user"));
})






export {getAllRepos};