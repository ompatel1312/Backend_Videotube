//require("dotenv").config({path:'./env'});
import dotenv from "dotenv";

//only for my wifi issue resolve
 import dns from "dns";

 dns.setServers(["8.8.8.8", "8.8.4.4"]);
import connectDB from "./db/index.js";

dotenv.config({path:'./.env'});

connectDB();
