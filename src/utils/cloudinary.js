import {v2 as cloudinary} from 'cloudinary'
import fs from 'fs'     //file system nodejsf
          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
    try{
        if(!localFilePath) return null;
        //upload the file on cloudinary from the local system.
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto" //auto detect file type like pdf jpg etc.
        })

        //file uploaded successfully.
        
        //console.log("file is uploaded on cloudinary", response.url)
        fs.unlinkSync(localFilePath) //remove the locally saved temporary file as the upload operation on cloudinary is complete
        return response
    }catch(error){
        fs.unlinkSync(localFilePath) //remove the locally saved temporary file as the upload operation of cloudinary failed.

        return null
    }
}

export {uploadOnCloudinary}

/*
NOTES:-

WHAT WE ARE DOING: the user will upload a file on the local server using multer and then cloudinary will take that file from the local server and then upload it on its cloud.
So here whoever uses this service will provide the path of the file on the local server.

*/