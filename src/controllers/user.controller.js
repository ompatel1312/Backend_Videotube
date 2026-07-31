import {asyncHandler} from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import User from "../models/user.model.js";
import { uploadImageOnCloudinary } from '../utils/cloudinary.js';
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens=async (userId)=>{
    try{
            const user=await User.findById(userId);
            const accessToken= user.generateAccessToken()
            const refreshToken=user.generateRefreshToken()
            user.refreshToken=refreshToken
            await user.save({validateBeforeSave: false})
            return {accessToken,refreshToken}

    }
    catch(error){
        throw new ApiError(500,"something went wrong while generating refresh and access token ",error);

    }

}



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

    const exitedUser=await User.findOne({
        $or:[{username},{email}]
    })


    if(exitedUser){
        throw new ApiError(409,"User already exists with this username or email");
    }

//    const avatarLocalPath= req.files?.avatar[0].path;
//    const coverImagePath=req.files?.coverImage[0].path;

//    console.log(req.files);
//    if(!avatarLocalPath){
//     throw new ApiError(400,"Avatar is required");
//    }

const avatarLocalPath = req.files?.avatar?.[0]?.path;
const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

console.log("FILES:", req.files);
console.log("AVATAR PATH:", avatarLocalPath);

if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
}


 const avatar=await uploadImageOnCloudinary(avatarLocalPath) ;
 const coverImage= await uploadImageOnCloudinary(coverImageLocalPath);

 if(!avatar)
 {
        throw new ApiError(400,"Avatar is required");
 }
 //debuging
//     console.log("avatar object:", avatar);
// console.log("avatar url:", avatar?.url);
// console.log("coverImage object:", coverImage);
// console.log("coverImage url:", coverImage?.url);

 const user= await User.create(
    {
        fullName,
        avatar: avatar.url, 
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
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

const loginUser=asyncHandler( async (req,res)=>{
  //req body->data
  //usernmae or email
  //find user
  //password check 
  //access and refresh toekn 
  //send cookie 
    const {email,username,password}=req.body;
    if(!(username || email))
    {
        throw new ApiError(400,"username or email is required !")
    }

    const user=await User.findOne({
        $or:[{username},{email}]
    })

    if(!user)
    {
        throw new ApiError(404,"user does not exist")
    }

    const isPasswordValid=await user.isPasswordCorrect(password);
    if(!isPasswordValid)
    {
        throw new ApiError(404,"invalid credentials")
    }
  const {accessToken,refreshToken}= await generateAccessAndRefreshTokens(user._id);

  const loggedInUser =await User.findById(user._id).select("-password -refreshToken");

  const options={
    httpOnly:true,
    secure:true
  }

  return res.status(200)
  .cookie("accessToken",accessToken,options)
  .cookie("refreshToken",refreshToken,options)
  .json(
    new ApiResponse(200,{user:loggedInUser,accessToken,refreshToken},
        "User  logged  in successfully"
    )
  )
})

  const logoutUser=asyncHandler(async (req,res)=>{
  await  User.findByIdAndUpdate(req.user._id,{
        $set:{
            refreshToken:undefined
        }
    },{
        new:true
    })
  

    const options={
     httpOnly:true,
     secure:true
 }

  return res
  .status(200)
  .clearCookie("accessToken",options)
  .clearCookie("refreshToken",options)
  .json(new ApiResponse(200,{},"user logged Out"))

})

const refreshAccessToken= asyncHandler(async (req,res)=>{       
    const incomingRefreshToken=req.cookie.refreshAccessToken || req.body.refreshAccessToken

    if(!incomingRefreshToken)
    {
        throw new ApiError(401,"unauthorized request");
    }
try{


    const decodedToken=await jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)

   const user= User.findById(decodedToken?._id)

   if(!user)
   {
    throw new ApiError(401,"invalid refresh token ");
   }


   if(incomingRefreshToken!==user?.refreshToken){
     throw new ApiError(401,"refresh token is expired or used")
   }

   const options={
    httpOnly:true,
    secure:true
   }

 const {accessToken,newRefreshToken} =await generateAccessAndRefreshTokens(user._id)

   return res
   .status(200)
   .cookie("accessToken",accessToken,options)
   .cookie("refreshToken",newRefreshToken,options)
   .json(
    new ApiResponse(200,"access token refresh successfully",{accessToken,refreshToken:newRefreshToken})
   )
}catch(error)
{
    new ApiError(401,error?.message || "Invalid refresh token")
}
})

export {registerUser,loginUser,logoutUser,refreshAccessToken};
