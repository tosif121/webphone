import React, { useEffect } from 'react';
import { IoIosClose } from 'react-icons/io';

const Modal = ({ isOpen, onClose, title, handleSubmit, children, loading }) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }

    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isOpen]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center dark:bg-gray-900/60 bg-black/60"
      onClick={handleOverlayClick}
    >
      <div
        className="max-w-lg bg-white dark:bg-[#131212] w-full mx-4 rounded-lg shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-3 border-b dark:border-[#999]">
          <h2 className="md:text-xl text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <IoIosClose size={30} />
          </button>
        </div>
        <div className="">{children}</div>
        <div className="flex justify-end p-3 border-t mt-1 dark:border-[#999] gap-x-4">
          {handleSubmit && (
            <button onClick={handleSubmit} className="primary-btn" disabled={loading}>
              Save
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="secondary-btn">
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
