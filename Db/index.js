import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();


const connectDB= async ()=>{
    try {

        const connnectInstance= await mongoose.connect(process.env.MONGO_URL,{
            dbName:"gitvault",
             })

             console.log(`MongoDB connected:${connnectInstance.connection.host}`);
        
    } catch (error) {
        console.log(`Error:${error.message}`);
        process.exit(1);

        
    }
}

export default connectDB;