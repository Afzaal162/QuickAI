import React from 'react'
import { assets } from '../assets/assets'

const Testimonial = () => {
    return (
        <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
                What Our Customers Say
            </h1>

            <p className="text-sm md:text-base text-gray-500 mt-4">
                Join thousands of successful customers who transformed their careers with us
            </p>

            <div className="flex flex-wrap justify-center gap-5 mt-16 text-center">

                {/* Card 1 */}
              <div className="p-8 m-4 max-w-xs rounded-lg bg-[#FDFDFE]
                     shadow-lg border border-gray-100 hover:-translate-y-1 
                     transition-all duration-300 cursor-pointer">

                    {/* ⭐ Stars */}
                    <div className="flex gap-1 justify-center">
                        {Array(5).fill(0).map((_, i) => (
                            <img
                                key={i}
                                src={i < 5 ? assets.star_icon : assets.star_dull_icon}
                                className="w-4 h-4"
                            />
                        ))}
                    </div>

                    {/* 📝 Description */}
                    <p className="text-sm mt-3 text-gray-500">
                        PrebuiltUI strikes the perfect balance between flexibility, simplicity and visual consistency.
                    </p>
                    <hr className="my-4 border-gray-300" />

                    {/* 👤 User */}
                    <div className="flex items-center justify-center gap-3 mt-4">
                        <img
                            className="h-12 w-12 rounded-full"
                            src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=100"
                            alt="Donald Jackman"
                        />
                        <div>
                            <h2 className="text-lg font-medium text-gray-900">
                                Donald Jackman
                            </h2>
                            <p className="text-sm text-gray-500">
                                SWE 1 @ Amazon
                            </p>
                        </div>
                    </div>
                </div>

                {/* Card 2 */}
               <div className="p-8 m-4 max-w-xs rounded-lg bg-[#FDFDFE]
                     shadow-lg border border-gray-100 hover:-translate-y-1 
                     transition-all duration-300 cursor-pointer">
                    <div className="flex gap-1 justify-center">
                        {Array(5).fill(0).map((_, i) => (
                            <img
                                key={i}
                                src={i < 4 ? assets.star_icon : assets.star_dull_icon}
                                className="w-4 h-4"
                            />
                        ))}
                    </div>

                    <p className="text-sm mt-3 text-gray-500">
                        Clean layouts, responsive design and easy integration make PrebuiltUI incredibly valuable.
                    </p>
                    <hr className="my-4 border-gray-300" />

                    <div className="flex items-center justify-center gap-3 mt-4">
                        <img
                            className="h-12 w-12 rounded-full"
                            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100"
                            alt="Richard Nelson"
                        />
                        <div>
                            <h2 className="text-lg font-medium text-gray-900">
                                Richard Nelson
                            </h2>
                            <p className="text-sm text-gray-500">
                                SWE 2 @ Amazon
                            </p>
                        </div>
                    </div>
                </div>

                {/* Card 3 */}
                <div className="p-8 m-4 max-w-xs rounded-lg bg-[#FDFDFE]
                     shadow-lg border border-gray-100 hover:-translate-y-1 
                     transition-all duration-300 cursor-pointer">
                    <div className="flex gap-1 justify-center">
                        {Array(5).fill(0).map((_, i) => (
                            <img
                                key={i}
                                src={i < 3 ? assets.star_icon : assets.star_dull_icon}
                                className="w-4 h-4"
                            />
                        ))}
                    </div>

                    <p className="text-sm mt-3 text-gray-500">
                        This library helped me ship client projects faster with better and beautiful design experience.
                    </p>
                    <hr className="my-4 border-gray-300" />

                    <div className="flex items-center justify-center gap-3 mt-4">
                        <img
                            className="h-12 w-12 rounded-full"
                            src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=100&h=100&auto=format&fit=crop"
                            alt="James Washington"
                        />
                        <div>
                            <h2 className="text-lg font-medium text-gray-900">
                                James Washington
                            </h2>
                            <p className="text-sm text-gray-500">
                                SWE 2 @ Google
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}

export default Testimonial