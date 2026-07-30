import React, { useState } from 'react'
import { useContext } from 'react';
import { userdatacontext } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { IoArrowBackCircleSharp } from "react-icons/io5";
import axios from 'axios';

const Customize2 = () => {
  const { userdata, backendimage, selectedimage, serverurl, setuserdata } = useContext(userdatacontext);
  const navigate = useNavigate(); // Initialize navigate safely

  const [assistantname, setassistantname] = useState(userdata?.assistantname || "");
  const [loading, setLoading] = useState(false); // Loading state for button
  const handleupdateassistant = async () => {
    try {
      setLoading(true);

      const finalName = assistantname?.trim() || 'Nova';
      setassistantname(finalName);

      let formData = new FormData();
      formData.append("assistantname", finalName);
      if (backendimage) {
        formData.append("assistantimage", backendimage);
      }
      else {
        formData.append("imageurl", selectedimage);
      }
      const result = await axios.post(`${serverurl}/api/user/update`, formData, { withCredentials: true })

      console.log(result.data)
      setuserdata(result.data)
      navigate('/home');

    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false);
    }

  }

  return (
    <>
      <div className='w-full h-screen h-[100dvh] overflow-hidden bg-gradient-to-b from-[#050814] via-[#03174d] to-[#070707] flex flex-col justify-between items-center py-8 px-4 select-none font-sans text-white relative'>

        <IoArrowBackCircleSharp className='absolute top-[30px] left-[30px] w-[30px] h-[30px]' onClick={() => navigate(-1)} />
        <h1 className='text-xl sm:text-2xl md:text-3xl font-black tracking-widest uppercase text-center mt-4'>
          Enter your <span className='bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500 bg-clip-text text-transparent'>Assistant name</span>
        </h1>

        {/* Center Content Area */}
        <div className='w-full max-w-sm flex-1 flex flex-col justify-center items-center gap-6'>

          {/* Input Box */}
          <input
            type="text"
            placeholder="eg. Stella"
            className="w-full bg-[#ffffff0a] border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder-gray-400 text-sm sm:text-base outline-none focus:border-cyan-400 focus:bg-[#ffffff14] transition-all text-center shadow-inner"
            required
            onChange={(e) => setassistantname(e.target.value)}
            value={assistantname}
          />

          {/* Button Container with fixed min-height to prevent layout shifting */}
          <div className='w-full flex justify-center items-center min-h-[60px]'>
            {assistantname && (
              <button
                className='w-full sm:w-auto bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-bold text-xs sm:text-sm tracking-widest uppercase py-3.5 px-10
                 rounded-full
                  shadow-[0_0_20px_rgba(59,130,246,0.35)] 
                  hover:shadow-[0_0_25px_rgba(59,130,246,0.55)] 
                  transform active:scale-95 transition-all duration-200'
                disabled={loading}
                onClick={() => {

                  handleupdateassistant();

                }}>
                {!loading ? "Create your Assistant" : "Creating..."}
              </button>
            )}
          </div>

        </div>

        {/* Bottom Spacer for perfect vertical alignment */}
        <div className='h-4 invisible'></div>

      </div>
    </>
  )
}

export default Customize2