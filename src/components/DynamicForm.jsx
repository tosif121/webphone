import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
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
  Upload,
  Clock,
  Heart,
  Activity,
  Stethoscope,
  Pill,
  CalendarDays,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import toast from 'react-hot-toast';

const iconMap = {
  // Personal info
  name: User,
  firstname: User,
  lastname: User,
  patient: User,
  full: User,
  
  // Contact
  email: Mail,
  mail: Mail,
  phone: Phone,
  mobile: Phone,
  contact: Phone,
  
  // Medical
  medical: Stethoscope,
  health: Heart,
  symptoms: Activity,
  medication: Pill,
  history: FileText,
  emergency: AlertCircle,
  
  // Appointment
  appointment: CalendarDays,
  date: Calendar,
  time: Clock,
  
  // Payment
  insurance: CreditCard,
  payment: CreditCard,
  
  // Location
  address: MapPin,
  state: MapPinned,
  district: Building,
  city: Building2,
  postal: MailOpen,
  pin: MailOpen,
  
  // General
  comment: MessageSquare,
  message: MessageSquare,
  notes: MessageSquare,
  number: Hash,
  text: FileText,
  textarea: List,
  select: List,
  checkbox: CheckSquare,
  radio: CheckSquare,
  file: Upload,
  rating: Star,
};

function getFieldIcon(field) {
  const label = field.label?.toLowerCase() || '';
  const name = field.name?.toLowerCase() || '';
  const type = field.type?.toLowerCase() || '';
  
  // Check label first, then name, then type
  for (const key in iconMap) {
    if (label.includes(key) || name.includes(key) || type === key) {
      const Icon = iconMap[key];
      return <Icon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />;
    }
  }
  return <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />;
}

const RatingField = ({ value, onChange, question, required }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="space-y-2">
      <Label className="mb-2 block text-sm font-medium">
        {question}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <div className="flex space-x-1">
        {[...Array(5)].map((_, index) => (
          <button
            key={index}
            type="button"
            className={`transition-colors ${
              index + 1 <= (hover || value)
                ? 'text-yellow-400 hover:text-yellow-500'
                : 'text-gray-300 hover:text-gray-400'
            }`}
            onClick={() => onChange(index + 1)}
            onMouseEnter={() => setHover(index + 1)}
            onMouseLeave={() => setHover(0)}
            aria-label={`Rate ${index + 1} out of 5`}
          >
            <Star className="w-6 h-6 fill-current" />
          </button>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        {value ? `${value} out of 5` : 'Click to rate'}
      </p>
    </div>
  );
};

const FileUploadField = ({ value, onChange, field, required }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState(value || []);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = [...uploadedFiles, ...files];
    setUploadedFiles(newFiles);
    onChange(newFiles);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    const newFiles = [...uploadedFiles, ...files];
    setUploadedFiles(newFiles);
    onChange(newFiles);
  };

  const removeFile = (index) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    onChange(newFiles);
  };

  return (
    <div className="space-y-3">
      <Label className={`mb-2 block text-sm font-medium ${required ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ''}`}>
        {field.label}
      </Label>
      
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground mb-2">
          Drag and drop files here, or click to select
        </p>
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
          id={`file-${field.name}`}
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => document.getElementById(`file-${field.name}`).click()}
        >
          Select Files
        </Button>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Uploaded Files:</p>
          {uploadedFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
              <span className="text-sm truncate">{file.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                className="text-red-500 hover:text-red-700"
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function DynamicForm({
  formConfig,
  formState,
  setFormState,
  userCallDialog,
  userCall,
  handleSubmit,
  formSubmitted,
  localFormData,
  setLocalFormData,
  status,
  connectionStatus,
}) {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [visitedSections, setVisitedSections] = useState([]);
  const [isFormComplete, setIsFormComplete] = useState(false);
  const [navigationPath, setNavigationPath] = useState([0]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initialValues, setInitialValues] = useState({});
  const [userModifiedFields, setUserModifiedFields] = useState(new Set());
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formDataRef = useRef({});
  const currentFormData = localFormData || formState || formDataRef.current;
  const setCurrentFormData =
    setLocalFormData ||
    setFormState ||
    ((data) => {
      if (typeof data === 'function') {
        formDataRef.current = data(formDataRef.current);
      } else {
        formDataRef.current = { ...data };
      }
    });

  const sortedSections = formConfig?.sections ? [...formConfig.sections].sort((a, b) => a.id - b.id) : [];
  const currentSection = sortedSections[currentSectionIndex];

  // Get filtered options for cascading dropdowns
  const getFilteredOptions = useCallback(
    (field) => {
      // If no parentField → top-level field, show all options
      if (!field.parentField) {
        return field.options || [];
      }

      // Get parent field's current value
      const parentValue = currentFormData[field.parentField];

      // If parent is empty → no options
      if (!parentValue) {
        return [];
      }

      // Filter with TRIMMED exact string match
      const filtered = (field.options || []).filter((opt) => {
        return opt.parentValue?.trim() === parentValue?.trim();
      });

      return filtered;
    },
    [currentFormData]
  );

  // Check if field should be visible based on parent field
  const isFieldVisible = useCallback((field) => {
    if (!field.parentField) {
      return true;
    }

    const parentValue = currentFormData[field.parentField];
    if (!parentValue) {
      return false;
    }

    // For fields with options, check if any option matches the parent value
    if (field.options && field.options.length > 0) {
      return field.options.some(option => option.parentValue === parentValue);
    }

    return true;
  }, [currentFormData]);

  // Enhanced validation function
  const validateSection = useCallback(() => {
    const sectionErrors = {};
    const visibleFields = currentSection?.fields?.filter(isFieldVisible) || [];

    visibleFields.forEach(field => {
      if (field.required) {
        const value = currentFormData[field.name];
        
        if (!value || 
            (typeof value === 'string' && value.trim() === '') ||
            (Array.isArray(value) && value.length === 0)) {
          sectionErrors[field.name] = `${field.label} is required`;
        }
      }

      // Additional validation based on field type
      if (currentFormData[field.name]) {
        const value = currentFormData[field.name];
        
        if (field.type === 'email' && value) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            sectionErrors[field.name] = 'Please enter a valid email address';
          }
        }
        
        if (field.type === 'phone' && value) {
          const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
          if (!phoneRegex.test(value.replace(/\s/g, ''))) {
            sectionErrors[field.name] = 'Please enter a valid phone number';
          }
        }
        
        if (field.type === 'number' && value) {
          if (isNaN(value) || value < 0) {
            sectionErrors[field.name] = 'Please enter a valid number';
          }
        }
      }
    });

    setErrors(sectionErrors);
    return Object.keys(sectionErrors).length === 0;
  }, [currentSection, currentFormData, isFieldVisible]);

  const getFinalFormData = useCallback(() => {
    const finalData = { ...initialValues };

    Object.keys(currentFormData).forEach((key) => {
      const value = currentFormData[key];
      if (value !== undefined && value !== null && value !== '') {
        finalData[key] = value;
      } else if (value === 0 || value === false || (Array.isArray(value) && value.length === 0)) {
        finalData[key] = value;
      }
    });

    return finalData;
  }, [initialValues, currentFormData]);

  const cleanupFormDataForPath = (newPath) => {
    const sectionsInPath = new Set(newPath);
    const clearedState = { ...currentFormData };

    const fieldsToKeep = new Set();

    sectionsInPath.forEach((sectionIdx) => {
      const section = sortedSections[sectionIdx];
      if (section?.fields) {
        section.fields.forEach((field) => {
          fieldsToKeep.add(field.name);
        });
      }
    });

    Object.keys(clearedState).forEach((fieldName) => {
      if (!fieldsToKeep.has(fieldName)) {
        if (initialValues.hasOwnProperty(fieldName) && !userModifiedFields.has(fieldName)) {
          clearedState[fieldName] = initialValues[fieldName];
        } else {
          delete clearedState[fieldName];
        }
      }
    });

    setCurrentFormData(clearedState);
  };

  const updateNavigationPath = (newPath) => setNavigationPath(newPath);

  const updateVisitedSections = (indexToAdd) => {
    setVisitedSections((prev) => (!prev.includes(indexToAdd) ? [...prev, indexToAdd] : prev));
  };

  const handleChange = (fieldName, value) => {
    setCurrentFormData((prev) => {
      const newData = { ...prev, [fieldName]: value };

      // Clear dependent fields when parent changes
      currentSection?.fields.forEach((field) => {
        if (field.parentField === fieldName && newData[field.name]) {
          newData[field.name] = '';
        }
      });

      return newData;
    });

    setUserModifiedFields((prev) => new Set([...prev, fieldName]));

    // Clear field error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
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
    return validateSection();
  };

  const handleFormSubmit = async () => {
    if (!validateSection()) {
      toast.error('Please fill in all required fields correctly');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalData = getFinalFormData();
      
      if (handleSubmit) {
        await handleSubmit(finalData);
        toast.success('Form submitted successfully!');
      }
    } catch (error) {
      toast.error('Failed to submit form. Please try again.');
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (!validateSection()) {
      toast.error('Please fill in all required fields correctly');
      return;
    }

    updateVisitedSections(currentSectionIndex);

    if (currentSection?.isDynamicSection) {
      let targetSectionId = null;

      const callRelatedField = currentSection.fields.find(
        (field) => field.name === 'Call Related To' && field.type === 'select' && currentFormData[field.name]
      );

      if (callRelatedField) {
        const selectedValue = currentFormData[callRelatedField.name];
        const selectedOption = callRelatedField.options.find((opt) => opt.value === selectedValue);
        if (selectedOption && selectedOption.nextSection) {
          targetSectionId = selectedOption.nextSection;
        }
      } else {
        for (const field of currentSection.fields) {
          if (field.type === 'select' && currentFormData[field.name] && field.options?.some((opt) => opt.nextSection)) {
            const selectedValue = currentFormData[field.name];
            const selectedOption = field.options.find((opt) => opt.value === selectedValue);
            if (selectedOption && selectedOption.nextSection) {
              targetSectionId = selectedOption.nextSection;
              break;
            }
          }
        }
      }

      if (targetSectionId) {
        if (!targetSectionId || targetSectionId.trim() === '') {
          console.warn('Empty nextSection detected; proceeding to form end.');
          setIsFormComplete(true);
          return;
        }

        const normalizedId = isNaN(targetSectionId) ? targetSectionId : parseInt(targetSectionId, 10).toString();

        if (normalizedId === 'end' || normalizedId === 'submit') {
          setIsFormComplete(true);
          return;
        }

        const nextIndex = sortedSections.findIndex((sec) => sec.id.toString() === normalizedId);
        const wouldCreateLoop = navigationPath.includes(nextIndex);

        if (nextIndex !== -1 && !wouldCreateLoop) {
          const newPath = [...navigationPath, nextIndex];
          cleanupFormDataForPath(newPath);
          setVisitedSections((prev) => prev.filter((idx) => newPath.includes(idx)));
          updateVisitedSections(currentSectionIndex);
          setCurrentSectionIndex(nextIndex);
          updateNavigationPath(newPath);
          return;
        } else if (nextIndex === -1) {
          console.error(`Section ${targetSectionId} not found`);
          setIsFormComplete(true);
          return;
        } else {
          console.warn(`Would create loop, completing form instead`);
          setIsFormComplete(true);
          return;
        }
      }
    }

    const nextNavigation = currentSection?.nextSection;

    if (nextNavigation === 'next') {
      const nextIndex = currentSectionIndex + 1;
      if (nextIndex < sortedSections.length && !visitedSections.includes(nextIndex)) {
        setCurrentSectionIndex(nextIndex);
        updateNavigationPath([...navigationPath, nextIndex]);
      } else {
        setIsFormComplete(true);
      }
    } else if (nextNavigation === 'end' || nextNavigation === 'submit' || !nextNavigation) {
      setIsFormComplete(true);
    } else {
      const nextIndex = sortedSections.findIndex((sec) => String(sec.id) === String(nextNavigation));
      if (nextIndex !== -1 && !visitedSections.includes(nextIndex) && nextIndex !== currentSectionIndex) {
        setCurrentSectionIndex(nextIndex);
        updateNavigationPath([...navigationPath, nextIndex]);
      } else {
        toast.error('Invalid or looping navigation detected. Proceeding to submit.');
        setIsFormComplete(true);
      }
    }
  };

  const handleBack = () => {
    if (navigationPath.length > 1) {
      const newPath = [...navigationPath];
      newPath.pop();
      const previousIndex = newPath[newPath.length - 1];

      const sectionsBeingLeft = visitedSections.filter((idx) => !newPath.includes(idx));
      sectionsBeingLeft.forEach((sectionIdx) => {
        const section = sortedSections[sectionIdx];
        if (section?.fields) {
          section.fields.forEach((field) => {
            setUserModifiedFields((prev) => {
              const newSet = new Set(prev);
              newSet.delete(field.name);
              return newSet;
            });
          });
        }
      });

      cleanupFormDataForPath(newPath);
      setVisitedSections((prev) => prev.filter((index) => newPath.includes(index)));
      setCurrentSectionIndex(previousIndex);
      updateNavigationPath(newPath);
      setIsFormComplete(false);
    }
  };

  const isLastSection =
    isFormComplete ||
    (!currentSection?.nextSection && currentSectionIndex === sortedSections.length - 1) ||
    currentSection?.nextSection === 'end' ||
    currentSection?.nextSection === 'submit';

  const showNextButton = sortedSections.length > 1 && !isLastSection;

  useEffect(() => {
    if (userCall && formConfig?.sections && !isInitialized) {
      const initialData = {};
      const initialVals = {};

      formConfig.sections.forEach((section) => {
        section.fields.forEach((field) => {
          const keyMatch = Object.keys(userCall).find((key) => key.toLowerCase() === field.name.toLowerCase());
          if (keyMatch && userCall[keyMatch] !== undefined && userCall[keyMatch] !== '') {
            const value = userCall[keyMatch];
            if (!userModifiedFields.has(field.name)) {
              initialData[field.name] = value;
              initialVals[field.name] = value;
            }
          }
        });
      });

      setInitialValues(initialVals);
      setCurrentFormData((prev) => ({ ...initialData, ...prev }));
      setIsInitialized(true);
    }
  }, [userCall, formConfig, isInitialized]);

  useEffect(() => {
    if (status === 'calling' || connectionStatus === 'Disposition') {
      setCurrentSectionIndex(0);
      setVisitedSections([]);
      setIsFormComplete(false);
      setNavigationPath([0]);
      setIsInitialized(false);
      setInitialValues({});
      setUserModifiedFields(new Set());
      formDataRef.current = {};
      localStorage.removeItem('formNavigationState');
    }
  }, [status]);



  useEffect(() => {
    const savedState = localStorage.getItem('formNavigationState');
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        setCurrentSectionIndex(parsedState.currentSectionIndex || 0);
        setNavigationPath(parsedState.navigationPath || [0]);
        setVisitedSections(parsedState.visitedSections || []);
        setIsFormComplete(parsedState.isFormComplete || false);
        if (parsedState.userModifiedFields) {
          setUserModifiedFields(new Set(parsedState.userModifiedFields));
        }
      } catch (error) {
        console.warn('Failed to parse saved form state:', error);
      }
    }
  }, []);

  useEffect(() => {
    const stateToSave = {
      currentSectionIndex,
      navigationPath,
      visitedSections,
      isFormComplete,
      userModifiedFields: Array.from(userModifiedFields),
    };

    localStorage.setItem('formNavigationState', JSON.stringify(stateToSave));
  }, [currentSectionIndex, navigationPath, visitedSections, isFormComplete, userModifiedFields]);

  const getFieldValue = (fieldName) => {
    if (currentFormData.hasOwnProperty(fieldName)) {
      const value = currentFormData[fieldName];
      return value !== undefined && value !== null ? value : '';
    }
    return initialValues[fieldName] || '';
  };



  if (!formConfig || !currentSection) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          {!formConfig ? 'Form configuration not loaded' : 'No current section available'}
        </div>
      </Card>
    );
  }

  return (
    <Card
      key={`section-${currentSection?.id}-${currentSectionIndex}`}
      className={`${
        !userCallDialog
          ? 'backdrop-blur-sm bg-card/80 rounded-lg max-w-4xl mx-auto'
          : 'bg-transparent border-0 shadow-none p-0 !gap-2 max-h-[32rem] overflow-y-auto'
      }`}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-2xl text-primary">
            {formConfig.formTitle || 'Form'}
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Step {currentSectionIndex + 1} of {sortedSections.length}
          </div>
        </div>
        
        {sortedSections.length > 1 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{currentSection?.title}</span>
              <span>{Math.round(((currentSectionIndex + 1) / sortedSections.length) * 100)}% Complete</span>
            </div>
            <Progress value={((currentSectionIndex + 1) / sortedSections.length) * 100} className="h-2" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {currentSection.fields.map((field, idx) => {
              if (!isFieldVisible(field)) {
                return null;
              }

              const fieldId = `${field.name}-${idx}`;
              const fieldLabel = field.question || field.label || 'Field';
              const fieldValue = getFieldValue(field.name);
              const hasError = errors[field.name];

              if (field.type === 'textarea') {
                return (
                  <div key={fieldId}>
                    <Label
                      htmlFor={fieldId}
                      className={`mb-2 block text-sm font-medium ${
                        field.required ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ''
                      }`}
                    >
                      {fieldLabel}
                    </Label>
                    <div className="relative">
                      {getFieldIcon(field)}
                      <Textarea
                        id={fieldId}
                        name={field.name}
                        placeholder={fieldLabel}
                        required={field.required}
                        value={fieldValue}
                        onChange={handleInputChange}
                        className={`pl-10 ${hasError ? 'border-red-500' : ''}`}
                        rows={4}
                      />
                    </div>
                    {hasError && (
                      <p className="mt-1 text-sm text-red-500" role="alert">
                        {hasError}
                      </p>
                    )}
                  </div>
                );
              }

              if (field.type === 'select') {
                const selectOptions = getFilteredOptions(field);
                const isDisabled = field.parentField && !currentFormData[field.parentField];

                return (
                  <div key={fieldId}>
                    <Label
                      htmlFor={fieldId}
                      className={`mb-2 block text-sm font-medium ${
                        field.required ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ''
                      }`}
                    >
                      {fieldLabel}
                      {field.parentField && (
                        <span className="text-xs text-muted-foreground ml-2">
                          (depends on {field.parentField})
                        </span>
                      )}
                    </Label>
                    <div className="relative">
                      {getFieldIcon(field)}
                      <Select
                        value={fieldValue || ''}
                        onValueChange={(value) => {
                          handleSelectChange(field.name, value);
                        }}
                        disabled={isDisabled}
                      >
                        <SelectTrigger className={`pl-10 ${hasError ? 'border-red-500' : ''}`} id={fieldId}>
                          <SelectValue
                            placeholder={
                              isDisabled
                                ? `Select ${field.parentField} first`
                                : selectOptions.length === 0
                                ? 'No options available'
                                : `Select ${fieldLabel.toLowerCase()}`
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {selectOptions.map((option, i) => (
                            <SelectItem key={i} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {hasError && (
                      <p className="mt-1 text-sm text-red-500" role="alert">
                        {hasError}
                      </p>
                    )}
                  </div>
                );
              }

              if (field.type === 'radio') {
                return (
                  <div key={fieldId}>
                    <Label className={`mb-2 block text-sm font-medium ${field.required ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ''}`}>
                      {fieldLabel}
                    </Label>
                    <RadioGroup
                      value={fieldValue}
                      onValueChange={(value) => handleChange(field.name, value)}
                      className="space-y-2"
                    >
                      {field.options?.map((option, i) => (
                        <div key={i} className="flex items-center space-x-2">
                          <RadioGroupItem value={option.value} id={`${fieldId}-${i}`} />
                          <Label htmlFor={`${fieldId}-${i}`} className="cursor-pointer">
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                    {hasError && (
                      <p className="mt-1 text-sm text-red-500" role="alert">
                        {hasError}
                      </p>
                    )}
                  </div>
                );
              }

              if (field.type === 'checkbox') {
                const checkboxValue = Array.isArray(fieldValue) ? fieldValue : [];

                return (
                  <div key={fieldId}>
                    <Label className={`mb-2 block text-sm font-medium ${field.required ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ''}`}>
                      {fieldLabel}
                    </Label>
                    <div className="space-y-2">
                      {field.options?.map((option, i) => (
                        <div key={i} className="flex items-center space-x-2">
                          <Checkbox
                            id={`${fieldId}-${i}`}
                            checked={checkboxValue.includes(option.value)}
                            onCheckedChange={(checked) => {
                              const newValue = checked
                                ? [...checkboxValue, option.value]
                                : checkboxValue.filter(v => v !== option.value);
                              handleChange(field.name, newValue);
                            }}
                          />
                          <Label htmlFor={`${fieldId}-${i}`} className="cursor-pointer">
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {hasError && (
                      <p className="mt-1 text-sm text-red-500" role="alert">
                        {hasError}
                      </p>
                    )}
                  </div>
                );
              }

              if (field.type === 'multiple-options') {
                const currentValues = Array.isArray(fieldValue) ? fieldValue : [];

                return (
                  <div className="space-y-3" key={fieldId}>
                    <Label
                      className={`mb-2 block text-sm font-medium ${
                        field.required ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ''
                      }`}
                    >
                      {fieldLabel}
                    </Label>
                    <div className="space-y-2">
                      {field.options?.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center space-x-2">
                          <Checkbox
                            id={`${field.name}-${optionIndex}`}
                            checked={currentValues.includes(option.value)}
                            onCheckedChange={(checked) => {
                              const newValues = checked
                                ? [...currentValues, option.value]
                                : currentValues.filter((v) => v !== option.value);
                              handleChange(field.name, newValues);
                            }}
                          />
                          <Label
                            htmlFor={`${field.name}-${optionIndex}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {hasError && (
                      <p className="mt-1 text-sm text-red-500" role="alert">
                        {hasError}
                      </p>
                    )}
                  </div>
                );
              }

              if (field.type === 'single-checkbox') {
                return (
                  <div className="flex items-center gap-2" key={fieldId}>
                    <Checkbox
                      id={field.name}
                      checked={!!fieldValue}
                      onCheckedChange={(checked) => handleChange(field.name, checked)}
                    />
                    <Label
                      htmlFor={field.name}
                      className={`cursor-pointer text-sm font-medium ${
                        field.required ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ''
                      }`}
                    >
                      {fieldLabel}
                    </Label>
                    {hasError && (
                      <p className="mt-1 text-sm text-red-500" role="alert">
                        {hasError}
                      </p>
                    )}
                  </div>
                );
              }

              if (field.type === 'rating') {
                return (
                  <div key={fieldId}>
                    <RatingField
                      question={fieldLabel}
                      required={field.required}
                      value={fieldValue || 0}
                      onChange={(newValue) => handleChange(field.name, newValue)}
                    />
                    {hasError && (
                      <p className="mt-1 text-sm text-red-500" role="alert">
                        {hasError}
                      </p>
                    )}
                  </div>
                );
              }

              if (field.type === 'file') {
                return (
                  <div key={fieldId}>
                    <FileUploadField
                      field={field}
                      required={field.required}
                      value={fieldValue}
                      onChange={(value) => handleChange(field.name, value)}
                    />
                    {hasError && (
                      <p className="mt-1 text-sm text-red-500" role="alert">
                        {hasError}
                      </p>
                    )}
                  </div>
                );
              }

              if (field.type === 'date') {
                return (
                  <div key={fieldId}>
                    <Label
                      htmlFor={fieldId}
                      className={`mb-2 block text-sm font-medium ${
                        field.required ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ''
                      }`}
                    >
                      {fieldLabel}
                    </Label>
                    <div className="relative">
                      {getFieldIcon(field)}
                      <Input
                        id={fieldId}
                        name={field.name}
                        type="date"
                        required={field.required}
                        value={fieldValue}
                        onChange={handleInputChange}
                        className={`pl-10 ${hasError ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {hasError && (
                      <p className="mt-1 text-sm text-red-500" role="alert">
                        {hasError}
                      </p>
                    )}
                  </div>
                );
              }

              return (
                <div key={fieldId}>
                  <Label
                    htmlFor={fieldId}
                    className={`mb-2 block text-sm font-medium ${
                      field.required ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ''
                    }`}
                  >
                    {fieldLabel}
                  </Label>
                  <div className="relative">
                    {getFieldIcon(field)}
                    <Input
                      id={fieldId}
                      name={field.name}
                      type={field.type || 'text'}
                      placeholder={fieldLabel}
                      required={field.required}
                      value={fieldValue}
                      onChange={handleInputChange}
                      className={`pl-10 ${hasError ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {hasError && (
                    <p className="mt-1 text-sm text-red-500" role="alert">
                      {hasError}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-between items-center pt-6 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={navigationPath.length <= 1}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          <div className="flex gap-2">
            {isLastSection ? (
              <Button
                onClick={handleFormSubmit}
                disabled={isSubmitting || formSubmitted}
                className="flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Submit Form
                  </>
                )}
              </Button>
            ) : showNextButton ? (
              <Button onClick={handleNext} className="flex items-center gap-2">
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleFormSubmit}
                disabled={isSubmitting || formSubmitted}
                className="flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Submit Form
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
