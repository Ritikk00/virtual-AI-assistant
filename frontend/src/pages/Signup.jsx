import React, { useContext, useState } from 'react'
import bg from '../assets/authbg.png'
import { Link, useNavigate } from 'react-router-dom';
import { userdatacontext } from '../context/UserContext';
import axios from "axios"
import { toast, Toaster } from 'react-hot-toast'; // 🛠️ FIXED: Toaster ko bhi yahan import kiya

function Signup() {
  const { serverurl, userdata, setuserdata } = useContext(userdatacontext)
  const navigate = useNavigate();

  const [name, setname] = useState('');
  const [email, setemail] = useState('');
  const [password, setpassword] = useState('');

  const handlesignup = async (e) => {
    e.preventDefault()

    if (!name || !email || !password) {
      return toast.error("Please fill all fields!");
    }

    try {
      let result = await axios.post(`${serverurl}/api/auth/signup`, { name, email, password }, { withCredentials: true })
      const userData = result.data?.user || result.data;
      setuserdata(userData)

      toast.success("Account created successfully! 🎉");

      setname("")
      setemail("")
      setpassword("")

      setTimeout(() => {
        navigate('/customize', { replace: true });
      }, 2000);

    } catch (error) {
      console.log(error)
      setuserdata(null)
      const errorMessage = error.response?.data?.message || "Something went wrong. Try again!";
      toast.error(errorMessage);
    }
  }

  return (
    <div
      className='w-full h-screen overflow-hidden flex flex-col lg:flex-row items-center justify-center lg:justify-between px-4 sm:px-12 md:px-20 lg:px-32 py-4 lg:py-10 gap-4 lg:gap-10'
      style={{ backgroundImage: `url(${bg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      {/* 🛠️ FIXED: Container ko layout ke andar top par rakh diya taaki notifications visible ho ske */}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
          }
        }}
      />

      {/* Left-Aligned Premium Heading Section */}
      <div className='max-w-[500px] text-left space-y-2 lg:space-y-4 filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] px-2 lg:-ml-10 w-full flex flex-col justify-center'>
        <div className='inline-block self-start bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] sm:text-xs uppercase tracking-[0.2em] px-2.5 py-0.5 sm:py-1 rounded-full font-semibold mb-0.5'>
          Next-Gen Interface
        </div>

        <h1 className='text-white text-xl sm:text-3xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] uppercase'>
          Sign up to <br className='hidden sm:block' /> your
          <span className='block mt-1 bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 bg-clip-text text-transparent font-black drop-shadow-[0_0_25px_rgba(34,211,238,0.5)]'>
            Virtual AI <br className='hidden lg:block' /> Assistant
          </span>
        </h1>

        <p className='text-slate-200 text-xs sm:text-base md:text-lg font-normal tracking-wide max-w-[420px] leading-relaxed bg-black/30 lg:bg-transparent backdrop-blur-sm lg:backdrop-blur-none p-2.5 sm:p-4 lg:p-0 rounded-xl border border-white/5 lg:border-none'>
          Experience the power of <span className='text-cyan-400 font-semibold underline decoration-cyan-500/40 decoration-2 underline-offset-4'>artificial intelligence</span> right at your fingertips.
        </p>
      </div>

      {/* Form Tag with onSubmit */}
      <form onSubmit={handlesignup} className='w-full max-w-[420px] bg-[#00000066] backdrop-blur-xl h-auto max-h-[58vh] lg:max-h-none overflow-y-auto lg:overflow-visible p-5 sm:p-8 rounded-2xl border border-white/10 flex flex-col gap-3 sm:gap-5 shadow-2xl transition-all duration-300 lg:mr-4 custom-scrollbar'>

        <div className='mb-0 lg:mb-1 border-b border-white/10 pb-2 sm:pb-4'>
          <h2 className='text-white text-lg sm:text-2xl font-bold tracking-wide'>Create Account</h2>
          <p className='text-gray-400 text-[10px] sm:text-xs mt-0.5'>Get started for free today.</p>
        </div>

        <div className='space-y-2.5 sm:space-y-4 flex-1 flex flex-col'>
          <div className='flex flex-col gap-1'>
            <input
              type="text"
              placeholder="Full Name"
              className="w-full bg-[#ffffff0a] border border-white/10 rounded-xl px-4 py-2 sm:py-3 text-white placeholder-gray-400 text-xs sm:text-sm outline-none focus:border-cyan-400 focus:bg-[#ffffff14] transition-all"
              value={name}
              onChange={(e) => setname(e.target.value)}
            />
          </div>

          <div className='flex flex-col gap-1'>
            <input
              type="email"
              placeholder="Email Address"
              className="w-full bg-[#ffffff0a] border border-white/10 rounded-xl px-4 py-2 sm:py-3 text-white placeholder-gray-400 text-xs sm:text-sm outline-none focus:border-cyan-400 focus:bg-[#ffffff14] transition-all"
              value={email}
              onChange={(e) => setemail(e.target.value)}
            />
          </div>

          <div className='flex flex-col gap-1'>
            <input
              type="password"
              placeholder="Password"
              className="w-full bg-[#ffffff0a] border border-white/10 rounded-xl px-4 py-2 sm:py-3 text-white placeholder-gray-400 text-xs sm:text-sm outline-none focus:border-cyan-400 focus:bg-[#ffffff14] transition-all"
              value={password}
              onChange={(e) => setpassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-bold py-2 sm:py-3 rounded-xl transition-all duration-300 shadow-lg shadow-cyan-500/20 text-xs sm:text-sm tracking-wide mt-2 uppercase"
          >
            Sign Up
          </button>

          <p className='text-center text-gray-400 text-[11px] sm:text-xs mt-2'>
            Already have an account?
            <Link to="/signin" className='text-cyan-400 hover:text-cyan-300 font-semibold underline decoration-cyan-400/30 underline-offset-2 transition-colors ml-1'>
              Sign In
            </Link>
          </p>
        </div>
      </form>
    </div>
  )
}

export default Signup