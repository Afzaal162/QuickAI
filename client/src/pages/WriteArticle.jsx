import React, { useState } from 'react'
import { Edit, Sparkles, Copy, Check } from 'lucide-react' // Added Copy and Check icons
import { useAuth } from '@clerk/clerk-react';
import axios from '../lib/axiosInstance';
import toast from 'react-hot-toast';
import Markdown from 'react-markdown'

const WriteArticle = () => {
  const articleLength = [
    { length: 800, text: 'Short(500-800 Words)' },
    { length: 1200, text: 'Medium(800-1200 Words)' },
    { length: 1600, text: 'Long(1200+ Words)' }, // Fixed a quick typo here from 'Short' to 'Long'
  ]

  const [selectedLength, setSelectedLength] = useState(articleLength[0]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false); // Fixed: initialized as false instead of ""
  const [content, setContent] = useState("");
  const [copied, setCopied] = useState(false); // New state for copy feedback
  const { getToken } = useAuth();

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    try {
      setLoading(true)
      const prompt = `Write an Article about ${input} is ${selectedLength.text}`
      const { data } = await axios.post('/api/ai/generate-article', { prompt, length: selectedLength.length }, {
        headers: { Authorization: `Bearer ${await getToken()}` }
      })
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

  // Function to handle clipboard copying
  const handleCopy = async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success("Copied to clipboard!");
      
      // Reset visual feedback after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      toast.error("Failed to copy text");
    }
  };

  return (
    <div className='h-full w-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700'>
      {/* left col */}
      <form onSubmit={onSubmitHandler} className='w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200'>
        <div className='flex items-center gap-3'>
          <Sparkles className='w-6 text-[#4A7AFF]' />
          <h1 className='text-xl font-semibold'>Article Configuration</h1>
        </div>
        <p className='mt-6 text-sm font-medium'> Article Topic</p>
        <input onChange={(e) => setInput(e.target.value)} value={input} type="text" className='w-full p-2 px-3 mt-2 outline-none text-sm 
        rounded-md border border-gray-300'
          placeholder='The Future of Artificial Intelligence is ...' required />
        <p className='mt-4 text-sm font-medium'>Article Length</p>
        <div className='mt-3 flex gap-3 flex-wrap sm:max-w-9/11'>
          {articleLength.map((item, index) => (
            <span onClick={() => setSelectedLength(item)}
              className={`text-xs px-4 py-1 border rounded-full cursor-pointer 
              ${selectedLength.text === item.text ? "bg-blue-50 text-blue-700 "
                  : "text-gray-500 border-gray-300"}`}
              key={index}> {item.text}</span>
          ))}
        </div>
        <br />
        <button disabled={loading} className='w-full flex justify-center items-center gap-2 bg-gradient-to-r
        from-[#226BFF] to-[#65ADFF] text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer disabled:opacity-50'>
          {
            loading ? <span className='w-4 h-4 my-1 rounded-full border-2 border-t-transparent animate-spin'></span>
              : <Edit className='w-5' />
          }
          Generate Article
        </button>
      </form>

      {/* right col */}
      <div className="w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96 max-h-[600px]">
        {/* Adjusted header layout to space elements nicely */}
        <div className='flex items-center justify-between w-full pb-2 border-b border-gray-50'>
          <div className='flex items-center gap-3'>
            <Edit className='w-5 h-5 text-[#4A7AFF]' />
            <h1 className="text-xl font-semibold"> Generated Article</h1>
          </div>
          
          {/* Action Button: Visible only when content exists */}
          {content && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-green-600">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Content</span>
                </>
              )}
            </button>
          )}
        </div>

        {!content ? (
          <div className="flex-1 flex justify-center items-center">
            <div className="text-sm flex flex-col items-center gap-5 text-gray-400">
              <Edit className='w-9 h-5 text-[#4A7AFF]' />
              <p>Enter a Topic and Click "Generate Article" to Get Started</p>
            </div>
          </div>
        ) : (
          /* Swapped h-full for flex-1 overflow-y-auto to guarantee scrolling works elegantly inside the flex columns */
          <div className='mt-3 flex-1 overflow-y-auto text-sm text-slate-600 pr-1'>
            <div className='reset-tw'><Markdown>{content}</Markdown></div>
          </div>
        )}
      </div>
    </div>
  )
}

export default WriteArticle