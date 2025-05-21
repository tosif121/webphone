import React from 'react';
import { InputField } from './table/InputField';
import maskPhoneNumber from '../hooks/maskPhoneNumber';

const UserCall = ({ formData, setFormData, userCallOpen }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div
      className={`${
        (!userCallOpen &&
          'max-w-lg p-3 bg-white dark:bg-[#3333] rounded-lg shadow-[0px_0px_7px_0px_rgba(0,0,0,0.1)] dark:bg-[#333]') ||
        'p-3'
      }`}
    >
      <form>
        <div className="grid grid-cols-2 gap-2 md:gap-4">
          <InputField
            label="First Name"
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
          />
          <InputField label="Last Name" type="text" name="lastName" value={formData.lastName} onChange={handleChange} />
          <InputField
            label="Mobile Number"
            type="text"
            name="number"
            value={maskPhoneNumber(formData.number)}
            onChange={handleChange}
            placeholder="Enter Primary Number"
          />
          <InputField
            label="Alternate Number"
            type="text"
            name="alternateNumber"
            value={formData.alternateNumber}
            onChange={handleChange}
            placeholder="Enter Alternate Number"
          />
          <InputField
            label="Address"
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Enter Address Line 1"
          />
          <InputField
            label="State"
            type="text"
            name="state"
            value={formData.state}
            onChange={handleChange}
            placeholder="Enter State"
          />
          <InputField
            label="District"
            type="text"
            name="district"
            value={formData.district}
            onChange={handleChange}
            placeholder="Enter District"
          />
          <InputField
            label="City"
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="Enter City"
          />
          <InputField
            label="Postal Code"
            type="text"
            name="postalCode"
            value={formData.postalCode}
            onChange={handleChange}
            placeholder="Enter Postal Code"
          />
          <InputField
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter Email Address"
          />
        </div>

        <div className="mt-2">
          <label className="input-label">Comment</label>
          <textarea
            name="comment"
            value={formData.comment}
            onChange={handleChange}
            placeholder="Enter Your comment here!"
            className="input-box"
          />
        </div>
      </form>
    </div>
  );
};

export default UserCall;
