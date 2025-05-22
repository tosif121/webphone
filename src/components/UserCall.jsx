import React from 'react';
import { Input } from './ui/input';
import maskPhoneNumber from '@/utils/maskPhoneNumber';

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
          'max-w-lg p-3 bg-white rounded-lg shadow-[0px_0px_7px_0px_rgba(0,0,0,0.1)] dark:bg-[#333]') ||
        'p-3'
      }`}
    >
      <form>
        <div className="grid grid-cols-2 gap-2 md:gap-4">
          <Input
            label="First Name"
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
          />
          <Input label="Last Name" type="text" name="lastName" value={formData.lastName} onChange={handleChange} />
          <Input
            label="Mobile Number"
            type="text"
            name="number"
            value={maskPhoneNumber(formData.number)}
            onChange={handleChange}
            placeholder="Enter Primary Number"
          />
          <Input
            label="Alternate Number"
            type="text"
            name="alternateNumber"
            value={formData.alternateNumber}
            onChange={handleChange}
            placeholder="Enter Alternate Number"
          />
          <Input
            label="Address"
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Enter Address Line 1"
          />
          <Input
            label="State"
            type="text"
            name="state"
            value={formData.state}
            onChange={handleChange}
            placeholder="Enter State"
          />
          <Input
            label="District"
            type="text"
            name="district"
            value={formData.district}
            onChange={handleChange}
            placeholder="Enter District"
          />
          <Input
            label="City"
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="Enter City"
          />
          <Input
            label="Postal Code"
            type="text"
            name="postalCode"
            value={formData.postalCode}
            onChange={handleChange}
            placeholder="Enter Postal Code"
          />
          <Input
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
