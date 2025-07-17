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
      return <Icon className="absolute left-3 top-3 h-4 w-4 text-slate-400" aria-hidden="true" />;
    }
  }
  return <FileText className="absolute left-3 top-3 h-4 w-4 text-slate-300" aria-hidden="true" />;
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

  function populateFormFromLead(leadData) {
    const filledState = {};
    const leadKeys = Object.keys(leadData || {});

    for (const section of formConfig.sections || []) {
      for (const field of section.fields) {
        const fieldName = field.name;
        const lowerFieldName = fieldName.toLowerCase();

        let matchedKey = leadKeys.find((key) => key.toLowerCase() === lowerFieldName);

        if (!matchedKey) {
          matchedKey = leadKeys.find((key) => key.toLowerCase().includes(lowerFieldName));
        }

        filledState[fieldName] = matchedKey !== undefined ? leadData[matchedKey] ?? '' : '';
      }
    }

    setFormState(filledState);
  }

  const handleDial = async () => {
    const payload = {
      user: username,
    };

    setIsLoading(true);
    try {
      const response = await axios.post(`${window.location.origin}/leadforautocall`, payload);

      if (response.data.result) {
        const result = response.data.result;
        setCurrentLeadId(result.leadId);
        setIsManualPhone(false);
        // Fixed: Pass the result data to populate function
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

  // Updated handleNextLead function
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
      const response = await axios.post(`${window.location.origin}/nextleadforautocall`, payload);

      if (response.data.result) {
        const result = response.data.result;
        setCurrentLeadId(result.leadId);
        setIsManualPhone(false);
        // Fixed: Pass the result data to populate function
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
      },
    };

    setIsLoading(true);
    try {
      const response = await axios.post(`${window.location.origin}/leaddialnumber`, payload);
      if (response.data) {
        localStorage.setItem('dialing', true);
        setPhoneNumber(phoneValue);
      } else {
        console.error('Failed to initiate call:', response.data.message || 'Unknown error');
        // localStorage.clear();
        window.location.href = '/webphone/login';
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
          <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
            <Phone className="text-primary-foreground" size={20} aria-hidden="true" />
          </div>

          <div className="ml-3">
            <CardTitle className="text-xl text-slate-900 dark:text-slate-50">Lead Auto Dialer</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
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
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <List className="w-5 h-5 text-slate-500 dark:text-slate-400" />
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
                              ? 'border-slate-400 bg-slate-50 dark:bg-slate-800 dark:border-slate-500'
                              : 'border-slate-200 dark:border-slate-700'
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
                                ? 'border-slate-400 bg-slate-50 dark:bg-slate-800 dark:border-slate-500'
                                : 'border-slate-200 dark:border-slate-700'
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
                      <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300" key={idx}>
                        <input
                          type="checkbox"
                          name={field.name}
                          checked={!!formState[field.name]}
                          onChange={handleChange}
                          disabled={isDisabled}
                          className="accent-slate-900 dark:accent-slate-100"
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
                        <span className="font-medium text-slate-700 dark:text-slate-300">{field.label}</span>
                        <div className="flex gap-4">
                          {field.options.map((option, i) => (
                            <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400" key={i}>
                              <input
                                type="radio"
                                name={field.name}
                                value={option.value || option}
                                checked={formState[field.name] === (option.value || option)}
                                onChange={handleChange}
                                disabled={isDisabled}
                                className="accent-slate-900 dark:accent-slate-100"
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
                            ? 'border-slate-400 bg-slate-50 dark:bg-slate-800 dark:border-slate-500'
                            : 'border-slate-200 dark:border-slate-700'
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
            <Button onClick={handleLeadCall} disabled={isLoading} className="w-36 cursor-pointer">
              <Phone className="mr-2 h-4 w-4" /> Dial
            </Button>

            <Button onClick={handleNextLead} disabled={isLoading} variant="secondary" className="w-36 cursor-pointer">
              Next Lead <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
