import React, { useState, useEffect } from 'react';
import {
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
} from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import toast from 'react-hot-toast';

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

export default function DynamicForm({ formConfig, formState, userCallDialog, setFormState, userCall }) {
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

  if (!formConfig) return <p className="text-center py-10 text-red-500">No form found.</p>;

  useEffect(() => {
    if (userCall && formConfig?.sections) {
      const filledState = {};
      formConfig.sections.forEach((section) => {
        section.fields.forEach((field) => {
          const fieldName = field.name;
          const lowerFieldName = fieldName.toLowerCase();
          const userCallKeys = Object.keys(userCall);
          const matchedKey = userCallKeys.find((key) => key.toLowerCase() === lowerFieldName);
          filledState[fieldName] = matchedKey !== undefined ? userCall[matchedKey] ?? '' : '';
        });
      });
      setFormState(filledState);
    }
  }, [userCall, formConfig]);

  return (
    <Card
      className={`${
        !userCallDialog
          ? 'backdrop-blur-sm bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-200/50 dark:border-slate-700/20 shadow-lg shadow-blue-500/5 max-w-2xl mx-auto'
          : 'bg-transparent border-0 shadow-none p-0'
      }`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/30">
            <User className="text-white" size={18} aria-hidden="true" />
          </div>
          <div className="ml-3">
            <CardTitle className="text-xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {formConfig.formTitle}
            </CardTitle>
            <CardDescription>
              {formConfig.sections?.length > 1 ? 'Fill out the form sections below' : 'Fill out the form below'}
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
                          className="pl-10 min-h-20 resize-none"
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
                        >
                          <SelectTrigger className="pl-10">
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
                        className="pl-10"
                        aria-label={field.label}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </form>
      </CardContent>
    </Card>
  );
}
