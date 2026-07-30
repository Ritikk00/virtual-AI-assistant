import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'

// 🛠️ FIX 1: Function ke aage 'async' lagaya
const uploadOnCloudinary = async (filepath) => {

    // 🛠️ FIX 2: Quotes ('') hataye taaki .env files se asli keys load ho sakein
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_NAME,
        api_key: process.env.CLOUDINARY_API,
        api_secret: process.env.CLOUDINARY_SECRETKEY
    });

    try {
        if (!filepath) return null;

        // Cloudinary par file upload kiya
        const uploadResult = await cloudinary.uploader.upload(filepath);
        
        // 🛠️ FIX 3: Upload ke baad local temp file ko delete kiya
        fs.unlinkSync(filepath);
        
        // Secure URL return kiya controller ke liye
        return uploadResult;

    } catch (error) {
        // Agar upload fail bhi ho jaye, toh local temp file delete ho jani chahiye
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
        }
        console.error("Cloudinary Upload Error:", error.message);
        
        // 🛠️ FIX 4: Utility me res nahi hota, isliye error return ya throw karenge
        return null;
    }
}

export default uploadOnCloudinary;