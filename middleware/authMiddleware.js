import jwt from 'jsonwebtoken';
import { asyncHandler } from '../utils/asyncHandler.js';
import User from '../models/user.model.js';
import { ApiError } from "../utils/ApiError.js";






const verifyJWT= asyncHandler(async(req,res,next)=>{
   try {

    const authHeader = req.headers['authorization'];
    const token = authHeader  ? authHeader.split(' ')[1] : null;

    if(!token){
        throw new ApiError(401,"Access token is missing");
    }


    const decodedToken = jwt.verify(token ,process.env.ACCESS_TOKEN_SECRET);

    const user = await  User.findById(decodedToken._id);

    if(!user){
        throw new ApiError(401,"Invalid token: user not found");
    }


    req.user=user;  // so the we cretae new object in req as user so in controoller tehn dont ahve to find teh user and check everythime 

    next();
    
   } catch (error) {
    throw new ApiError(401,"Invalid or expired token"); 
    
   }
    
})

export default verifyJWT;