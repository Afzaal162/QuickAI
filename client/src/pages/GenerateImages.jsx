import { useState } from 'react';
import React from 'react';
import { Image, Sparkle, Download } from 'lucide-react' // Added Download icon
import toast from 'react-hot-toast';
import { useAuth } from '@clerk/clerk-react';
import axios from '../lib/axiosInstance';

const GenerateImages = () => {
  const ImageStyle = ['Realistic', 'Ghibli style', "Anime style", 'Cartoon style', "Fantasy style",
    "Realistic style", "3D style", "Portrait style"]
  const [selectedStyle, setSelectedStyle] = useState('Realistic');
  const [publish, setPublish] = useState(false)
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false); // Fixed: Initialized as boolean false
  const [content, setContent] = useState("");
  const [downloading, setDownloading] = useState(false); // Added downloading state
  const { getToken } = useAuth();

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    try {
      setLoading(true)
      const prompt = `Generate Image of ${input} in the style ${selectedStyle}`
      const { data } = await axios.post('/api/ai/generate-image', { prompt, publish },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      )
      if (data.success) {
        setContent(data.content)
      }
      else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
    setLoading(false)
  }

  // --- NEW: Download Handler Function ---
  const handleDownload = async () => {
    if (!content) return;
    try {
      setDownloading(true);
      const response = await fetch(content);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `ai-image-${Date.now()}.png`; // File name format
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      
      toast.success("Image downloaded successfully!");
    } catch (error) {
      toast.error("Failed to download image. Try right-clicking to save.");
      console.error(error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className='overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700'>
      {/* left col */}
      <form onSubmit={onSubmitHandler} className='w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200'>
        <div className='flex items-center gap-3'>
          <Sparkle className='w-6 text-[#00AD25]' />
          <h1 className='text-xl font-semibold'>AI Image Generator</h1>
        </div>
        <p className='mt-6 text-sm font-medium'>Describe Your Image</p>
        <textarea onChange={(e) => setInput(e.target.value)}
          value={input} rows={4} className='w-full p-2 px-3 mt-2 outline-none text-sm 
            rounded-md border border-gray-300'
          placeholder='Describe What You Want to See in Your Image' required />
        <p className='mt-4 text-sm font-medium'>Style</p>
        <div className='mt-3 flex gap-3 flex-wrap sm:max-w-9/11'>
          {ImageStyle.map((item, index) => (
            <span onClick={() => setSelectedStyle(item)}
              className={`text-xs px-4 py-1 border rounded-full cursor-pointer 
                  ${selectedStyle === item ? "bg-green-50 text-green-700 "
                  : "text-gray-500 border-gray-300"}`}
              key={item}> {item}</span>
          ))}
        </div>
        <div className="my-6 flex items-center gap-2">
          <label className="relative cursor-pointer">
            {/* Fixed: changed e.target.check to e.target.checked */}
            <input type="checkbox" onChange={(e) => setPublish(e.target.checked)}
              checked={publish} className="sr-only peer" />
            <div className="w-9 h-5 bg-slate-300 rounded-full
                  peer-checked:bg-green-500 transition-all"></div>
            <span className='absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-all
                  peer-checked:translate-x-4'></span>
          </label>
          <p className="text-sm">Make This Image Public</p>
        </div>
        <br />
        <button disabled={loading} className='w-full flex justify-center items-center gap-2 bg-gradient-to-r
            from-[#00AD25] to-[#04FF50] text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer disabled:opacity-50'>
          {
            loading ? <span className='w-4 h-4 my-1 rounded-full border-2 border-t-transparent animate-spin'></span> :
              <Image className='w-5' />
          }
          Generate Image
        </button>
      </form>

      {/* right col */}
      <div className="w-full max-w-lg p-4 bg-white 
    rounded-lg flex flex-col border border-gray-200 min-h-96 max-h-[600px]">
        <div className='flex items-center gap-3'>
          <Image className='w-5 h-5 text-[#00AD25]' />
          <h1 className="text-xl font-semibold"> Generated Image</h1>
        </div>
        {
          !content ? (
            <div className="flex-1 flex justify-center items-center">
              <div className="text-sm flex flex-col items-center gap-5 text-gray-400">
                <Image className='w-9 h-5 text-[#00AD25]' />
                <p>Enter a Topic and Click "Generate Image" to Get Started</p>
              </div>
            </div>
          ) : (
            /* Added "relative group" to wrapper for positioning and hover effect */
            <div className='mt-3 h-full relative group overflow-hidden rounded-lg'>
              <img src={content} alt="AI Generated" className='w-full h-full object-contain' />
              
              {/* --- NEW: Floating Download Button (Top-Right Corner) --- */}
              <button 
                onClick={handleDownload}
                disabled={downloading}
                title="Download Image"
                className="absolute top-3 right-3 p-2.5 bg-white/80 hover:bg-white text-gray-800 
                rounded-full shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-105 
                flex items-center justify-center cursor-pointer disabled:opacity-50"
              >
                {downloading ? (
                  <span className='w-5 h-5 rounded-full border-2 border-gray-600 border-t-transparent animate-spin'></span>
                ) : (
                  <Download className="w-5 h-5 text-gray-700" />
                )}
              </button>
            </div>
          )
        }
      </div>
    </div>
  )
}

export default GenerateImages;