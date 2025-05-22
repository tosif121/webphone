import React, { useState, useEffect } from 'react';
import { IoIosClose } from 'react-icons/io';
import { formData } from './formData';

const DynamicForm = ({ campaign, onClose }) => {
  const [currentSection, setCurrentSection] = useState(1);
  const [formState, setFormState] = useState({});
  const [history, setHistory] = useState([1]);
  
  const currentSectionData = formData.sections.find((section) => section.id === currentSection);

  const handleInputChange = (name, value) => {
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const getNextSection = () => {
    if (!currentSectionData) return null;

    if (currentSectionData.isDynamicSection) {
      const dynamicField = currentSectionData.fields.find((field) => field.isDynamicOption);
      if (dynamicField) {
        const selectedOption = dynamicField.options.find((opt) => opt.value === formState[dynamicField.name]);
        if (selectedOption?.nextSection) {
          return selectedOption.nextSection;
        }
      }
    }

    if (currentSectionData.nextSection === 'submit') {
      return 'submit';
    } else if (currentSectionData.nextSection === 'next') {
      return currentSection + 1;
    } else if (typeof currentSectionData.nextSection === 'number') {
      return currentSectionData.nextSection;
    }

    return null;
  };

  const handlePreviousSection = () => {
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop();
      setCurrentSection(newHistory[newHistory.length - 1]);
      setHistory(newHistory);
    }
  };

  const handleNextSection = () => {
    const nextSection = getNextSection();
  
    if (nextSection === 'submit') {
      console.log('Form submitted:', formState);
      onClose();
    } else if (nextSection) {
      setHistory((prev) => [...prev, nextSection]);
      setCurrentSection(nextSection);
    }
  };
  
  const renderRating = (field) => (
    <div className="flex space-x-2">
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          key={rating}
          type="button"
          className={`w-10 h-10 rounded-full ${
            formState[field.name] === rating
              ? 'bg-blue-500 text-white'
              : 'bg-white border border-gray-300 hover:bg-gray-50'
          }`}
          onClick={() => handleInputChange(field.name, rating)}
        >
          {rating}
        </button>
      ))}
    </div>
  );

  const renderField = (field) => {
    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            className="input-box"
            placeholder={field.label}
            value={formState[field.name] || ''}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            required={field.required}
          />
        );

      case 'select':
      case 'multiple-options':
        return (
          <select
            className="input-box"
            value={formState[field.name] || ''}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            required={field.required}
          >
            <option className="input-box dark:bg-[#333]" value="">
              Select {field.label}
            </option>
            {field.options.map((option) => (
              <option key={option.value} value={option.value} className="input-box dark:bg-[#333]">
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'date':
        return (
          <input
            type="date"
            className="input-box"
            value={formState[field.name] || ''}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            required={field.required}
          />
        );

      case 'time':
        return (
          <input
            type="time"
            className="input-box"
            value={formState[field.name] || ''}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            required={field.required}
          />
        );

      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options.map((option) => (
              <label
                key={option.value}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition"
              >
                <input
                  type="checkbox"
                  className="peer hidden"
                  checked={formState[field.name]?.includes(option.value) || false}
                  onChange={(e) => {
                    const currentValues = formState[field.name] || [];
                    const newValues = e.target.checked
                      ? [...currentValues, option.value]
                      : currentValues.filter((v) => v !== option.value);
                    handleInputChange(field.name, newValues);
                  }}
                />
                <div className="w-5 h-5 border-2 border-gray-400 rounded-md flex items-center justify-center peer-checked:bg-primary peer-checked:border-primary transition">
                  {formState[field.name]?.includes(option.value) && (
                    <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M5 13l4 4L19 7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <span className="text-sm text-gray-700 dark:text-white">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 'rating':
        return renderRating(field);

      default:
        return null;
    }
  };

  if (!currentSectionData) {
    return <div className="p-4">Loading...</div>;
  }

  if (!campaign) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    if (campaign) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }

    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [campaign]);

  return (
    <>
      <div className="fixed inset-0 z-[51] flex items-center justify-center bg-black/60">
        <div className="w-full max-w-xl bg-white shadow-lg rounded-xl p-3">
          <div className="flex items-center justify-between p-3 border-b">
            <h1 className="text-xl font-semibold">{currentSectionData?.title || formData.formTitle}</h1>
            <button onClick={onClose}>
              <IoIosClose size={30} />
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleNextSection();
            }}
          >
            <div className="p-4 space-y-4 max-h-72 overflow-y-auto">
              {currentSectionData?.fields.map((field) => (
                <div key={field.name} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {field.question || field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {renderField(field)}
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-4 p-4 border-t">
              {history.length > 1 && (
                <button
                  type="button"
                  className="px-4 py-2 border rounded-md hover:bg-gray-50"
                  onClick={handlePreviousSection}
                >
                  Previous
                </button>
              )}

              <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
                {getNextSection() === 'submit' ? 'Submit' : 'Next'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default DynamicForm;
