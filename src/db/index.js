import mongoose from "mongoose";    
import { DB_NAME } from "../constants.js";  

const connectDB= async ()=>{
    try{
        const connetionInstance=await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`MONGODB connected : ${connetionInstance.connection.host}`);

    }catch(err){    
        console.log(`Error in connecting to MONGODB this : ${err}`);
    process.exit(1);

    }
}
export default connectDB;
