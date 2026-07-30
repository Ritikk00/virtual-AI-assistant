import React from 'react'
import { RiImageUploadLine } from "react-icons/ri";
import Cards from '../componenets/Cards'
import image1 from '../assets/image1.jpg'
import image2 from '../assets/image2.jpg'
import image3 from '../assets/image3.jpg'
import image4 from '../assets/image4.jpg'
import image5 from '../assets/image5.jpg'
import image6 from '../assets/image6.jpg'
import authbg from '../assets/authbg.png'
import { useRef, useState, useContext } from "react";
import { useNavigate } from 'react-router-dom';
import { userdatacontext } from '../context/UserContext'
import { IoArrowBackCircleSharp } from "react-icons/io5";

function Customize() {

  // LOGIC UNTOUCHED: Aapki state logic safe hai
  const {
    serverurl, userdata, setuserdata, frontendimage, setFrontendImage,
    backendimage, setbackendImage, selectedimage, setselectedImage
  } = useContext(userdatacontext);
  const navigate = useNavigate();
  const inputimage = useRef(null);

  const handleimage = (e) => {
    const file = e.target.files[0];
    setbackendImage(file);
    const previewUrl = URL.createObjectURL(file);
    setFrontendImage(previewUrl);
    setselectedImage(previewUrl);
  }

  const defaultImages = [
    { id: "img1", src: image1 },
    { id: "img2", src: image2 },
    { id: "img3", src: image3 },
    { id: "img4", src: image4 },
    { id: "img5", src: image5 },
    { id: "img6", src: image6 },
    { id: "img7", src: authbg },
  ];

  return (
    <>
      {/* Container: Page strict 100vh layout control */}
      <div className='w-full h-screen h-[100dvh] overflow-hidden bg-gradient-to-b from-[#050814] via-[#03174d] to-[#070707] flex flex-col justify-between items-center py-5 px-4 select-none font-sans text-white relative'>

        <IoArrowBackCircleSharp className='absolute top-[30px] left-[30px] w-[30px] h-[30px]' onClick={() => navigate("/home")} />
        <div className='w-full text-center flex-shrink-0 mt-2'>
          <h1 className='text-xl sm:text-2xl md:text-3xl font-black tracking-widest uppercase'>
            Select your <span className='bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500 bg-clip-text text-transparent'>assistant image</span>
          </h1>
          <p className='text-[10px] sm:text-xs text-slate-400 mt-1 tracking-wider'>
            Choose a premium layout for your AI profile interface
          </p>
        </div>

        {/* Middle Content Area: Strictly constrained bounds to keep button in view port */}
        <div className='w-full max-w-4xl flex-1 flex items-center justify-center my-auto max-h-[62vh] sm:max-h-[68vh]'>

          {/* 🛠️ Hybrid Mesh Layout: Mobile pe 3-columns and laptop pe 4-columns logic */}
          <div className='grid grid-cols-3 sm:grid-cols-4 gap-4 sm:gap-6 justify-items-center items-center w-full px-2'>

            {defaultImages.map((item) => (
              <div
                key={item.id}
                onClick={() => setselectedImage(item.src)}
                className={`
                  /* 📱 Mobile UI: Circles */
                  w-[78px] h-[78px] rounded-full 
                  /* 💻 Laptop/PC UI: Balanced Rectangular Cards */
                  sm:w-[130px] sm:h-[180px] sm:rounded-2xl 
                  overflow-hidden flex items-center justify-center p-[2px] transition-all duration-300 transform hover:scale-105 cursor-pointer
                  ${selectedimage === item.src
                    ? "bg-gradient-to-tr from-amber-400 to-orange-500 shadow-[0_0_18px_rgba(245,158,11,0.5)] scale-105"
                    : "bg-slate-800/40 border border-blue-500/10 hover:border-blue-400/50"
                  }
                `}
              >
                {/* Internal shape handler to force full image rendering across viewports */}
                <div className="w-full h-full rounded-full sm:rounded-[14px] overflow-hidden bg-slate-900 flex items-center justify-center">
                  <Cards image={item.src} className="w-full h-full object-cover" />
                </div>
              </div>
            ))}

            {/* Custom File Upload Component: Mimics hybrid structure identically */}
            <div className="w-full flex justify-center">
              <div
                className={`
                  /* 📱 Mobile */
                  w-[78px] h-[78px] rounded-full 
                  /* 💻 Laptop/PC */
                  sm:w-[130px] sm:h-[180px] sm:rounded-2xl 
                  overflow-hidden flex flex-col items-center justify-center transition-all duration-300 transform hover:scale-105 cursor-pointer bg-slate-900/60 border-2 
                  ${selectedimage === "input"
                    ? "border-amber-400 shadow-[0_0_18px_rgba(245,158,11,0.5)] ring-2 ring-amber-400/20 scale-105"
                    : "border-blue-500/20 hover:border-blue-400/60 shadow-md"
                  }
                `}
                onClick={() => {
                  inputimage.current.click()
                  setselectedImage(frontendimage || "input")
                }}
              >
                {!frontendimage && (
                  <div className='flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-blue-400 transition-colors duration-200'>
                    <RiImageUploadLine className='w-[20px] h-[20px] sm:w-[26px] sm:h-[26px]' />
                    <span className='text-[8px] sm:text-[10px] font-bold tracking-tighter opacity-80'>Upload your own</span>
                  </div>
                )}

                {frontendimage && (
                  <img
                    src={frontendimage}
                    className='w-full h-full object-cover rounded-full sm:rounded-[14px]'
                    alt="Preview"
                  />
                )}
              </div>

              <input
                type="file"
                accept="image/*"
                ref={inputimage}
                hidden
                onChange={handleimage}
              />
            </div>

          </div>
        </div>

        {/* Bottom Interactive Trigger Area */}
        <div className='w-full h-16 flex-shrink-0 flex items-center justify-center mb-2'>
          {selectedimage ? (
            <button className='bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-bold text-xs sm:text-sm tracking-widest uppercase py-3.5 px-14 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.35)]
             hover:shadow-[0_0_25px_rgba(59,130,246,0.55)] 
             transform active:scale-95 transition-all duration-200' onClick={() => navigate("/customize2")}>
              Next Step
            </button>
          ) : (
            <p className='text-[10px] sm:text-xs text-slate-500 tracking-widest font-semibold text-center animate-pulse uppercase'>
              * Tap any layout profile to activate
            </p>
          )}
        </div>

      </div>
    </>
  )
}

export default Customize