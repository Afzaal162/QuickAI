import React, { useState } from 'react'
import { Sparkle, Eraser } from 'lucide-react'
import toast from 'react-hot-toast';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios'

// Ensure your .env variable is named correctly
axios.defaults.baseURL = import.meta.env.VITE_BASE_URL; 

const RemoveBackground = () => {
  // 1. Move all hooks to the top level
  const [input, setInput] = useState(null);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
  const { getToken } = useAuth();

  // 2. Single, clean handler function
 // Inside your onSubmitHandler in RemoveBackground.jsx
const onSubmitHandler = async (e) => {
  e.preventDefault();
  
  try {
    setLoading(true);

    // 1. Fetch the token
    const token = await getToken(); 

    // --- DEBUG LOGS ---
    console.log("--- CLERK AUTH DEBUG ---");
    console.log("Token Value:", token); 
    console.log("Token Type:", typeof token);
    console.log("Base URL:", import.meta.env.VITE_BASE_URL);
    // ------------------

    if (!token) {
      console.error("TOKEN IS MISSING! Are you signed in?");
      return;
    }

    const formData = new FormData();
    formData.append('image', input);

    const { data } = await axios.post('http://localhost:3000/api/ai/remove-image-background', formData, {
        headers: { Authorization: `Bearer ${await getToken()}` }
      })

    if (data.success) {
      setContent(data.content);
    }
  } catch (error) {
    // Log the full error to see the backend's response message
    console.error("AXIOS ERROR:", error.response?.data || error.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className='overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700'>
      {/* left col */}
      <form onSubmit={onSubmitHandler} className='w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200'>
        <div className='flex items-center gap-3'>
          <Sparkle className='w-6 text-[#FF4938]' />
          <h1 className='text-xl font-semibold'>Background Removal</h1>
        </div>
        <p className='mt-6 text-sm font-medium'>Upload Image</p>
        
        {/* Fixed: changed onClick to onChange and file to files */}
        <input 
          onChange={(e) => setInput(e.target.files[0])} 
          accept='image/*'
          type='file' 
          className='w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300 cursor-pointer text-gray-600' 
          required 
        />
        
        <p className='text-xs text-gray-500 font-light mt-1'>Supports JPG, PNG, and other format Images</p>
        
        <button disabled={loading} className='w-full flex justify-center items-center gap-2 bg-gradient-to-r from-[#F6AB41] to-[#FF4938] text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer'>
          {loading ? (
            <span className='w-4 h-4 my-1 rounded-full border-2 border-t-transparent animate-spin'></span>
          ) : (
            <Eraser className='w-5' />
          )}
          {loading ? "Processing..." : "Remove Background"}
        </button>
      </form>

      {/* right col */}
      <div className="w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96">
        <div className='flex items-center gap-3'>
          <Eraser className='w-5 h-5 text-[#FF4938]' />
          <h1 className="text-xl font-semibold"> Processed Image</h1>
        </div>
        {!content ? (
          <div className="flex-1 flex justify-center items-center">
            <div className="text-sm flex flex-col items-center gap-5 text-gray-400">
              <Eraser className='w-9 h-5 text-[#FF4938]' />
              <p>Upload an Image and Click "Remove Background" to get started</p>
            </div>
          </div>
        ) : (
          <img src={content} alt="processed" className='w-full h-auto mt-3 rounded-lg' />
        )}
      </div>
    </div>
  )
}

export default RemoveBackground;