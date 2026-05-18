import React, { useEffect, useState } from 'react'
import { useAuth, Protect } from '@clerk/clerk-react'
import { Gem, Sparkles, Loader2 } from 'lucide-react' // Added Loader icon
import CreationItem from '../components/CreationItem'
import axios from 'axios'
import toast from 'react-hot-toast'

axios.defaults.baseURL = import.meta.env.DEV 
  ? 'http://localhost:3000' 
  : 'https://quick-ai-server-7fzzdc43e-afzaal-hassans-projects.vercel.app';

axios.defaults.withCredentials = true;
const Dashboard = () => {
  const [creations, setCreations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getToken } = useAuth();

 const getDashboardData = async () => {
  setLoading(true); // Start loading spinner
  try {
    const token = await getToken();
    
    if (!token) {
      console.warn("No token found yet");
      return; 
    }

    // Ensure the endpoint matches your backend route exactly
    const { data } = await axios.get('/api/user/get-user-creation', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (data.success) {
      // Logic: Update the state with the 'creations' array from backend
      setCreations(data.creations || []); 
    } else {
      toast.error(data.message || "Failed to fetch data");
    }
  } catch (error) {
    console.error("AXIOS ERROR:", error.response?.data || error.message);
    toast.error("Server error while fetching dashboard");
  } finally {
    setLoading(false); // Stop loading spinner regardless of success/fail
  }
};
  useEffect(() => {
    getDashboardData();
  }, []);

  return (
    <div className='h-full w-full overflow-y-scroll p-6 bg-gray-50/50'>
      <div className='flex justify-start gap-4 flex-wrap'>
        
        {/* Total Creations Card */}
        <div className='flex justify-between items-center w-72 p-4 px-6 bg-white rounded-xl border border-gray-200 shadow-sm'>
          <div className='text-slate-600'>
            <p className='text-sm font-medium'>Total Creations</p>
            <h2 className='text-2xl font-bold text-slate-800'>{creations.length}</h2>
          </div>
          <div className='w-10 h-10 rounded-lg bg-gradient-to-br from-[#3588F2] to-[#0BB0D7] text-white flex justify-center items-center'>
            <Sparkles className='w-5' />
          </div>
        </div>

        {/* Active Plan Card */}
        <div className='flex justify-between items-center w-72 p-4 px-6 bg-white rounded-xl border border-gray-200 shadow-sm'>
          <div className='text-slate-600'>
            <p className='text-sm font-medium'>Active Plan</p>
            <h2 className='text-2xl font-bold text-slate-800'>
              <Protect fallback={<span>Free</span>}>
                Premium
              </Protect>
            </h2>
          </div>
          <div className='w-10 h-10 rounded-lg bg-gradient-to-br from-[#FF61C5] to-[#9E53EE] text-white flex justify-center items-center'>
            <Gem className='w-5' />
          </div>
        </div>
      </div>

      <div className='mt-8'>
        <div className='flex items-center justify-between mb-4'>
            <p className='font-semibold text-slate-800 text-lg'>Recent Creations</p>
            <button onClick={getDashboardData} className='text-xs text-blue-600 hover:underline'>Refresh</button>
        </div>
        
        {/* --- CONDITIONAL RENDERING BLOCK --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            // 1. Loading State
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <p>Fetching your masterpieces...</p>
            </div>
          ) : creations.length > 0 ? (
            // 2. Success State (Data found)
            creations.map((item) => (
              <CreationItem 
                key={item.id} 
                item={item} 
              />
            ))
          ) : (
            // 3. Empty State (No data)
            <div className="col-span-full bg-white border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
              <p className="text-gray-500 mb-2">You haven't created anything yet.</p>
              <p className="text-sm text-gray-400">Start creating to see your history here!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard;