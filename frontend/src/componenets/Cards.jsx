import React, { useContext } from 'react'
import { userdatacontext } from '../context/UserContext'

function Cards({ image }) {
  const { serverurl, userdata, setuserdata, frontendimage, setFrontendImage, backendimage, setbackendImage, selectedimage, setselectedImage
  } = useContext(userdatacontext);


  return (
    <div className={
      `w-[80px] h-[160px] lg:w-[150px] lg:h-[250px]
       bg-[#0b0b5a] border-2 border-[#06066e00] rounded-2xl overflow-hidden
       hover:shadow-2xl hover:shadow-blue-800 cursor-pointer hover:border-2
       hover:border-b-amber-50 ${selectedimage === image ? "border-amber-50 border-b-amber-50 shadow-2xl shadow-blue-950" :null}`
    } onClick={() =>{
      setselectedImage(image)
      setbackendImage(null)
      setFrontendImage(null)


    }}>

      <img src={image} className='h-full rounded-2xl object-cover' />
    </div>
  )
}

export default Cards