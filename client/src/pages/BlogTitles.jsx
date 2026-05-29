import { useState } from 'react';
import { Sparkles, Edit, Hash, Copy, Check } from 'lucide-react';
import React from 'react'
import { useAuth } from '@clerk/clerk-react';
import toast from 'react-hot-toast';
import Markdown from 'react-markdown'
import axios from '../lib/axiosInstance'

const BlogTitles = () => {
  const blogCategories = ['General', "Technology", "Business", "Health", "LifeStyle", "Education", "Travel", "Food"]
  const [selectedCategory, setSelectedCategory] = useState('General');
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false); // New state for copy feedback
  const [loading, setLoading] = useState(false); // ⚡️ Cleaner: Initialize as boolean false
  const [content, setContent] = useState("");
  const { getToken } = useAuth();

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const prompt = `Give me 5 blog titles for the keyword "${input}". 
Return ONLY a numbered list. 
No introduction, no explanations, with ${selectedCategory}. 
Just the titles.`;

      const { data } = await axios.post('/api/ai/generate-blog-title', { prompt },
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
          <Hash className='w-6 text-[#8E37EB]' />
          <h1 className='text-xl font-semibold'>AI Title Generator</h1>
        </div>
        <p className='mt-6 text-sm font-medium'>Keyword</p>
        <input onChange={(e) => setInput(e.target.value)} value={input} type="text" className='w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300'
          placeholder='The Future of Artificial Intelligence is ...' required />
        
        <p className='mt-4 text-sm font-medium'>Category</p>
        <div className='mt-3 flex gap-3 flex-wrap sm:max-w-9/11'>
          {blogCategories.map((item) => (
            <span onClick={() => setSelectedCategory(item)}
              className={`text-xs px-4 py-1 border rounded-full cursor-pointer 
                  ${selectedCategory === item ? "bg-purple-50 text-purple-700 " : "text-gray-500 border-gray-300"}`}
              key={item}> {item}</span>
          ))}
        </div>
        <br />
        <button disabled={loading} className='w-full flex justify-center items-center gap-2 bg-gradient-to-r from-[#C341F6] to-[#8E37EB] text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer disabled:opacity-50'>
          {/* ⚡️ FIXED: Fixed 'animate-spin' class name string */}
          {loading ? <span className='w-4 h-4 my-1 rounded-full border-2 border-t-transparent animate-spin'></span>
            : <Hash className='w-5' />
          }
          Generate Title
        </button>
      </form>

      {/* right col */}
      <div className="w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96">
        <div className='flex items-center gap-3'>
          <Hash className='w-5 h-5 text-[#8E37EB]' />
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
        {!content ? (
          <div className="flex-1 flex justify-center items-center">
            <p className="text-gray-400">Enter a Topic and Click "Generate Title"</p>
          </div>
        ) : (
          <div className='mt-3 flex-1 overflow-y-auto text-sm text-slate-600 custom-scrollbar'>
            <div className='reset-tw'>
              <Markdown>{content}</Markdown>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default BlogTitles;