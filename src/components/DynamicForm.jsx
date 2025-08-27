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
  ArrowLeft,
  ArrowRight,
  Star,
} from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

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
      return <Icon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />;
    }
  }
  return <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />;
}

const RatingField = ({ value, onChange, question, required }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="space-y-2 col-span-2">
      <Label className="text-base font-medium">
        {question}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <div className="flex space-x-1">
        {[...Array(5)].map((_, index) => {
          const ratingValue = index + 1;
          return (
            <button
              key={index}
              type="button"
              className={`transition-colors ${
                ratingValue <= (hover || value)
                  ? 'text-yellow-400 hover:text-yellow-500'
                  : 'text-gray-300 hover:text-gray-400'
              }`}
              onClick={() => onChange(ratingValue)}
              onMouseEnter={() => setHover(ratingValue)}
              onMouseLeave={() => setHover(0)}
            >
              <Star className="w-6 h-6 fill-current" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default function DynamicForm({
  formConfig,
  formState, // Keep for backward compatibility but use localFormData
  setFormState, // Keep for backward compatibility but use setLocalFormData
  userCallDialog,
  userCall,
  status,
  handleContact,
  formSubmitted,
  // NEW PROPS for localFormData
  localFormData,
  setLocalFormData,
}) {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [sectionStates, setSectionStates] = useState({});
  const [visitedSections, setVisitedSections] = useState([]);
  const [isFormComplete, setIsFormComplete] = useState(false);
  const [navigationPath, setNavigationPath] = useState([0]);

  // Use localFormData if provided, otherwise fallback to formState
  const currentFormData = localFormData || formState || {};
  const setCurrentFormData = setLocalFormData || setFormState || (() => {});

  const sortedSections = formConfig?.sections ? [...formConfig.sections].sort((a, b) => a.id - b.id) : [];
  const currentSection = sortedSections[currentSectionIndex];

  const handleChange = (fieldName, value) => {
    setCurrentFormData((prev) => ({ ...prev, [fieldName]: value }));
    setSectionStates((prev) => ({
      ...prev,
      [currentSectionIndex]: { ...prev[currentSectionIndex], [fieldName]: value },
    }));

    if (currentSection?.isDynamicSection) {
      const field = currentSection.fields.find((f) => f.name === fieldName);
      if (field && field.type === 'select') {
        const selectedOption = field.options.find((opt) => opt.value === value);
        if (selectedOption && selectedOption.nextSection) {
          const nextSectionId = selectedOption.nextSection;
          if (!nextSectionId || nextSectionId.trim() === '') {
            setIsFormComplete(true);
            return;
          }
          const normalizedId = isNaN(nextSectionId) ? nextSectionId : parseInt(nextSectionId, 10).toString();
          if (normalizedId === 'end' || normalizedId === 'submit') {
            setIsFormComplete(true);
            return;
          }
          const nextIndex = sortedSections.findIndex((sec) => sec.id.toString() === normalizedId);
          if (nextIndex !== -1 && !visitedSections.includes(nextIndex)) {
            setCurrentSectionIndex(nextIndex);
            setNavigationPath((prev) => [...prev, nextIndex]);
            setVisitedSections((prev) => [...prev, nextIndex]);
          } else {
            setIsFormComplete(true);
          }
        }
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    handleChange(name, type === 'checkbox' ? checked : value);
  };

  const handleSelectChange = (name, value) => {
    handleChange(name, value);
  };

  const isSectionValid = () => {
    if (!currentSection) return true;
    return currentSection.fields.every((field) => {
      if (field.required) {
        const value = currentFormData[field.name];
        return value !== undefined && value !== '' && value !== null;
      }
      return true;
    });
  };

  const handleNext = () => {
    if (!isSectionValid()) {
      return;
    }
    setVisitedSections((prev) => [...prev, currentSectionIndex]);
    if (currentSection?.nextSection === 'next') {
      if (currentSectionIndex < sortedSections.length - 1) {
        const nextIndex = currentSectionIndex + 1;
        if (!visitedSections.includes(nextIndex)) {
          setCurrentSectionIndex(nextIndex);
          setNavigationPath((prev) => [...prev, nextIndex]);
        } else {
          setIsFormComplete(true);
        }
      } else {
        setIsFormComplete(true);
      }
    } else if (!currentSection?.nextSection || currentSection?.nextSection.trim() === '') {
      setIsFormComplete(true);
    } else if (currentSection?.nextSection === 'end' || currentSection?.nextSection === 'submit') {
      setIsFormComplete(true);
    } else {
      const nextIndex = sortedSections.findIndex((sec) => sec.id.toString() === currentSection.nextSection.toString());
      if (nextIndex !== -1 && !visitedSections.includes(nextIndex) && nextIndex !== currentSectionIndex) {
        setCurrentSectionIndex(nextIndex);
        setNavigationPath((prev) => [...prev, nextIndex]);
      } else {
        setIsFormComplete(true);
      }
    }
  };

  const handleBack = () => {
    if (navigationPath.length > 1) {
      const newPath = [...navigationPath];
      newPath.pop();
      const previousIndex = newPath[newPath.length - 1];

      if (currentSection) {
        const clearedState = { ...currentFormData };
        currentSection.fields.forEach((field) => {
          delete clearedState[field.name];
        });
        const updatedSectionStates = { ...sectionStates };
        delete updatedSectionStates[currentSectionIndex];
        setSectionStates(updatedSectionStates);
        const previousSectionState = updatedSectionStates[previousIndex] || {};
        setCurrentFormData({ ...clearedState, ...previousSectionState });
      }

      setCurrentSectionIndex(previousIndex);
      setNavigationPath(newPath);
      setIsFormComplete(false);
    }
  };

  const isLastSection =
    isFormComplete ||
    currentSectionIndex === sortedSections.length - 1 ||
    currentSection?.nextSection === 'end' ||
    currentSection?.nextSection === 'submit';

  // Initialize form data from userCall - only use this effect if not using localFormData from parent
  useEffect(() => {
    if (userCall && formConfig?.sections && !localFormData) {
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
      setCurrentFormData(filledState);
    }
  }, [userCall, formConfig, localFormData]);

  useEffect(() => {
    if (status === 'start') {
      setCurrentSectionIndex(0);
      setSectionStates({});
      setVisitedSections([]);
      setIsFormComplete(false);
      setNavigationPath([0]);
    }
  }, [status]);

  if (!formConfig?.sections || sortedSections.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-gray-600">No form configuration available.</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`${
        !userCallDialog
          ? 'backdrop-blur-sm bg-card/80 rounded-lg max-w-2xl mx-auto'
          : 'bg-transparent border-0 shadow-none p-0'
      }`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center shadow-md">
              <User className="text-primary-foreground" size={18} aria-hidden="true" />
            </div>
            <div className="ml-3">
              <CardTitle className="text-xl text-primary">
                {formConfig.formTitle?.charAt(0).toUpperCase() + formConfig.formTitle?.slice(1) || 'Form'}
              </CardTitle>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 w-max">
          <Label className="text-sm font-medium pl-1 mb-1 block">Contact Number</Label>
          <div className="relative">
            {getFieldIcon({ label: 'phone' })}
            <Input
              name="number"
              type="tel"
              placeholder="Mobile Number"
              value={userCall?.contactNumber || ''}
              disabled
              className="pl-10 bg-muted/50 cursor-not-allowed"
            />
          </div>
        </div>
        <div className="space-y-6 mb-6">
          {currentSection && (
            <div>
              <h3 className="text-lg font-medium text-primary mb-4 flex items-center gap-2">
                <List className="w-5 h-5 text-muted-foreground" />
                {currentSection.title?.charAt(0).toUpperCase() + currentSection.title?.slice(1) || 'Section'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentSection.fields.map((field, idx) => {
                  if (field.type === 'textarea') {
                    const capitalizedLabel =
                      (field.label || field.question || '')?.charAt(0).toUpperCase() +
                      (field.label || field.question || '')?.slice(1);
                    return (
                      <div className="relative col-span-2" key={idx}>
                        <Label
                          htmlFor={field.name}
                          className={`mb-2 block ${
                            field.required ? 'after:content-["*"] after:ml-0.5 after:text-red-500' : ''
                          }`}
                        >
                          {capitalizedLabel}
                        </Label>
                        <div className="relative">
                          {getFieldIcon(field)}
                          <Textarea
                            id={field.name}
                            name={field.name}
                            placeholder={capitalizedLabel}
                            required={field.required}
                            value={currentFormData[field.name] || ''}
                            onChange={handleInputChange}
                            className="pl-10 min-h-20 resize-none"
                            aria-label={capitalizedLabel}
                          />
                        </div>
                      </div>
                    );
                  }
                  if (field.type === 'select' && field.options?.length) {
                    const capitalizedLabel =
                      (field.label || field.question || '')?.charAt(0).toUpperCase() +
                      (field.label || field.question || '')?.slice(1);
                    return (
                      <div className="relative" key={idx}>
                        <Label
                          htmlFor={field.name}
                          className={`mb-2 block ${
                            field.required ? 'after:content-["*"] after:ml-0.5 after:text-red-500' : ''
                          }`}
                        >
                          {capitalizedLabel}
                        </Label>
                        <div className="relative">
                          {getFieldIcon(field)}
                          <Select
                            value={currentFormData[field.name] || ''}
                            onValueChange={(value) => handleSelectChange(field.name, value)}
                          >
                            <SelectTrigger className="pl-10" id={field.name}>
                              <SelectValue placeholder={`Select ${capitalizedLabel.toLowerCase()}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {field.options.map((option, i) => (
                                <SelectItem key={i} value={option.value || option}>
                                  {(option.label || option)?.charAt(0).toUpperCase() +
                                    (option.label || option)?.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    );
                  }
                  if (field.type === 'multiple-options' && field.options?.length) {
                    const capitalizedLabel =
                      (field.question || field.label || '')?.charAt(0).toUpperCase() +
                      (field.question || field.label || '')?.slice(1);
                    return (
                      <div className="space-y-3 col-span-2" key={idx}>
                        <Label
                          className={`text-base font-medium ${
                            field.required ? 'after:content-["*"] after:ml-0.5 after:text-red-500' : ''
                          }`}
                        >
                          {capitalizedLabel}
                        </Label>
                        <div className="relative">
                          <div className="space-y-2">
                            {field.options.map((option, optionIndex) => (
                              <div key={optionIndex} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`${field.name}-${optionIndex}`}
                                  checked={currentFormData[field.name]?.includes(option.value || option) || false}
                                  onCheckedChange={(checked) => {
                                    const currentValues = currentFormData[field.name] || [];
                                    const newValues = checked
                                      ? [...currentValues, option.value || option]
                                      : currentValues.filter((v) => v !== (option.value || option));
                                    handleChange(field.name, newValues);
                                  }}
                                />
                                <Label
                                  htmlFor={`${field.name}-${optionIndex}`}
                                  className="text-sm font-normal cursor-pointer"
                                >
                                  {(option.label || option)?.charAt(0).toUpperCase() +
                                    (option.label || option)?.slice(1)}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  }
                  if (field.type === 'checkbox') {
                    const capitalizedLabel =
                      (field.question || field.label || '')?.charAt(0).toUpperCase() +
                      (field.question || field.label || '')?.slice(1);
                    return (
                      <div className="flex items-center gap-2 col-span-2" key={idx}>
                        <Checkbox
                          id={field.name}
                          checked={!!currentFormData[field.name]}
                          onCheckedChange={(checked) => handleChange(field.name, checked)}
                        />
                        <Label
                          htmlFor={field.name}
                          className={`cursor-pointer ${
                            field.required ? 'after:content-["*"] after:ml-0.5 after:text-red-500' : ''
                          }`}
                        >
                          {capitalizedLabel}
                        </Label>
                      </div>
                    );
                  }
                  if (field.type === 'radio' && field.options?.length) {
                    const capitalizedLabel =
                      (field.question || field.label || '')?.charAt(0).toUpperCase() +
                      (field.question || field.label || '')?.slice(1);
                    return (
                      <div className="flex flex-col gap-2 col-span-2" key={idx}>
                        <Label
                          className={`font-medium ${
                            field.required ? 'after:content-["*"] after:ml-0.5 after:text-red-500' : ''
                          }`}
                        >
                          {capitalizedLabel}
                        </Label>
                        <div className="flex gap-4 flex-wrap">
                          {field.options.map((option, i) => (
                            <label className="flex items-center gap-2 cursor-pointer" key={i}>
                              <input
                                type="radio"
                                name={field.name}
                                value={option.value || option}
                                checked={currentFormData[field.name] === (option.value || option)}
                                onChange={handleInputChange}
                                className="accent-primary"
                              />
                              <span className="select-none">
                                {(option.label || option)?.charAt(0).toUpperCase() + (option.label || option)?.slice(1)}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  if (field.type === 'rating') {
                    const capitalizedLabel =
                      (field.question || field.label || '')?.charAt(0).toUpperCase() +
                      (field.question || field.label || '')?.slice(1);
                    return (
                      <RatingField
                        key={idx}
                        question={capitalizedLabel}
                        required={field.required}
                        value={currentFormData[field.name] || 0}
                        onChange={(newValue) => handleChange(field.name, newValue)}
                      />
                    );
                  }
                  const capitalizedLabel =
                    (field.label || field.question || '')?.charAt(0).toUpperCase() +
                    (field.label || field.question || '')?.slice(1);
                  return (
                    <div className="relative" key={idx}>
                      <Label
                        htmlFor={field.name}
                        className={`mb-2 block ${
                          field.required ? 'after:content-["*"] after:ml-0.5 after:text-red-500' : ''
                        }`}
                      >
                        {capitalizedLabel}
                      </Label>
                      <div className="relative">
                        {getFieldIcon(field)}
                        <Input
                          id={field.name}
                          name={field.name}
                          type={field.type || 'text'}
                          placeholder={capitalizedLabel}
                          required={field.required}
                          value={currentFormData[field.name] || ''}
                          onChange={handleInputChange}
                          className="pl-10"
                          aria-label={capitalizedLabel}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-between items-center my-6">
          <div>
            {navigationPath.length > 1 && (
              <Button variant="outline" onClick={handleBack} className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            )}
          </div>
          <div>
            {isLastSection ? (
              <Button onClick={handleContact} disabled={formSubmitted}>
                Submit
              </Button>
            ) : (
              <Button onClick={handleNext} className="flex items-center gap-2" disabled={!isSectionValid()}>
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
