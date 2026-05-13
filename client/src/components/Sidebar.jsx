import { useClerk, useUser } from '@clerk/clerk-react'
import { House, SquarePen, Hash, Image, Eraser, Scissors, FileText, Users, LogOut } from 'lucide-react';
import React from 'react'
import { NavLink } from 'react-router-dom';


const Sidebar = ({ sideBar, setSideBar }) => {

  const navItems = [
    { to: '/ai', label: 'Dashboard', icon: House },
    { to: '/ai/write-article', label: 'Write Article', icon: SquarePen },
    { to: '/ai/blog-title', label: 'Blog Title', icon: Hash },
    { to: '/ai/generate-image', label: 'Generate Images', icon: Image },
    { to: '/ai/remove-background', label: 'Remove Background', icon: Eraser },
    { to: '/ai/remove-object', label: 'Remove Object', icon: Scissors },
    { to: '/ai/review-resume', label: 'Review Resume', icon: FileText },
    { to: '/ai/community', label: 'Community', icon: Users }
  ];

  const { user } = useUser();
  const { signOut, openUserProfile } = useClerk();

  return (
    <div className={`w-60 bg-white border-r 
    border-gray-200 flex flex-col justify-between 
    items-center max-sm:absolute top-14 bottom-0 ${sideBar ? 'translate-x-0' : 'max-sm:-translate-x-full'} transition-all duration-300 ease-in-out`}>

      <div className='my-7 w-full'>
        <img src={user.imageUrl} className='w-10 cursor-pointer rounded-full mx-auto' />
        <h1 className='mt-1 text-center'>{user.fullName}</h1>

        <div className='px-6 mt-5 text-sm text-gray-600 font-medium'>
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/ai'}
              onClick={() => setSideBar(false)}
              className={({ isActive }) =>
                `px-3.5 py-2.5 flex items-center gap-3 rounded ${
                  isActive
                    ? 'bg-gradient-to-r from-[#3c81f6] to-[#9234EA] text-white'
                    : ''
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : ''}`} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
<div className="w-full border-t border-gray-200 p-4 px-7 flex items-center justify-between">
    <div onClick={openUserProfile} className='flex gap-2 items-center cursor-pointer'>
        <img src={user.imageUrl} className='w-8 cursor-pointer rounded-full' />
        <div>
            <h1 className='text-sm font-medium'>{user.fullName}</h1>
            <p className='text-xs text-gray-500'>
                Plan
            </p>
        </div>
    </div>
    <LogOut onClick={signOut} className='w-4.5 text-gray-400
     hover:text-gray-700 transition cursor-pointer'/>
</div>
    </div>
  )
}

export default Sidebar