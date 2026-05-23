import React, { useState } from 'react'
import { Sparkle, Scissors } from 'lucide-react';
import axios from '../lib/axiosInstance';
import { useAuth } from '@clerk/clerk-react';
import toast from 'react-hot-toast';


const RemoveObject = () => {
  const [input, setInput] = useState("");
  const [object, setObject] = useState('')
  const [loading, setLoading] = useState("");
  const [content, setContent] = useState("");
  const { getToken } = useAuth();
  const onSubmitHandler = async (e) => {
    e.preventDefault();
    if (!input) return toast.error("Please select an image first");

    try {
      setLoading(true)
      // This splits by spaces. "Red Car" would be length 2.
      if (object.trim().split(/\s+/).length > 1) {
        setLoading(false); // Remember to turn off loading if you return early!
        return toast.error('Please enter only one word (e.g., "watch")');
      }
      const formData = new FormData();
      formData.append('image', input)
      formData.append('object', object)


      const { data } = await axios.post('/api/ai/remove-image-object', formData, {
        headers: { Authorization: `Bearer ${await getToken()}` }
      })

      if (data.success) {
        setContent(data.content)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className=' overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700'>
      {/* left col */}
      <form onSubmit={onSubmitHandler} className='w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200'>
        <div className='flex items-center gap-3'>
          <Sparkle className='w-6 text-[#4A7AFF]' />
          <h1 className='text-xl font-semibold'>Object Removal</h1>
        </div>
        <p className='mt-6 text-sm font-medium'>Upload Image</p>
        <input onChange={(e) => setInput(e.target.files[0])} accept='image/*'
          type='file' rows={4} className='w-full p-2 px-3 mt-2 outline-none text-sm 
            rounded-md border border-gray-300 cursor-pointer text-gray-600' required />
        <p className='mt-4 text-sm font-medium'>Describe Object Name to Remove</p>
        <textarea onChange={(e) => setObject(e.target.value)}
          value={object} rows={4} className='w-full p-2 px-3 mt-2 outline-none text-sm 
            rounded-md border border-gray-300'
          placeholder='e.g Watch on Spoon, Only Single Name Object' required />
        <button disabled={loading} className='w-full flex justify-center items-center gap-2 bg-gradient-to-r
            from-[#417DF6] to-[#8E37EB] text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer'>
          {
            loading ?
              <span className='w-4 h-4 my-1 rounded-full border-2 border-t-transparent animate spin'></span> :
              <Scissors className='w-5' />

          }
          Remove Object
        </button>
      </form>
      {/* right col */}
      <div className="w-full max-w-lg p-4 bg-white 
    rounded-lg flex flex-col border border-gray-200 min-h-96">
        <div className='flex items-center gap-3'>
          <Scissors className='w-5 h-5 text-[#4A7AFF]' />
          <h1 className="text-xl font-semibold"> Processed Image</h1>
        </div>
        {
          !content ?
            (<div className="flex-1 flex justify-center items-center">
              <div className="text-sm flex flex-col items-center gap-5 text-gray-400">
                <Scissors className='w-9 h-5 text-[#4A7AFF]' />
                <p>Upload an Image & Describe What You Want to Remove</p>
              </div>
            </div>) : (
              <img src={content} alt="" className='h-full w-full mt-3' />
            )
        }

      </div>
    </div>)
}

export default RemoveObject;