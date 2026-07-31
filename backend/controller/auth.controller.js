
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import gentoken from "../config/token.js";


export const signup = async (req, res) => {
  try {

    const { name, email, password } = req.body;
    const existemail = await User.findOne({ email })
    if (existemail) {
      return res.status(400).json({ message: "User already exist" });
    }

    // password length checking 

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // hashing the pass


    const hashedpassword = await bcrypt.hash(password, 12)

    const user = await User.create({
      name,
      email,
      password: hashedpassword
    });


    const token = await gentoken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "None",
      secure: true
    })

    return res.status(201).json(user);




  } catch (error) {
    return res.status(500).json({ message: "signup error" });

  }
}



export const signin = async (req, res) => {
  try {

    const { email, password } = req.body;
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }


    const ismatch = await bcrypt.compare(password, user.password);

    if (!ismatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }



    const token = await gentoken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "None",
      secure: true
    })

    return res.status(201).json(user);




  } catch (error) {
    return res.status(500).json({ message: "login error" });

  }
}

export const logout = async (req, res) => {

  try {
    res.clearCookie("token")
    return res.status(200).json({ message: "Logout successful" });
  }
  catch (error) {

    return res.status(500).json({ message: "logout error" });



  }
}

