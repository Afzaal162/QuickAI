import React, { useEffect, useState } from 'react';
import { useUser, useAuth } from "@clerk/clerk-react";
import { Heart } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

axios.defaults.baseURL = import.meta.VITE_BASE_URL;

const Community = () => {
  const [creations, setCreations] = useState([]);
  const [loading, setLoading] = useState(false);
  const { getToken } = useAuth();
  const { user } = useUser();

  const fetchCreations = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const { data } = await axios.get('/api/user/get-published-creation', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        setCreations(data.creations);
      } else {
        toast.error(data.message || "Failed to load creations");
      }
    } catch (error) {
      toast.error("Server connection failed");
    } finally {
      setLoading(false);
    }
  };

 const imageLikeToggle = async (id) => {
  // 1. Save a backup of the current state in case the API fails
  const originalCreations = [...creations];

  // 2. Update the UI Instantly (Optimistic Update)
  setCreations(prev => prev.map(item => {
    if (item._id === id || item.id === id) {
      const isLiked = item.likes.includes(user.id);
      return {
        ...item,
        likes: isLiked 
          ? item.likes.filter(uid => uid !== user.id) // Remove like
          : [...item.likes, user.id]                  // Add like
      };
    }
    return item;
  }));

  try {
    const token = await getToken();
    const { data } = await axios.post('/api/user/get-toggle-like', 
      { creationId: id }, 
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (data.success) {
      toast.success(data.message); // "Creation Liked"
      // Note: We DON'T call fetchCreations() here anymore!
    } else {
      // If the server says no, roll back to the original state
      setCreations(originalCreations);
      toast.error(data.message);
    }
  } catch (error) {
    // If the network fails, roll back
    setCreations(originalCreations);
    toast.error("Connection failed");
  }
};

  useEffect(() => {
    if (user) {
      fetchCreations();
    }
  }, [user]);

  return !loading ? (
    <div className='flex-1 h-full flex flex-col gap-4 p-6'>
      <h1 className="text-xl font-bold">Community Creations</h1>
      
      <div className='bg-white h-full w-full rounded-xl overflow-y-scroll flex flex-wrap content-start'>
        {loading && <p className="p-10">Loading creations...</p>}
        
        {!loading && creations?.map((creation, index) => {
          const isImage = creation.type === 'image' || creation.content.startsWith('http');

          return (
            <div
              key={creation._id || index}
              className="relative group p-3 w-full sm:w-1/2 lg:w-1/3 cursor-pointer"
              onClick={() => !isImage && window.open(creation.url || '#', '_blank')}
            >
              <div className="w-full h-64 overflow-hidden rounded-lg bg-gray-100 border border-gray-200">
                {isImage ? (
                  <img
                    src={creation.content}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    alt="Creation"
                  />
                ) : (
                  <div className="p-4 flex flex-col h-full bg-white">
                    <span className="text-[10px] font-bold text-blue-600 uppercase mb-1">Article</span>
                    <h3 className="text-md font-semibold text-gray-900 line-clamp-2">{creation.title || "Untitled"}</h3>
                    <p className="text-sm text-gray-500 mt-2 line-clamp-4">{creation.content}</p>
                    <div className="mt-auto text-[10px] text-gray-400 font-medium italic">Click to read full article</div>
                  </div>
                )}
              </div>

              {/* OVERLAY */}
              <div className="absolute inset-x-3 bottom-0 top-3 flex gap-2 items-end justify-end group-hover:justify-between p-4 group-hover:bg-gradient-to-b from-transparent to-black/80 text-white rounded-lg transition-all">
                <p className="text-sm hidden group-hover:block line-clamp-1 max-w-[70%]">
                  {creation.prompt || "View Details"}
                </p>

                <div className="flex gap-1 items-center bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md">
                  <p className="text-xs font-bold">{creation.likes?.length || 0}</p>
                  <Heart 
                    onClick={(e) => {
                      e.stopPropagation(); // Stops the article from opening when clicking like
                      imageLikeToggle(creation._id || creation.id);
                    }}
                    className={`w-5 h-5 hover:scale-125 transition-all cursor-pointer ${
                      creation.likes?.includes(user?.id)
                        ? 'fill-red-500 text-red-500'
                        : 'text-white'
                    }`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  ):(
    <div className="flex justify-center items-center h-full">
      <span className="w-10 h-10 my-1 rounded-full border-3 border-primary border-t-transparent animate-spin"></span>
    </div>
  )
};

export default Community;