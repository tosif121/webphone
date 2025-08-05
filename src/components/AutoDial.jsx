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
    if (username) {
      handleDial();
    }
  }, [username]);

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
      const response = await axios.post(`https://samwad.iotcom.io/leadforautocall`, payload);

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
      const response = await axios.post(`https://samwad.iotcom.io/nextleadforautocall`, payload);

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
      const response = await axios.post(`https://samwad.iotcom.io/leaddialnumber`, payload);
      if (response.data) {
        localStorage.setItem('dialing', true);
        setPhoneNumber(formData.phoneNumber);
      } else {
        console.error('Failed to initiate call:', response.data.message || 'Unknown error');
        // localStorage.clear();
        window.location.href = '/webphone/v1/login';
      }
    } catch (err) {
      console.error('Error calling API:', err.response?.data || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="backdrop-blur-sm bg-card/80 rounded-lg max-w-2xl mx-auto">
      <CardHeader className="pb-2">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center shadow-md">
            <Phone className="text-primary-foreground" size={18} aria-hidden="true" />
          </div>
          <div className="ml-3">
            <CardTitle className="text-xl text-foreground">Lead Auto Dialer</CardTitle>
            <CardDescription className="text-muted-foreground">Connect with your leads</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form className="space-y-6">
          {/* Lead Info Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="leadfullname"
                name="fullName"
                type="text"
                placeholder="Enter full name"
                value={formData.fullName}
                onChange={handleInputChange}
                disabled
                className="pl-10 border-border"
                aria-label="Full Name"
              />
            </div>
            {/* Email Address */}
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="leademailaddress"
                name="emailAddress"
                type="email"
                placeholder="Enter email address"
                value={formData.emailAddress}
                onChange={handleInputChange}
                disabled
                className="pl-10 border-border"
                aria-label="Email Address"
              />
            </div>
            {/* Phone Number */}
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="leadphonenumber"
                name="phoneNumber"
                type="text"
                placeholder="Enter phone number"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                disabled={!isManualPhone}
                className={`pl-10 ${isManualPhone ? 'border-primary bg-muted' : 'border-border'}`}
                aria-label="Phone Number"
              />
            </div>
            {/* Alternate Number */}
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                name="alternateNumber"
                type="text"
                placeholder="Alternate Number"
                disabled
                className="pl-10 border-border"
                aria-label="Alternate Number"
              />
            </div>
            {/* Address 1 */}
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="leadaddress1"
                name="address1"
                type="text"
                placeholder="Address"
                value={formData.address1}
                onChange={handleInputChange}
                disabled
                className="pl-10 border-border"
                aria-label="Address"
              />
            </div>
            {/* Address 2 */}
            <div className="relative">
              <Home className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="leadaddress2"
                name="address2"
                type="text"
                placeholder="Apartment, suite, etc."
                value={formData.address2}
                onChange={handleInputChange}
                disabled
                className="pl-10 border-border"
                aria-label="Address Line 2"
              />
            </div>
            {/* District */}
            <div className="relative">
              <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                name="district"
                type="text"
                placeholder="District"
                disabled
                className="pl-10 border-border"
                aria-label="District"
              />
            </div>
            {/* State */}
            <div className="relative">
              <MapPinned className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="leadstate"
                name="state"
                type="text"
                placeholder="State"
                value={formData.state}
                onChange={handleInputChange}
                disabled
                className="pl-10 border-border"
                aria-label="State"
              />
            </div>
            {/* City */}
            <div className="relative">
              <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="leadcity"
                name="city"
                type="text"
                placeholder="City"
                value={formData.city}
                onChange={handleInputChange}
                disabled
                className="pl-10 border-border"
                aria-label="City"
              />
            </div>
            {/* Postal Code */}
            <div className="relative">
              <MailOpen className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="leadpostal"
                name="postalCode"
                type="number"
                placeholder="Postal Code"
                value={formData.postalCode}
                onChange={handleInputChange}
                disabled
                className="pl-10 border-border"
                aria-label="Postal Code"
              />
            </div>
          </div>
          {/* Comment */}
          <div>
            <Textarea
              name="comment"
              disabled
              placeholder="Enter your comment here!"
              className="min-h-20 resize-none border-border"
              aria-label="Comment"
            />
          </div>
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mt-6">
            <Button onClick={handleLeadCall} disabled={isLoading} className="w-36 cursor-pointer">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Dialing...
                </>
              ) : (
                <>
                  <Phone className="mr-2 h-4 w-4" /> Dial
                </>
              )}
            </Button>

            <Button onClick={handleNextLead} disabled={isLoading} variant="secondary" className="w-36 cursor-pointer">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  Next Lead <ArrowRight className="ml-2 h-4 w-4" />
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
