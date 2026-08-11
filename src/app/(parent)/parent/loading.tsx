import React from 'react'

export default function Loading() {
  return (
    <div className="p-6 md:p-10 space-y-8 animate-pulse w-full max-w-[1600px] mx-auto">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="h-10 w-48 bg-white/5 rounded-lg mb-2"></div>
          <div className="h-5 w-72 bg-white/5 rounded-lg"></div>
        </div>
        <div className="h-12 w-32 bg-white/5 rounded-xl"></div>
      </div>
      
      {/* Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white/5 p-6 rounded-3xl h-32 flex flex-col justify-between">
            <div className="flex justify-between items-start">
               <div className="w-12 h-12 rounded-xl bg-white/5"></div>
               <div className="h-6 w-16 bg-white/5 rounded-full"></div>
            </div>
            <div className="h-4 w-24 bg-white/5 rounded-md"></div>
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white/5 rounded-[2.5rem] p-8 h-96">
          <div className="h-8 w-40 bg-white/5 rounded-lg mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-12 w-full bg-white/5 rounded-xl"></div>)}
          </div>
        </div>
        <div className="bg-white/5 rounded-[2.5rem] p-8 h-96">
           <div className="h-8 w-32 bg-white/5 rounded-lg mb-8"></div>
           <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-16 w-full bg-white/5 rounded-xl"></div>)}
          </div>
        </div>
      </div>
    </div>
  )
}
