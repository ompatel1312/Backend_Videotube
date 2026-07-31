import { Router } from "express";
import { loginUser,
     logoutUser, 
     registerUser,
     refreshAccessToken,
      changeCurrentPassword,
       getCurrentUser,
        updateAccountDetail, 
        updateUserAvatar,
         updateUserCoverImage, 
         getUserChannelProfile, 
         getWattchHistory } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js";
import { uploadImageOnCloudinary } from "../utils/cloudinary.js";
import { verfiyJWT } from "../middlewares/auth.middleware.js";


const router=Router();

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser);
router.route("/login").post(loginUser)

//secure routr
router.route("/logout").post(verfiyJWT,logoutUser)
router.route("/refreh-token").post(refreshAccessToken)
router.route("/change-password").post(verfiyJWT,changeCurrentPassword)
router.route("/current-user").get(verfiyJWT,getCurrentUser)
router.route("/update-account").patch(verfiyJWT,updateAccountDetail)
router.route("/avatar").patch(verfiyJWT,upload.single("avatar"),updateUserAvatar)
router.route("/cover-image").patch(verfiyJWT,upload.single("coverImage"),updateUserCoverImage)
router.route("/c/:username").get(verfiyJWT,getUserChannelProfile)
router.route("/history").get(verfiyJWT,getWattchHistory)


export default router;