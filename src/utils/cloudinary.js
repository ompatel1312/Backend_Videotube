import {v2 as cloudinary} from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

const uploadImageOnCloudinary = async (loaclFilePath) => {
    try{
        if(!localFilePath) return null;
        const response=await cloudinary.uploader.upload(localFilePath, {resource_type:"auto"})
        //file has been upload successfully
        console.log("File has been uploaded successfully to cloudinary",response.url);
        return response;
    }
    catch(error){
        fs.unlinkSync(localFilePath);//remove the local save fie save temp on server 
        return null;
    }
}
 
export {uploadImageOnCloudinary};

