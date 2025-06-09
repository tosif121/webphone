import React, { useContext, useState, useCallback, useEffect } from 'react';
import {
  ArrowRight,
  User,
  Mail,
  Phone,
  MapPin,
  Home,
  Building,
  MapPinned,
  Building2,
  MailOpen,
  MessageSquare,
  Hash,
  Calendar,
  FileText,
  List,
  CheckSquare,
  Loader2,
} from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import toast from 'react-hot-toast';
import useFormatPhoneNumber from '../hooks/useFormatPhoneNumber';
import HistoryContext from '@/context/HistoryContext';

// Icon mapping based on label or type
const iconMap = {
  name: User,
  firstname: User,
  lastname: User,
  email: Mail,
  mail: Mail,
  phone: Phone,
  mobile: Phone,
  contact: Phone,
  number: Hash,
  address: MapPin,
  state: MapPinned,
  district: Building,
  city: Building2,
  postal: MailOpen,
  pin: MailOpen,
  comment: MessageSquare,
  message: MessageSquare,
  date: Calendar,
  text: FileText,
  textarea: List,
  select: List,
  checkbox: CheckSquare,
  radio: CheckSquare,
};

function getFieldIcon(field) {
  const label = field.label?.toLowerCase() || '';
  const type = field.type?.toLowerCase() || '';
  for (const key in iconMap) {
    if (label.includes(key) || type === key) {
      const Icon = iconMap[key];
      return <Icon className="absolute left-3 top-3 h-4 w-4 text-gray-400" aria-hidden="true" />;
    }
  }
  return <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-300" aria-hidden="true" />;
}

export default function AutoDialDynamicForm({ formConfig, setPhoneNumber, dispositionModal, handleCall, phoneNumber }) {
  const { username } = useContext(HistoryContext);
  const [formState, setFormState] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [currentLeadId, setCurrentLeadId] = useState(null);
  const [isManualPhone, setIsManualPhone] = useState(false);
  const formatPhoneNumber = useFormatPhoneNumber();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormState((prev) => ({
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

  const populateFormFromLead = (leadData) => {
    if (!formConfig?.sections) return;

    const filledState = {};
    formConfig.sections.forEach((section) => {
      section.fields.forEach((field) => {
        const fieldName = field.name;
        const lowerFieldName = fieldName.toLowerCase();

        // Map common lead fields to form fields
        const leadFieldMap = {
          name: leadData.name,
          fullname: leadData.name,
          firstname: leadData.name?.split(' ')[0],
          lastname: leadData.name?.split(' ').slice(1).join(' '),
          email: leadData.emailAddress,
          emailaddress: leadData.emailAddress,
          phone: leadData.number,
          phonenumber: leadData.number,
          mobile: leadData.number,
          number: leadData.number,
          address: leadData.address,
          address1: leadData.address,
          address2: leadData.address2,
          city: leadData.city,
          state: leadData.state,
          country: leadData.country,
          postalcode: leadData.postalCode,
          postal: leadData.postalCode,
          pin: leadData.postalCode,
        };

        // Try to match field name with lead data
        const mappedValue = leadFieldMap[lowerFieldName];
        filledState[fieldName] = mappedValue || '';
      });
    });

    setFormState(filledState);
  };

  const handleDial = async () => {
    const payload = {
      user: username,
    };

    setIsLoading(true);
    try {
      const response = await axios.post(`https://esamwad.iotcom.io/leadforautocall`, payload);

      if (response.data.result) {
        const result = response.data.result;
        setCurrentLeadId(result.leadId);
        setIsManualPhone(false);
        populateFormFromLead(result);
      } else {
        setIsManualPhone(true);
        // Clear phone number field
        const phoneField = getPhoneFieldName();
        if (phoneField) {
          setFormState((prev) => ({
            ...prev,
            [phoneField]: '',
          }));
        }
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

    const phoneField = getPhoneFieldName();
    if (!phoneField || !formState[phoneField]?.length) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`https://esamwad.iotcom.io/nextleadforautocall`, payload);

      if (response.data.result) {
        const result = response.data.result;
        setCurrentLeadId(result.leadId);
        setIsManualPhone(false);
        populateFormFromLead(result);
      } else {
        setIsManualPhone(true);
        // Clear phone number field
        if (phoneField) {
          setFormState((prev) => ({
            ...prev,
            [phoneField]: '',
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching next lead:', err);
      setIsManualPhone(true);
    } finally {
      setIsLoading(false);
    }
  }, [currentLeadId, formState]);

  const getPhoneFieldName = () => {
    if (!formConfig?.sections) return null;

    for (const section of formConfig.sections) {
      for (const field of section.fields) {
        const fieldName = field.name.toLowerCase();
        if (fieldName.includes('phone') || fieldName.includes('mobile') || fieldName.includes('number')) {
          return field.name;
        }
      }
    }
    return null;
  };

  const handleLeadCall = async () => {
    const phoneField = getPhoneFieldName();
    const phoneValue = phoneField ? formState[phoneField] : '';

    if (!phoneValue?.length) {
      toast.error('No phone number available to dial!');
      return;
    }

    if (isManualPhone) {
      const formattedNumber = formatPhoneNumber(phoneValue);
      handleCall(formattedNumber);
      return;
    }

    const payload = {
      caller: username,
      leaddata: {
        _id: currentLeadId,
        name: formState.name || formState.fullName || '',
        number: phoneValue,
        address: formState.address || formState.address1 || '',
      },
    };

    setIsLoading(true);
    try {
      const response = await axios.post(`https://esamwad.iotcom.io/leaddialnumber`, payload);
      if (response.data) {
        localStorage.setItem('dialing', true);
        setPhoneNumber(phoneValue);
      } else {
        console.error('Failed to initiate call:', response.data.message || 'Unknown error');
      }
    } catch (err) {
      console.error('Error calling API:', err.response?.data || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!formConfig) return <p className="text-center py-10 text-red-500">No form found.</p>;

  return (
    <Card className="backdrop-blur-sm bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-200/50 dark:border-slate-700/20 shadow-lg shadow-blue-500/5 max-w-2xl mx-auto">
      <CardHeader className="pb-2">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/30">
            <Phone className="text-white" size={18} aria-hidden="true" />
          </div>
          <div className="ml-3">
            <CardTitle className="text-xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {/* {formConfig.formTitle || 'Lead Auto Dialer'} */}
              Lead Auto Dialer
            </CardTitle>
            <CardDescription>
              {formConfig.sections?.length > 1 ? 'Fill out the form sections below' : 'Connect with your leads'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form className="space-y-8">
          {formConfig.sections?.map((section) => (
            <div key={section.id} className="mb-6">
              {formConfig.sections.length > 1 && (
                <h3 className="text-lg font-medium text-indigo-600 mb-4 flex items-center gap-2">
                  <List className="w-5 h-5 text-indigo-400" />
                  {section.title}
                </h3>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {section.fields.map((field, idx) => {
                  const isPhoneField =
                    field.name.toLowerCase().includes('phone') ||
                    field.name.toLowerCase().includes('mobile') ||
                    field.name.toLowerCase().includes('number');
                  const isDisabled = !isManualPhone && !isPhoneField;

                  // Textarea
                  if (field.type === 'textarea') {
                    return (
                      <div className="relative col-span-2" key={idx}>
                        {getFieldIcon(field)}
                        <Textarea
                          name={field.name}
                          placeholder={field.label}
                          required={field.required}
                          value={formState[field.name] || ''}
                          onChange={handleChange}
                          disabled={isDisabled}
                          className={`pl-10 min-h-20 resize-none ${
                            isManualPhone && isPhoneField
                              ? 'border-blue-400 dark:border-blue-600 bg-blue-50/40 dark:bg-blue-900/20'
                              : ''
                          }`}
                          aria-label={field.label}
                        />
                      </div>
                    );
                  }
                  // Select
                  if (field.type === 'select' && field.options?.length) {
                    return (
                      <div className="relative" key={idx}>
                        {getFieldIcon(field)}
                        <Select
                          value={formState[field.name] || ''}
                          onValueChange={(value) => handleSelectChange(field.name, value)}
                          disabled={isDisabled}
                        >
                          <SelectTrigger
                            className={`pl-10 ${
                              isManualPhone && isPhoneField
                                ? 'border-blue-400 dark:border-blue-600 bg-blue-50/40 dark:bg-blue-900/20'
                                : ''
                            }`}
                          >
                            <SelectValue placeholder={field.label} />
                          </SelectTrigger>
                          <SelectContent>
                            {field.options.map((option, i) => (
                              <SelectItem key={i} value={option.value || option}>
                                {option.label || option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  }
                  // Checkbox
                  if (field.type === 'checkbox') {
                    return (
                      <label className="flex items-center gap-2" key={idx}>
                        <input
                          type="checkbox"
                          name={field.name}
                          checked={!!formState[field.name]}
                          onChange={handleChange}
                          disabled={isDisabled}
                          className="accent-indigo-500"
                        />
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                    );
                  }
                  // Radio
                  if (field.type === 'radio' && field.options?.length) {
                    return (
                      <div className="flex flex-col gap-2" key={idx}>
                        <span className="font-medium">{field.label}</span>
                        <div className="flex gap-4">
                          {field.options.map((option, i) => (
                            <label className="flex items-center gap-2" key={i}>
                              <input
                                type="radio"
                                name={field.name}
                                value={option.value || option}
                                checked={formState[field.name] === (option.value || option)}
                                onChange={handleChange}
                                disabled={isDisabled}
                                className="accent-indigo-500"
                              />
                              {option.label || option}
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  // Default: text, number, email, etc.
                  return (
                    <div className="relative" key={idx}>
                      {getFieldIcon(field)}
                      <Input
                        name={field.name}
                        type={field.type || 'text'}
                        placeholder={field.label}
                        required={field.required}
                        value={formState[field.name] || ''}
                        onChange={handleChange}
                        disabled={isDisabled}
                        className={`pl-10 ${
                          isManualPhone && isPhoneField
                            ? 'border-blue-400 dark:border-blue-600 bg-blue-50/40 dark:bg-blue-900/20'
                            : ''
                        }`}
                        aria-label={field.label}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mt-6">
            <Button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handleLeadCall();
              }}
              disabled={isLoading}
              className={`w-36 h-12 text-base font-semibold rounded-xl transition-all shadow-md shadow-blue-500/20 ${
                isLoading
                  ? 'bg-blue-400/70 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 text-white hover:to-indigo-700'
              }`}
              aria-label={isLoading ? 'Dialing...' : 'Dial Lead'}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
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
              className={`w-36 h-12 text-base font-semibold rounded-xl transition-all shadow-md shadow-emerald-500/20 ${
                isLoading
                  ? 'bg-emerald-400/70 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white'
              }`}
              aria-label={isLoading ? 'Loading next lead...' : 'Next Lead'}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
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
}
