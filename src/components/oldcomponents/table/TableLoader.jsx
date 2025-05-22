import React from 'react';

const TableLoader = () => {
  return (
    <div className="space-y-4 bg-white shadow-md p-3 rounded-md dark:bg-[#1F1F1F]">
      {Array(10)
        .fill('')
        .map((_, index) => (
          <span key={index} role="status" className="w-full block animate-pulse md:p-2">
            <span className="flex items-center gap-x-5">
              {[...Array(6)].map((_, i) => (
                <span key={i} className="w-60 block h-4 bg-gray-200 rounded-full dark:bg-gray-700"></span>
              ))}
            </span>
          </span>
        ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default TableLoader;
