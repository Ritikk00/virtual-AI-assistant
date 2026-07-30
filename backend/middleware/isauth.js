import jwt from "jsonwebtoken"

const isauth = async (req, res, next) => {
    try {
        // 1. Browser cookies se token uthaya
        const token = req.cookies.token
        if (!token) {
            return res.status(401).json({ message: "Token not found" })
        }

        // 2. Token ko verify kiya (jwt.verify synchronous hota hai, isliye await hataya)
        const verifytoken = jwt.verify(token, process.env.JWT_SECRET)
        
        // 🛠️ CRITICAL FIX: gentoken mein '{ id: userid }' hai, isliye yahan '.id' read karenge
        req.userId = verifytoken.id

        // Agar token valid hai par usme id nahi mili (Safety check)
        if (!req.userId) {
            return res.status(401).json({ message: "User ID not found in token payload" })
        }
        
        // Sab sahi hai, ab agla controller (getcurrentuser) chalega
        next()
        
    } catch (error) {
        console.log("JWT Auth Middleware Error:", error.message)
        return res.status(401).json({ message: "Invalid or expired token" })
    }
}

export default isauth;