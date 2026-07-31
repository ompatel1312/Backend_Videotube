import {asyncHandler} from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import User from "../models/user.model.js";
import { uploadImageOnCloudinary } from '../utils/cloudinary.js';
import jwt from "jsonwebtoken"
import mongoose from 'mongoose';

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

const changeCurrentPassword = asyncHandler(async (req,res)=>{
    const {oldPassword,newPassword}=req.body;

    const user=await User.findById(req.user._id)
    const isPasswordCorrect=await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect)
    {
        throw new ApiError(400,"invalid old password")
    }

    user.password=newPassword
    await  user.save({validateBeforeSave:false})

    return res.status(200).json(new ApiResponse(200,{},"password change successfully"))

})

const getCurrentUser=asyncHandler(async (req,res)=>{
    return res
    .status(200)
    .json(200,req.user,"current user fetched successfully")

})

const updateAccountDetail=asyncHandler(async (req,res)=>{
    const {fullName,email}=req.body
    if(!fullName || !email) 
    {
        throw new ApiError(400,"all field are required")
    }

const user =  User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                fullName:fullName,
                email:email
            }
        },
        {new:true}
    ).select("-password")
    return res.status(200)
    .json(new ApiResponse(200,user,"account details updated successfully"))
})

const updateUserAvatar=asyncHandler(async (req,res)=>{
   const avatarLocalPath =req.file?.path

   if(!avatarLocalPath)
   {
    throw new ApiError(400,"Avatar file is missing")
   }
   const avatar=await uploadImageOnCloudinary(avatarLocalPath)

   if(!avatar.url)
   {
    throw new ApiError(400,"error while uploading on cloudinary")
   }

 const user= await User.findByIdAndUpdate(
    req.user?._id,
    {
     $set:{
            avatar:avatar.url
        }
    },
    {new:true}
   ).select("-password")

    return res.status(200).json(
    new ApiResponse(200,user,"avatar updated successfully")
   )

})

const updateUserCoverImage=asyncHandler(async (req,res)=>{
   const CoverImageLocalPath =req.file?.path

   if(!CoverImageLocalPath)
   {
    throw new ApiError(400,"Cover Image file is missing")
   }
   const coverImage=await uploadImageOnCloudinary(CoverImageLocalPath)

   if(!coverImage.url)
   {
    throw new ApiError(400,"error while uploading on cloudinary")
   }

const user= await User.findByIdAndUpdate(
    req.user?._id,
    {
        $set:{
            coverImage:coverImage.url
        }

    },
    {new:true}
   ).select("-password")

   return res.status(200).json(
    new ApiResponse(200,user,"cover image updated successfully")
   )

})

const getUserChannelProfile=asyncHandler(async (req,res)=>{
    const {username}=req.params
    
    if(!username?.trim())
    {
        throw new ApiError(400,"username is missing")
    }

  const channel=await  User.aggregate([
    {
        $match:{
            username:username?.toLowerCase()
        }
    },
    {
        $lookup:{
            from:"subscriptions",
            loaclField:"_id",
            foreignField:"channel",
            as:"subscribers"
        }
    },
    {
        $lookup:{
            from:"subscriptions",
            loaclField:"_id",
            foreignField:"subscriber",
            as:"subscribedTO"
        }
    },
    {
        $addFields:{
        subscribersCount:{
            $size:"$subscribers",
        },
        channelsSubscribedToCount:{
            $size:"subscribedTO"
        },
        isSubscribed:{
            $cond:{
                if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                then:true,
                else:false,
                
            }
        }
        }
    },
    {
        $project:{
            fullName:1,
            usernmae:1,
            subscribersCount:1,
            channelsSubscribedToCount:1,
            isSubscribed:1,
            avatar:1,
            coverImage:1,
            email:1,
        }
    }
  ])

  if(!channel?.length)
  {
    throw new ApiError(404,"channel does not exists")
  }

  return res
  .status(200)
  .json(
    new ApiResponse(200,channel[0],"user channelfetched successfully")
  )

})

const getWattchHistory =asyncHandler(async (req,res)=>{
   const user= await User.aggregate([
    {
        $match:{
            _id:new mongoose.Types.ObjectId(req.user._id)
        }
    },
    {
        $lookup:{
            from:"videos",
            localField:"watchHistory",
            foreignField:"_id",
            as:"watchHistory",
            pipeline:[
                {
                    $lookup:{
                        from:"users",
                        localField:"owner",
                        foreignField:"_id",
                        as:"owner",
                        pipeline:[
                            {
                                $project:{
                                    fullName:1,
                                    username:1,
                                    avatar:1
                                }
                            }
                        ]
                    }

                },
                {
                    $addFields:{
                        owner:{
                            $first:"owner"
                        }
                    }
                }
            ]
        }
    }
   ])
   return res
   .status(200)
   .json(new ApiResponse(200,user[0].watchHistory,"watchHistory fetch successfully"))
})



export {registerUser,loginUser,
    logoutUser,refreshAccessToken,
    changeCurrentPassword,getCurrentUser,
    updateAccountDetail,updateUserCoverImage,
    updateUserAvatar,getUserChannelProfile,getWattchHistory};
