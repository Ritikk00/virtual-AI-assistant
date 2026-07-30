import React, { createContext } from 'react'
import { useEffect } from 'react'
import { useState } from 'react'
import axios from "axios"

export const userdatacontext = createContext()

function UserContext({ children }) {
  const serverurl = "http://localhost:8000"

  const [userdata, setuserdata] = useState(null)
  const [frontendimage, setFrontendImage] = useState(null);
  const [backendimage, setbackendImage] = useState(null);
  const [selectedimage, setselectedImage] = useState(null);
  
  // 🛠️ CRITICAL FIX: Loading state banayi jo shuru me true rahegi
  const [loading, setLoading] = useState(true);

  const handlecurrentuser = async () => {
    try {
      const result = await axios.get(`${serverurl}/api/user/current`, { withCredentials: true })
      setuserdata(result.data)
      console.log(result.data)
    } catch (error) {
      console.log(error)
    } finally {
      // 🛠️ FIX: Data aaye ya error, request khatam hote hi loading false ho jayegi
      setLoading(false);
    }
  }

  useEffect(() => {
    handlecurrentuser()
  }, [])

  // Value ke andar loading ko bhi bhej diya
  const value = {
    serverurl, userdata, setuserdata, frontendimage, setFrontendImage, backendimage, setbackendImage, selectedimage, setselectedImage,
    loading, setLoading // 🚀 Exported loading states
  }

  return (
    <userdatacontext.Provider value={value}>
      {children}
    </userdatacontext.Provider>
  )
}

export default UserContext