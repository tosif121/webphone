import React from 'react';

const InputField = ({ name, type, value, disabled, onChange, label, placeholder, error, onInput, className }) => (
  <div>
    <label className="input-label">{label}</label>
    <div className="flex">
      {type === 'tel' && (
        <span className="inline-flex items-center px-4 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 dark:bg-gray-500 dark:text-white dark:border-[#4D4D4D] text-gray-500">
          +91
        </span>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        onKeyPress={onInput}
        maxLength={type === 'tel' ? 10 : undefined}
        className={`${
          type === 'tel' ? 'rounded-r-lg' : 'rounded-md'
        } border border-gray-300 bg-white placeholder:capitalize dark:border-[#4D4D4D] dark:placeholder:text-white dark:bg-transparent focus:border-primary outline-none block w-full p-2.5 leading-5 text-gray-700 dark:text-white ${
          className || ''
        } ${disabled ? '!bg-zinc-300/60' : ''}`}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
    {error && <p className="error-msg">{error}</p>}
  </div>
);

// Radio Button Component
const RadioButton = ({ name, options, value, onChange, label, error, className }) => (
  <div className="mb-4">
    {label && <label className="input-label">{label}</label>}
    <div className="space-y-2">
      {options.map((option) => (
        <div key={option.value} className="flex items-center">
          <input
            type="radio"
            id={`${name}-${option.value}`}
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={onChange}
            className={`w-4 h-4 text-primary bg-gray-100 border-gray-300 focus:ring-primary dark:bg-gray-700 dark:border-gray-600 ${
              className || ''
            }`}
          />
          <label htmlFor={`${name}-${option.value}`} className="ml-2 text-sm font-medium text-gray-700 dark:text-white">
            {option.label}
          </label>
        </div>
      ))}
    </div>
    {error && <p className="error-msg">{error}</p>}
  </div>
);

// Select Box Component
const SelectBox = ({ name, options, value, onChange, label, placeholder, error, disabled, className }) => (
  <div className="mb-4">
    {label && <label className="input-label">{label}</label>}
    <select
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`rounded-md border border-gray-300 bg-white dark:border-[#4D4D4D] dark:bg-transparent focus:border-primary outline-none block w-full p-2.5 leading-5 text-gray-700 dark:text-white ${
        className || ''
      } ${disabled ? '!bg-zinc-300/60' : ''}`}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {error && <p className="error-msg">{error}</p>}
  </div>
);

export { InputField, RadioButton, SelectBox };
