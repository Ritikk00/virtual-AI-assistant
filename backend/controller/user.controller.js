import User from "../models/user.model.js";
import  uploadOnCloudinary  from "../config/cloudinary.js";

export const getcurrentuser = async (req, res) => {
     try {
        const userId = req.userId;

        // 🛠️ Safety Check: Agar middleware se userId aayi hi nahi hai
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized: No User ID provided in token" });
        }

        const user = await User.findById(userId).select("-password");
        
        if (!user) {
            return res.status(404).json({ message: "User not found in database" });
        }

        return res.status(200).json(user);

     } catch (error) {
        // 🛠️ Isse aapko terminal mein asli wajah dikhegi ki crash kyu hua
        console.error("Asli Backend Error:", error.message); 
        return res.status(500).json({ message: "Server error inside getcurrentuser" });
     }
}

export const updateassistant = async (req, res) => {
    try {
        const { assistantname, imageurl } = req.body;
        let assistantimage = null; 

        if (req.file) {
            // 🚀 Cloudinary se poora object response milega
            const response = await uploadOnCloudinary(req.file.path);
            
            // 🛠️ CRITICAL FIX: Object me se secure_url string ko database me bhejenge
            if (response && response.secure_url) {
                assistantimage = response.secure_url; 
            } else if (response && response.url) {
                assistantimage = response.url;
            } else {
                assistantimage = imageurl; // Fallback
            }
        } else {
            assistantimage = imageurl;
        }

        const user = await User.findByIdAndUpdate(
            req.userId,
            { assistantname, assistantimage },
            { returnDocument: 'after' } // Mongoose warning hatane ke liye use kiya returnDocument
        ).select("-password");

        return res.status(200).json(user);
        
    } catch (error) {
        console.error("Asli Update Error:", error); 
        return res.status(500).json({ message: "update assistant error" });
    }
}