import React, { useState } from 'react'
import { Sparkle, Layers, Download, Image as ImageIcon } from 'lucide-react';
import axios from '../lib/axiosInstance';
import { useAuth } from '@clerk/clerk-react';
import toast from 'react-hot-toast';

const RemoveBackground = () => {
  const [input, setInput] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
  const [downloading, setDownloading] = useState(false);
  const { getToken } = useAuth();

  // Handle local image selection for a quick preview
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setInput(file);
      setImagePreview(URL.createObjectURL(file));
      setContent(""); // Clear previous results
    }
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    if (!input) return toast.error("Please upload an image first");

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('image', input); // Sending the raw file

      const token = await getToken();

      // Sending request to your background removal endpoint
      const { data } = await axios.post('/api/ai/remove-image-background', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}` 
        }
      });

      if (data.success) {
        setContent(data.content); // Expecting a PNG URL or Base64 string
        toast.success("Background removed successfully!");
      } else {
        toast.error(data.message || "Failed to remove background");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!content) return;
    try {
      setDownloading(true);
      const response = await fetch(content);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `transparent-${Date.now()}.png`; // Saves as PNG to keep transparency
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error("Download failed");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className='overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700'>
      {/* Left Column: Upload Form */}
      <form onSubmit={onSubmitHandler} className='w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200'>
        <div className='flex items-center gap-3'>
          <Sparkle className='w-6 text-[#10B981]' />
          <h1 className='text-xl font-semibold'>Background Remover</h1>
        </div>
        
        <p className='mt-6 text-sm font-medium'>Upload Your Image</p>
        <input 
          onChange={handleFileChange} 
          accept='image/*'
          type='file' 
          className='w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300 cursor-pointer text-gray-600 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100' 
          required 
        />

        {/* Original Image Preview Box */}
        {imagePreview && (
          <div className='mt-4 p-2 border border-gray-100 rounded-lg bg-gray-50'>
            <p className='text-xs font-medium text-gray-400 mb-2'>Original Preview:</p>
            <img src={imagePreview} alt="Original" className='max-h-40 rounded object-contain mx-auto' />
          </div>
        )}

        <button disabled={loading} className='w-full flex justify-center items-center gap-2 bg-gradient-to-r from-[#10B981] to-[#059669] text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer disabled:opacity-50 transition-all font-medium'>
          {loading ? (
            <span className='w-4 h-4 my-1 rounded-full border-2 border-t-transparent animate-spin border-white'></span>
          ) : (
            <Layers className='w-5' />
          )}
          {loading ? "Removing Background..." : "Remove Background"}
        </button>
      </form>

      {/* Right Column: Transparent Result Display */}
      <div className="w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-[400px]">
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center gap-3'>
            <ImageIcon className='w-5 h-5 text-[#10B981]' />
            <h1 className="text-xl font-semibold">Result (Transparent PNG)</h1>
          </div>
          
          {/* Top-right Corner Download Feature */}
          {content && (
            <button 
              onClick={handleDownload}
              disabled={downloading}
              title="Download Transparent Image"
              className='p-2 bg-emerald-50 text-emerald-600 rounded-full hover:bg-emerald-100 transition-all flex items-center justify-center cursor-pointer shadow-sm'
            >
              {downloading ? (
                <div className='w-5 h-5 border-2 border-emerald-600 border-t-transparent animate-spin rounded-full' />
              ) : (
                <Download className='w-5 h-5' />
              )}
            </button>
          )}
        </div>

        {content ? (
          /* Notice the background grid pattern here. If the background is truly gone, you will see the grids behind your subject! */
          <div className='relative w-full flex-1 min-h-[300px] rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center bg-gray-100 bg-[size:20px_20px] bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)]'>
            <img src={content} alt="Background Removed" className='relative z-10 max-w-full max-h-[350px] object-contain drop-shadow-md' />
          </div>
        ) : (
          <div className="flex-1 flex justify-center items-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 min-h-[300px]">
            <div className="text-sm flex flex-col items-center gap-4 text-gray-400">
              <Layers className='w-12 h-12 opacity-20 text-[#10B981]' />
              <p>Upload an image and hit process to see it isolated.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default RemoveBackground;