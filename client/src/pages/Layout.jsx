import React, { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom';
import { assets } from '../assets/assets'
import { Menu, X } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { SignIn, useUser } from '@clerk/clerk-react';

const Layout = () => {
  const navigate = useNavigate();
  const [sideBar, setSideBar] = useState(false);
  const { isLoaded, user } = useUser();

  if (!isLoaded) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <SignIn />
      </div>
    );
  }

  return (
    <div className='flex flex-col h-screen'>
      <nav className='w-full px-8 min-h-14 flex items-center justify-between border-b border-gray-200 cursor-pointer'>
        <img src={assets.logo} className="cursor-pointer w-32 sm:w-44" alt="" 
        onClick={() => navigate('/')} />

        {
          sideBar ? (
            <X onClick={() => setSideBar(false)} className="w-6 h-6 text-gray-600 sm:hidden" />
          ) : (
            <Menu onClick={() => setSideBar(true)} className="w-6 h-6 text-gray-600 sm:hidden" />
          )
        }
      </nav>

     <div className="flex-1 flex h-[calc(100vh-64px)] overflow-hidden">
  
  <Sidebar sideBar={sideBar} setSideBar={setSideBar} />

  <div className="flex-1 overflow-y-auto">
    <Outlet />
  </div>

</div>
    </div>
  );
}

export default Layout;