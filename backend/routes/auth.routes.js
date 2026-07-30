import express from "express";
import { getcurrentuser, updateassistant } from "../controller/user.controller.js";
import isauth from "../middleware/isauth.js"
import upload from "../middleware/multer.js"

const authrouter = express.Router();

authrouter.get("/current", isauth, getcurrentuser)
authrouter.post("/update", isauth, upload.single("assistantimage"), updateassistant)


export default authrouter;