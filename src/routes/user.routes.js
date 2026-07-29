import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js";
import { uploadImageOnCloudinary } from "../utils/cloudinary.js";


const router=Router();

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverPhoto",
            maxCount:1
        }
    ]),
    registerUser);

export default router;