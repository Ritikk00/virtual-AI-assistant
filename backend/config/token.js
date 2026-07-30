 import jwt from "jsonwebtoken";

const gentoken = async (userid)=>{
    try{

        const token = jwt.sign({id:userid}, process.env.JWT_SECRET, {expiresIn:"1d"})
         return token;


    } catch (error) {
        console.log(error);
        
    }
}

export default gentoken;