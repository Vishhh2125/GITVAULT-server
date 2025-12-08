import mongoose from 'mongoose';

const repoSchema =  new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    url:{
        type:String,
        required:true,
    },
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,

    },
     description: {
      type: String,
      default: "",
     },
     visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
     },
     collaborators:[
        {
            user:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"User",
            },
            role:{
                type:String,
                enum:["read","write","admin"]
            }
        }
     ]

},{
    timestamps:true
});

const Repository = mongoose.model("Repo", repoSchema);

export default Repository;