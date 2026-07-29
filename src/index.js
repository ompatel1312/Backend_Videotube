//require("dotenv").config({path:'./env'});
import dotenv from "dotenv";

// //only for my wifi issue resolve
  import dns from "dns";

  dns.setServers(["8.8.8.8", "8.8.4.4"]);
 import connectDB from "./db/index.js";

dotenv.config({path:'./.env'});
 import {app} from "./app.js";


connectDB()
.then(()=>{
    app.listen(process.env.PORT,()=>{
        console.log(`Server is running on port ${process.env.PORT}`);
})})
.catch((err)=>{
    console.log(`Error in connecting  in index js to MONGODB this : ${err}`);
    process.exit(1);
} )  
