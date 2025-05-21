import React, { useContext, useState, useCallback, useEffect } from 'react';
import { FaArrowRight } from 'react-icons/fa';
import { FiPhone } from 'react-icons/fi';
import axios from 'axios';
import HistoryContext from '../context/HistoryContext';
import { InputField } from './table/InputField';
import useFormatPhoneNumber from '../hooks/useFormatPhoneNumber';
import toast from 'react-hot-toast';

const AutoDial = ({ setPhoneNumber, dispositionModal, handleCall }) => {
  const { username } = useContext(HistoryContext);
  const [formData, setFormData] = useState({
    fullName: '',
    emailAddress: '',
    phoneNumber: '',
    address1: '',
    address2: '',
    country: '',
    city: '',
    postalCode: '',
    state: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [currentLeadId, setCurrentLeadId] = useState(null);
  const [isManualPhone, setIsManualPhone] = useState(false);
  const formatPhoneNumber = useFormatPhoneNumber();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  useEffect(() => {
    handleDial();
  }, []);

  useEffect(() => {
    if (dispositionModal) {
      handleNextLead();
    }
  }, [dispositionModal]);

  const handleDial = async () => {
    const payload = {
      user: username,
    };

    setIsLoading(true);
    try {
      const response = await axios.post(`${window.location.origin}/leadforautocall`, payload);

      if (response.data.result) {
        const result = response.data.result;
        setFormData({
          fullName: result.name || '',
          emailAddress: result.emailAddress || '',
          phoneNumber: result.number || '',
          address1: result.address || '',
          address2: result.address2 || '',
          country: result.country || '',
          city: result.city || '',
          postalCode: result.postalCode || '',
          state: result.state || '',
        });
        setCurrentLeadId(result.leadId);
        setIsManualPhone(false);
      } else {
        setIsManualPhone(true);
        setFormData({
          ...formData,
          phoneNumber: '',
        });
      }
    } catch (err) {
      console.error('Error submitting lead:', err);
      setIsManualPhone(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextLead = useCallback(async () => {
    const payload = {
      user: username,
      preleadid: currentLeadId,
      dialstatus: false,
    };
    if (formData.phoneNumber.length === 0) {
      // toast.error('No more leads for this campaign!');
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.post(`${window.location.origin}/nextleadforautocall`, payload);

      if (response.data.result) {
        const result = response.data.result;
        setFormData({
          fullName: result.name || '',
          emailAddress: result.emailAddress || '',
          phoneNumber: result.number || '',
          address1: result.address || '',
          address2: result.address2 || '',
          country: result.country || '',
          city: result.city || '',
          postalCode: result.postalCode || '',
          state: result.state || '',
        });
        setCurrentLeadId(result.leadId);
        setIsManualPhone(false);
      } else {
        setIsManualPhone(true);
        setFormData({
          ...formData,
          phoneNumber: '',
        });
      }
    } catch (err) {
      console.error('Error fetching next lead:', err);
      setIsManualPhone(true);
    } finally {
      setIsLoading(false);
    }
  }, [currentLeadId]);

  const handleLeadCall = async () => {
    if (formData.phoneNumber.length === 0) {
      toast.error('No more leads for this campaign!');
      return;
    }
    if (isManualPhone) {
      const formattedNumber = formatPhoneNumber(formData.phoneNumber);
      // setPhoneNumber(formattedNumber);
      handleCall(formattedNumber);
      return;
    }

    const payload = {
      caller: username,
      leaddata: {
        _id: currentLeadId,
        name: formData.fullName,
        number: formData.phoneNumber,
        address: formData.address1,
      },
    };
    setIsLoading(true);
    try {
      const response = await axios.post(`${window.location.origin}/leaddialnumber`, payload);
      if (response.data) {
        localStorage.setItem('dialing', true);
        setPhoneNumber(formData.phoneNumber);
      } else {
        console.error('Failed to initiate call:', response.data.message || 'Unknown error');
      }
    } catch (err) {
      console.error('Error calling API:', err.response?.data || err.message);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="max-w-lg p-3 bg-white dark:bg-[#3333] rounded-lg shadow-[0px_0px_7px_0px_rgba(0,0,0,0.1)] dark:bg-[#333]">
      <form>
        <div className="grid grid-cols-2 gap-2 md:gap-4">
          <InputField
            id="leadfullname"
            label="Full Name"
            name="fullName"
            type="text"
            placeholder="Enter full name"
            value={formData.fullName}
            onChange={handleInputChange}
            disabled
          />

          <InputField
            id="leademailaddress"
            label="Email Address"
            name="emailAddress"
            type="email"
            placeholder="Enter email address"
            value={formData.emailAddress}
            onChange={handleInputChange}
            disabled
          />

          <InputField
            id="leadphonenumber"
            label="Mobile Number"
            name="phoneNumber"
            type="text"
            placeholder="Enter phone number"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            disabled={!isManualPhone}
          />
          <InputField
            label="Alternate Number"
            type="text"
            name="alternateNumber"
            placeholder="Enter Alternate Number"
            disabled
          />

          <InputField
            id="leadaddress1"
            label="Address"
            name="address1"
            type="text"
            placeholder="Enter address"
            value={formData.address1}
            onChange={handleInputChange}
            disabled
          />

          <InputField
            id="leadaddress2"
            label="Address Line 2"
            name="address2"
            type="text"
            placeholder="Apartment, suite, etc."
            value={formData.address2}
            onChange={handleInputChange}
            disabled
          />

          <InputField label="District" type="text" name="district" disabled placeholder="Enter District" />

          <InputField
            id="leadstate"
            label="State"
            name="state"
            type="text"
            placeholder="Enter your state"
            value={formData.state}
            onChange={handleInputChange}
            disabled
          />

          <InputField
            id="leadcity"
            label="City"
            name="city"
            type="text"
            placeholder="Enter your city"
            value={formData.city}
            onChange={handleInputChange}
            disabled
          />

          <InputField
            id="leadpostal"
            label="Postal Code"
            name="postalCode"
            type="number"
            placeholder="Enter postal code"
            value={formData.postalCode}
            onChange={handleInputChange}
            disabled
          />
        </div>
        <div className="mt-2">
          <label className="input-label">Comment</label>
          <textarea name="comment" disabled placeholder="Enter Your comment here!" className="input-box" />
        </div>

        <div className="flex gap-3 sm:mt-4 mt-2">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              handleLeadCall();
            }}
            disabled={isLoading}
            className={`primary-btn flex items-center
              ${isLoading ? 'bg-blue-300 cursor-not-allowed' : ''}`}
            aria-label={isLoading ? 'Dialing...' : 'Dial Lead'}
          >
            {isLoading ? (
              'Dial...'
            ) : (
              <>
                <FiPhone className="mr-2" aria-hidden="true" /> Dial
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleNextLead}
            disabled={isLoading}
            className={`sm:w-auto flex items-center justify-center text-white px-4 py-2 rounded transition-colors text-sm sm:text-base
              ${isLoading ? 'bg-green-300 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'}`}
            aria-label={isLoading ? 'Loading next lead...' : 'Next Lead'}
          >
            {isLoading ? (
              'Loading...'
            ) : (
              <>
                Next Lead <FaArrowRight className="ml-2" aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AutoDial;
