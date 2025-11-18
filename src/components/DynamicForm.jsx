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

  // ✅ NEW: Get filtered options for cascading dropdowns
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

      // ✅ CRITICAL FIX: Filter with TRIMMED exact string match
      const filtered = (field.options || []).filter((opt) => {
        return opt.parentValue?.trim() === parentValue?.trim();
      });

      return filtered;
    },
    [currentFormData]
  );

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
    setCurrentFormData((prev) => {
      const newData = { ...prev, [fieldName]: value };

      // ✅ NEW: Clear dependent fields when parent changes
      currentSection?.fields.forEach((field) => {
        if (field.parentField === fieldName && newData[field.name]) {
          newData[field.name] = '';
        }
      });

      return newData;
    });

    setUserModifiedFields((prev) => new Set([...prev, fieldName]));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    handleChange(name, type === 'checkbox' ? checked : value);
  };

  const handleSelectChange = (name, value) => {
    handleChange(name, value);
  };

  const isSectionValid = () => {
    if (!currentSection) {
      return true;
    }

    const invalidFields = [];
    const requiredFields = currentSection.fields.filter((f) => f.required === true);

    for (const field of currentSection.fields) {
      if (field.required === true) {
        const value = currentFormData[field.name];
        const hasInitialValue = initialValues.hasOwnProperty(field.name);
        const initialValue = initialValues[field.name];

        let isValid = false;

        if (Array.isArray(value)) {
          isValid = value.length > 0;
        } else if (typeof value === 'number') {
          isValid = value > 0;
        } else if (typeof value === 'boolean') {
          isValid = value === true;
        } else if (typeof value === 'string') {
          isValid = value.trim() !== '';
        } else {
          if (hasInitialValue && initialValue !== undefined && initialValue !== null && initialValue !== '') {
            if (typeof initialValue === 'string') {
              isValid = initialValue.trim() !== '';
            } else {
              isValid = true;
            }
          } else {
            isValid = false;
          }
        }

        if (!isValid) {
          invalidFields.push(field.question || field.label || field.name);
        }
      }
    }

    return invalidFields.length === 0;
  };

  const handleFormSubmit = () => {
    const isValid = isSectionValid();

    if (!isValid) {
      const missingFields = [];

      currentSection.fields.forEach((field) => {
        if (field.required === true) {
          const value = currentFormData[field.name];
          const hasInitialValue = initialValues.hasOwnProperty(field.name);
          const initialValue = initialValues[field.name];

          let isValid = false;

          if (Array.isArray(value)) {
            isValid = value.length > 0;
          } else if (typeof value === 'number') {
            isValid = value > 0;
          } else if (typeof value === 'boolean') {
            isValid = value === true;
          } else if (typeof value === 'string') {
            isValid = value.trim() !== '';
          } else {
            if (hasInitialValue && initialValue !== undefined && initialValue !== null && initialValue !== '') {
              if (typeof initialValue === 'string') {
                isValid = initialValue.trim() !== '';
              } else {
                isValid = true;
              }
            } else {
              isValid = false;
            }
          }

          if (!isValid) {
            missingFields.push(field.question || field.label || field.name);
          }
        }
      });

      toast.error(`Please fill all required fields: ${missingFields.join(', ')}`, {});
      return;
    }

    const finalData = getFinalFormData();

    if (handleSubmit) {
      handleSubmit(finalData);
    }
  };

  const handleNext = () => {
    const isValid = isSectionValid();

    if (!isValid) {
      const missingFields = [];

      currentSection.fields.forEach((field) => {
        if (field.required === true) {
          const value = currentFormData[field.name];
          const hasInitialValue = initialValues.hasOwnProperty(field.name);
          const initialValue = initialValues[field.name];

          let isValid = false;

          if (Array.isArray(value)) {
            isValid = value.length > 0;
          } else if (typeof value === 'number') {
            isValid = value > 0;
          } else if (typeof value === 'boolean') {
            isValid = value === true;
          } else if (typeof value === 'string') {
            isValid = value.trim() !== '';
          } else {
            if (hasInitialValue && initialValue !== undefined && initialValue !== null && initialValue !== '') {
              if (typeof initialValue === 'string') {
                isValid = initialValue.trim() !== '';
              } else {
                isValid = true;
              }
            } else {
              isValid = false;
            }
          }

          if (!isValid) {
            missingFields.push(field.question || field.label || field.name);
          }
        }
      });

      toast.error(`Please fill all required fields: ${missingFields.join(', ')}`, {});
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
          ? 'backdrop-blur-sm bg-card/80 rounded-lg max-w-2xl mx-auto'
          : 'bg-transparent border-0 shadow-none p-0 !gap-2 max-h-[32rem] overflow-y-auto'
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
                // ✅ NEW: Get filtered options for cascading
                const selectOptions = getFilteredOptions(field);
                const isDisabled = field.parentField && !currentFormData[field.parentField];

                return (
                  <div className="relative" key={fieldId}>
                    <Label
                      htmlFor={fieldId}
                      className={`mb-2 capitalize block ${
                        field.required ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ''
                      }`}
                    >
                      {fieldLabel}
                      {field.parentField && (
                        <span className="text-xs text-gray-500 ml-2">(depends on {field.parentField})</span>
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
                        <SelectTrigger className="pl-10" id={fieldId}>
                          <SelectValue
                            placeholder={
                              isDisabled
                                ? `Select ${field.parentField} first`
                                : selectOptions.length === 0
                                ? 'No options available'
                                : 'Select an option'
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
              <Button onClick={handleFormSubmit} disabled={formSubmitted}>
                Submit
              </Button>
            ) : showNextButton ? (
              <Button onClick={handleNext} className="flex items-center gap-2">
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={handleFormSubmit} disabled={formSubmitted}>
                Submit
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
