import React, { useContext, useState, useCallback, useEffect } from 'react';
import {
  ArrowRight,
  User,
  Mail,
  MapPin,
  Home,
  Building2,
  MapPinned,
  Phone,
  Building,
  MailOpen,
  Loader2,
} from 'lucide-react';
import axios from 'axios';
import useFormatPhoneNumber from '../hooks/useFormatPhoneNumber';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import HistoryContext from '@/context/HistoryContext';

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
      const response = await axios.post(`https://esamwad.iotcom.io/leadforautocall`, payload);

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
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.post(`https://esamwad.iotcom.io/nextleadforautocall`, payload);

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
      const response = await axios.post(`https://esamwad.iotcom.io/leaddialnumber`, payload);
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
    <Card className="max-w-lg relative overflow-hidden border-indigo-100/50 dark:border-blue-900/30">
      <CardHeader className="pb-2">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/30">
            <Phone className="text-white" size={18} />
          </div>
          <div className="ml-3">
            <CardTitle className="text-xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Lead Auto Dialer
            </CardTitle>
            <CardDescription>Connect with your leads</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative z-10">
        <form className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name Field */}
            <div className="space-y-1">
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="leadfullname"
                  name="fullName"
                  type="text"
                  placeholder="Enter full name"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  disabled
                  className="pl-10"
                />
              </div>
            </div>

            {/* Email Address Field */}
            <div className="space-y-1">
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="leademailaddress"
                  name="emailAddress"
                  type="email"
                  placeholder="Enter email address"
                  value={formData.emailAddress}
                  onChange={handleInputChange}
                  disabled
                  className="pl-10"
                />
              </div>
            </div>

            {/* Phone Number Field */}
            <div className="space-y-1">
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="leadphonenumber"
                  name="phoneNumber"
                  type="text"
                  placeholder="Enter phone number"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  disabled={!isManualPhone}
                  className={`pl-10 ${isManualPhone ? 'border-blue-300 dark:border-blue-700' : ''}`}
                />
              </div>
            </div>

            {/* Alternate Number Field */}
            <div className="space-y-1">
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  name="alternateNumber"
                  type="text"
                  placeholder="Enter Alternate Number"
                  disabled
                  className="pl-10"
                />
              </div>
            </div>

            {/* Address Field */}
            <div className="space-y-1">
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="leadaddress1"
                  name="address1"
                  type="text"
                  placeholder="Enter address"
                  value={formData.address1}
                  onChange={handleInputChange}
                  disabled
                  className="pl-10"
                />
              </div>
            </div>

            {/* Address Line 2 Field */}
            <div className="space-y-1">
              <div className="relative">
                <Home className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="leadaddress2"
                  name="address2"
                  type="text"
                  placeholder="Apartment, suite, etc."
                  value={formData.address2}
                  onChange={handleInputChange}
                  disabled
                  className="pl-10"
                />
              </div>
            </div>

            {/* District Field */}
            <div className="space-y-1">
              <div className="relative">
                <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input name="district" type="text" placeholder="Enter District" disabled className="pl-10" />
              </div>
            </div>

            {/* State Field */}
            <div className="space-y-1">
              <div className="relative">
                <MapPinned className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="leadstate"
                  name="state"
                  type="text"
                  placeholder="Enter your state"
                  value={formData.state}
                  onChange={handleInputChange}
                  disabled
                  className="pl-10"
                />
              </div>
            </div>

            {/* City Field */}
            <div className="space-y-1">
              <div className="relative">
                <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="leadcity"
                  name="city"
                  type="text"
                  placeholder="Enter your city"
                  value={formData.city}
                  onChange={handleInputChange}
                  disabled
                  className="pl-10"
                />
              </div>
            </div>

            {/* Postal Code Field */}
            <div className="space-y-1">
              <div className="relative">
                <MailOpen className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="leadpostal"
                  name="postalCode"
                  type="number"
                  placeholder="Enter postal code"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  disabled
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Comment Textarea */}
          <div className="mt-2">
            <div className="relative">
              <Textarea
                name="comment"
                disabled
                placeholder="Enter Your comment here!"
                className="min-h-20 resize-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mt-4">
            <Button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handleLeadCall();
              }}
              disabled={isLoading}
              className={`${
                isLoading
                  ? 'bg-blue-400/70 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
              }`}
              aria-label={isLoading ? 'Dialing...' : 'Dial Lead'}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Dialing...
                </span>
              ) : (
                <>
                  <Phone className="mr-2" size={16} aria-hidden="true" /> Dial
                </>
              )}
            </Button>

            <Button
              type="button"
              onClick={handleNextLead}
              disabled={isLoading}
              variant="secondary"
              className={`${
                isLoading
                  ? 'bg-green-400/70 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white'
              }`}
              aria-label={isLoading ? 'Loading next lead...' : 'Next Lead'}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </span>
              ) : (
                <>
                  Next Lead <ArrowRight className="ml-2" size={14} aria-hidden="true" />
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AutoDial;
