
import User from '../models/user.model.js';
import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {ApiError} from "../utils/ApiError.js";  
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';




const registerUser= asyncHandler(async(req,res)=>{

    const {username,email,password} = req.body;

    if(!username) throw new ApiError(400,"Username is required");
    if(!email) throw new ApiError(400,"Email is required");
    if(!password) throw new ApiError(400,"Password is required");

    const existingUserByEmail=await User.findOne({email:email});
    if(existingUserByEmail) throw new ApiError(400,"Email is already registered");

    const existingUserByUsername=await User.findOne({username:username});
    if(existingUserByUsername) throw new ApiError(400,"Username is already taken");

    

    const newUser = await User.create({
        username,
        email,
        password
    })


    return res.status(201).json(new ApiResponse(201,[],"User registered successfully"));




})

const loginUser= asyncHandler(async(req,res)=>{

    const {email,password}= req.body;


    if(!email) throw new ApiError(400,"Email is required");
    if(!password) throw new ApiError(400,"password is required");


    const existedUser= await User.findOne({email:email})

    if(!existedUser) throw new ApiError(404,"User not found with this email");

    const passwordMatch= await existedUser.isPasswordCorrect(password);

    if(!passwordMatch) throw new ApiError(401,"Invalid password");

 const { password: removedPassword, ...safeUser } = existedUser.toObject();

    




        const accessToken = await existedUser.generateAccessToken();
        const refreshToken = await existedUser.generateRefreshToken();

        const options = {
        httpOnly: true,
        secure: false, // Set to true if using HTTPS

        }




           return res
            .status(200)
            
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200, 
                    {
                        user: safeUser, accessToken 
                    },
                    "User logged In Successfully"
                )
            )




})


export {registerUser,loginUser};