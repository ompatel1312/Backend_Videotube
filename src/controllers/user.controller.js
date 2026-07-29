import {asyncHandler} from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import {User} from "../models/user.model.js";
import { uploadImageOnCloudinary } from '../utils/cloudinary.js';
const registerUser=asyncHandler(async(req,res)=>{
    //get user details from frontend
    //validation -not empty 
    //check if user already exists :username,email
    //chexk for image ,check for avatr
    //upload them to cloudinary ,avvvatar
    //create user object-create entry in db 
    //remove password and refresh token field from response 
    //check for user creation 
    //return res 
   const {fullName,email,username,password} = req.body
console.log("user details from frontend",fullName,email,username,password);

    // if(fullName=="" ){
    //     throw new ApiError(400,"Full name is required");
    // }

    if([fullName,email,username,password].some((field)=>(field?.trim()===""))){
        throw new ApiError(400,"All fields are required");
    }

    const exitedUser=User.findOne({
        $or:[{username},{email}]
    })


    if(exitedUser){
        throw new ApiError(409,"User already exists with this username or email");
    }

   const avatarLocalPath= req.files?.avatar[0]?.path;
   const coverImagePath=req.files?.coverPhoto[0]?.path;

   if(avavtarLocalPath){
    throw new ApiError(400,"Avatar is required");
   }

 const avatar=await uploadImageOnCloudinary(avatarLocalPath) ;
 const coverImage= await uploadImageOnCloudinary(coverImagePath);

 if(!avatar)
 {
        throw new ApiError(400,"Avatar is required");
 }

 const user= await User.create(
    {
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCaase()
    }

     
 )

 const createdUser= await User.findById(user._id).select(
    "-password -refreshToken"
 )

 if(!createdUser)
 {
    throw new ApiError(510,"something went wrong during resigter user ");
 }

 return res.status(201).json(
    new ApiResponse(200,createdUser,"user registered successfully")
)


})

export {registerUser};
