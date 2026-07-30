import express from "express";
import { signup } from "../controller/auth.controller.js";
import { signin } from "../controller/auth.controller.js";
import { logout } from "../controller/auth.controller.js";

const userrouter = express.Router();

  userrouter.post("/signup", signup);
  userrouter.post("/signin", signin);
  userrouter.post("/logout", logout);



export default userrouter;

