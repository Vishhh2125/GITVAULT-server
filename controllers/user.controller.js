
import User from '../models/user.model.js';
import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {ApiError} from "../utils/ApiError.js";  
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';




const registerUser= asyncHandler(async(req,res)=>{

    const {username,email,password} = req.body;
    console.log(req.body);
    

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

const refreshAccessToken=asyncHandler(async(req,res)=>{
     const refreshtoken= req.cookies?.refreshToken;

     if(!refreshtoken) throw new ApiError(401,"Refresh token not found, please login again");
    

     try {

        const dedecoded =jwt.verify(refreshtoken,process.env.REFRESH_TOKEN_SECRET);

        const existedUser=await User.findById(dedecoded._id);

        if(!existedUser) throw new ApiError(401,"User not found, invalid refresh token");

        const accessToken= existedUser.generateAccessToken();
        const newRefreshToken= existedUser.generateRefreshToken();

        const options = {
        httpOnly: true,
        secure: false, // Set to true if using HTTPS

        }


        res.status(200)
        .cookie("refreshToken", newRefreshToken, options)
        .json(new ApiResponse(200, { accessToken }, "Access token refreshed successfully"));
        
     } catch (error) {

        throw new ApiError(401,"Invalid or expired refresh token, please login again");
        
     }

        
})

const loginUser= asyncHandler(async(req,res)=>{

    const {email,password}= req.body;
     console.log(req.body);

    if(!email) throw new ApiError(400,"Email is required");
    if(!password) throw new ApiError(400,"password is required");


    const existedUser= await User.findOne({email:email})

    if(!existedUser) throw new ApiError(400,"User not found with this email");

    const passwordMatch= await existedUser.isPasswordCorrect(password);

    if(!passwordMatch) throw new ApiError(400,"Invalid password");

 const { password: removedPassword, collaboratorRepos,...safeUser } = existedUser.toObject();

    




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

const logoutUser= asyncHandler(async(req,res)=>{

    res.clearCookie("refreshToken");    
    return res.status(200).json(new ApiResponse(200,[],"User logged out successfully"));

});

const changePassword = asyncHandler(async(req,res)=>{
    const {oldPassword, newPassword} = req.body;
    const userId = req.user._id;

    if(!oldPassword) throw new ApiError(400,"Current password is required");
    if(!newPassword) throw new ApiError(400,"New password is required");
    if(newPassword.length < 6) throw new ApiError(400,"New password must be at least 6 characters");

    const user = await User.findById(userId);
    if(!user) throw new ApiError(404,"User not found");

    const passwordMatch = await user.isPasswordCorrect(oldPassword);
    if(!passwordMatch) throw new ApiError(401,"Current password is incorrect");

    user.password = newPassword;
    await user.save({validateBeforeSave: false});

    return res.status(200).json(new ApiResponse(200,{},"Password changed successfully"));
});

export {registerUser,loginUser,logoutUser,refreshAccessToken,changePassword};