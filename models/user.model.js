import mongoose from "mongoose";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique:true,
    },
    email:{
        type:String,
        required:true,  
        unique:true,
    },
    password:{
        type:String,
        required:true,
    },
    refreshToken:{
        type:String,
    }
},
{
timestamps:true
})



userSchema.pre("save", async function(){
    if(this.isModified("password")){
        const saltRounds=10;
        this.password = await bcrypt.hash(this.password,saltRounds);
    }
    
})


userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password);
}



userSchema.methods.generateAccessToken = async function(){

    const accessToken = await jwt.sign({
        _id:this._id,
        email:this.email,
        username:this.username
        },
        process.env.ACCESS_TOKEN_SECRET,
        {expiresIn: process.env.ACCESS_TOKEN_EXPIRY},
    )

    return accessToken;

} 


userSchema.methods.generateRefreshToken= async function (){

    const refreshToken = await jwt.sign({
        _id:this._id,
    
    },
  process.env.REFRESH_TOKEN_SECRET,
{expiresIn:process.env.REFRESH_TOKEN_EXPIRY})


return refreshToken;

}

const User = mongoose.model("User",userSchema);
export default User;