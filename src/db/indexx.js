import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB=async()=>{
    try{
        const connectionString = `${process.env.MONOGODB_URI}/${DB_NAME}`;
        console.log("MongoDB Connection String:", connectionString);
        const connectionInstance=await mongoose.connect(`${process.env.MONOGODB_URI}/${DB_NAME}`)
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
        //to make sure that right host se connect hua h

    }catch(error){
        console.log("MONGODB connection error ",error);
        process.exit(1);
        //exit krne ka tarika tell the number inside
    }
}

export default connectDB