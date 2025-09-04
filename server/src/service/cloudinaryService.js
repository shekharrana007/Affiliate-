const cloudinary=require('cloudinary').v2;

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const generateUploadSignature=()=>{
    const timestamp=Math.floor(Date.now()/1000);  //convert to Seconds
   const signature= cloudinary.utils.api_sign_request(
    {timestamp},
    process.env.CLOUDINARY_API_SECRET
   );
   return {signature,timestamp};
};


module.exports = {generateUploadSignature};