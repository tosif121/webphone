import React, { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';

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
          >
            <Star className="w-6 h-6 fill-current" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default function DynamicForm({
  formConfig,
  formState,
  setFormState,
  userCallDialog,
  userCall,
  status,
  handleSubmit,
  formSubmitted,
  localFormData,
  setLocalFormData,
}) {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [visitedSections, setVisitedSections] = useState([]);
  const [isFormComplete, setIsFormComplete] = useState(false);
  const [navigationPath, setNavigationPath] = useState([0]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initialValues, setInitialValues] = useState({});
  const [userModifiedFields, setUserModifiedFields] = useState(new Set());

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

  const getFinalFormData = () => {
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
  };

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
    console.log(`Changing field ${fieldName} to:`, value);

    setCurrentFormData((prev) => {
      const newData = { ...prev, [fieldName]: value };
      console.log('Updated form data:', newData);
      return newData;
    });

    setUserModifiedFields((prev) => new Set([...prev, fieldName]));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    handleChange(name, type === 'checkbox' ? checked : value);
  };

  const handleSelectChange = (name, value) => {
    console.log(`Select changed: ${name} = ${value}`);
    handleChange(name, value);
  };

  const isSectionValid = () => {
    if (!currentSection) return true;
    const finalData = getFinalFormData();

    return currentSection.fields.every((field) => {
      if (field.required) {
        const value = finalData[field.name];
        if (Array.isArray(value)) return value.length > 0;
        return value !== undefined && value !== '' && value !== null;
      }
      return true;
    });
  };

  const handleFormSubmit = () => {
    const finalData = getFinalFormData();

    if (handleSubmit) {
      handleSubmit(finalData);
    }
  };

  const handleNext = () => {
    if (!isSectionValid()) {
      toast.error('Please fill all required fields.');
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
          if (field.type === 'select' && currentFormData[field.name] && field.options.some((opt) => opt.nextSection)) {
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
            initialData[field.name] = value;
            initialVals[field.name] = value;
          }
        });
      });

      setInitialValues(initialVals);
      setCurrentFormData(initialData);
      setIsInitialized(true);

      console.log('Initialized with userCall data:', initialData);
    }
  }, [userCall, formConfig, isInitialized]);

  useEffect(() => {
    if (status === 'start') {
      setCurrentSectionIndex(0);
      setVisitedSections([]);
      setIsFormComplete(false);
      setNavigationPath([0]);
      setIsInitialized(false);
      setInitialValues({});
      setUserModifiedFields(new Set());
      formDataRef.current = {};
    }
  }, [status]);

  useEffect(() => {
    const finalData = getFinalFormData();
    console.log('Current form data:', currentFormData);
    console.log('Final form data (what will be submitted):', finalData);
    console.log('User modified fields:', Array.from(userModifiedFields));
    console.log('Navigation path:', navigationPath);
  }, [currentFormData, userModifiedFields, navigationPath, initialValues]);

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
          ? 'backdrop-blur-sm bg-card/80 rounded-lg max-w-2xl mx-auto'
          : 'bg-transparent border-0 shadow-none p-0'
      }`}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-xl text-primary">{formConfig.formTitle || 'Form'}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Label htmlFor="contactNumber" className="text-sm font-medium pl-1 mb-1 block">
            Contact Number
          </Label>
          <div className="relative">
            {getFieldIcon({ label: 'phone' })}
            <Input
              id="contactNumber"
              name="contactNumber"
              type="tel"
              value={userCall?.contactNumber || ''}
              disabled
              className="pl-10 bg-muted/50 cursor-not-allowed"
            />
          </div>
        </div>

        <div className="space-y-6 mb-6">
          {/* <div className="text-sm text-muted-foreground mb-2">
            Navigation:{' '}
            {navigationPath.map((idx, i) => (
              <span key={idx}>
                {sortedSections[idx]?.title || `Section ${sortedSections[idx]?.id}`}
                {i < navigationPath.length - 1 && ' → '}
              </span>
            ))}
          </div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-primary flex items-center gap-2 capitalize">
              <List className="w-5 h-5 text-muted-foreground" />
              {currentSection.title || `Section ${currentSection.id}`}
            </h3>
            <div className="text-sm bg-blue-100 px-2 py-1 rounded">Section {currentSection.id}</div>
          </div> */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentSection.fields.map((field, idx) => {
              const fieldId = `${field.name}-${idx}`;
              const fieldLabel = field.question || field.label || 'Field';

              if (field.type === 'textarea') {
                return (
                  <div className="relative col-span-2" key={fieldId}>
                    <Label
                      htmlFor={fieldId}
                      className={`mb-2 capitalize block ${
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
                        value={getFieldValue(field.name)}
                        onChange={handleInputChange}
                        className="pl-10"
                      />
                    </div>
                  </div>
                );
              }

              if (field.type === 'select') {
                const fieldValue = getFieldValue(field.name);

                return (
                  <div className="relative" key={fieldId}>
                    <Label
                      htmlFor={fieldId}
                      className={`mb-2 capitalize block ${
                        field.required ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ''
                      }`}
                    >
                      {fieldLabel}
                    </Label>
                    <div className="relative">
                      {getFieldIcon(field)}
                      <Select
                        value={fieldValue || ''}
                        onValueChange={(value) => {
                          console.log(`Select ${field.name} changing to:`, value);
                          handleSelectChange(field.name, value);
                        }}
                      >
                        <SelectTrigger className="pl-10" id={fieldId}>
                          <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map((option, i) => (
                            <SelectItem key={i} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                );
              }

              if (field.type === 'multiple-options') {
                const fieldValue = getFieldValue(field.name);
                const currentValues = Array.isArray(fieldValue) ? fieldValue : [];

                return (
                  <div className="space-y-3 col-span-2" key={fieldId}>
                    <Label
                      className={`text-base capitalize font-medium ${
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
                  </div>
                );
              }

              if (field.type === 'checkbox') {
                return (
                  <div className="flex items-center gap-2 col-span-2" key={fieldId}>
                    <Checkbox
                      id={field.name}
                      checked={!!getFieldValue(field.name)}
                      onCheckedChange={(checked) => handleChange(field.name, checked)}
                    />
                    <Label
                      htmlFor={field.name}
                      className={`cursor-pointer capitalize ${
                        field.required ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ''
                      }`}
                    >
                      {fieldLabel}
                    </Label>
                  </div>
                );
              }

              if (field.type === 'rating') {
                return (
                  <RatingField
                    key={fieldId}
                    question={fieldLabel}
                    required={field.required}
                    value={getFieldValue(field.name) || 0}
                    onChange={(newValue) => handleChange(field.name, newValue)}
                  />
                );
              }

              return (
                <div className="relative" key={fieldId}>
                  <Label
                    htmlFor={fieldId}
                    className={`mb-2 capitalize block ${
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
                      value={getFieldValue(field.name)}
                      onChange={handleInputChange}
                      className="pl-10"
                    />
                  </div>
                </div>
              );
            })}
          </div>
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
              <Button onClick={handleFormSubmit} disabled={formSubmitted || !isSectionValid()}>
                Submit
              </Button>
            ) : showNextButton ? (
              <Button onClick={handleNext} className="flex items-center gap-2" disabled={!isSectionValid()}>
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={handleFormSubmit} disabled={formSubmitted || !isSectionValid()}>
                Submit
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
