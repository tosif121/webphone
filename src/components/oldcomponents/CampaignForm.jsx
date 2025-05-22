import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FaPlus, FaTrash, FaFilter, FaSpinner } from 'react-icons/fa';

const CampaignForm = ({ fetchCampaigns, setAddCampaign, editingCampaign }) => {
  const [fields, setFields] = useState(editingCampaign ? editingCampaign.fields : []);
  const [formData, setFormData] = useState({
    campaignName: editingCampaign ? editingCampaign.campaignName : '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const addField = () => {
    setFields([
      ...fields,
      {
        id: Date.now(),
        label: '',
        type: 'text',
        options: [],
        condition: {
          dependentField: null,
          operator: 'equals',
          value: '',
        },
        visible: true,
      },
    ]);
  };

  const removeField = (id) => {
    setFields(fields.filter((field) => field.id !== id));
    const updatedData = { ...formData };
    delete updatedData[id];
    setFormData(updatedData);
  };

  const handleFieldChange = (id, key, value) => {
    setFields(fields.map((field) => (field.id === id ? { ...field, [key]: value } : field)));
  };

  const updateCondition = (id, conditionKey, value) => {
    setFields(
      fields.map((field) =>
        field.id === id
          ? {
              ...field,
              condition: { ...field.condition, [conditionKey]: value },
            }
          : field
      )
    );
  };
  const resetForm = () => {
    setFields([]);
    setFormData({ campaignName: '' });
  };

  const handleInputChange = (id, value) => {
    const updatedFormData = { ...formData, [id]: value };
    setFormData(updatedFormData);

    const updatedFields = fields.map((field) => {
      if (field.condition.dependentField) {
        const dependentValue = updatedFormData[field.condition.dependentField];

        switch (field.condition.operator) {
          case 'equals':
            field.visible = dependentValue === field.condition.value;
            break;
          case 'not equals':
            field.visible = dependentValue !== field.condition.value;
            break;
          default:
            field.visible = true;
        }
      }
      return field;
    });

    setFields(updatedFields);
  };

  const addOption = (id) => {
    setFields(fields.map((field) => (field.id === id ? { ...field, options: [...(field.options || []), ''] } : field)));
  };

  const updateOption = (id, index, value) => {
    setFields(
      fields.map((field) =>
        field.id === id
          ? {
              ...field,
              options: field.options.map((opt, i) => (i === index ? value : opt)),
            }
          : field
      )
    );
  };

  const removeOption = (id, index) => {
    setFields(
      fields.map((field) =>
        field.id === id
          ? {
              ...field,
              options: field.options.filter((_, i) => i !== index),
            }
          : field
      )
    );
  };

  const renderFormField = (field) => {
    if (!field.visible) return null;

    switch (field.type) {
      case 'text':
      case 'number':
      case 'email':
      case 'date':
        return (
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2 capitalize">{field.label}</label>
            <input
              type={field.type}
              placeholder={`Enter ${field.label}`}
              className="w-full px-3 py-2 border rounded outline-none capitalize"
              value={formData[field.id] || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
            />
          </div>
        );

      case 'textarea':
        return (
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2 capitalize">{field.label}</label>
            <textarea
              placeholder={`Enter ${field.label}`}
              className="w-full px-3 py-2 border rounded outline-none capitalize"
              value={formData[field.id] || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
            />
          </div>
        );

      case 'checkbox':
        return (
          <div className="mb-4 flex items-center">
            <input
              type="checkbox"
              id={`checkbox-${field.id}`}
              checked={formData[field.id] || false}
              onChange={(e) => handleInputChange(field.id, e.target.checked)}
              className="mr-2"
            />
            <label htmlFor={`checkbox-${field.id}`} className="text-gray-700">
              {field.label}
            </label>
          </div>
        );

      case 'radio':
        return (
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2 capitalize">{field.label}</label>
            <div className="space-y-2">
              {field.options.map((option, index) => (
                <div key={index} className="flex items-center">
                  <input
                    type="radio"
                    id={`radio-${field.id}-${index}`}
                    name={`radio-${field.id}`}
                    value={option}
                    checked={formData[field.id] === option}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    className="mr-2"
                  />
                  <label htmlFor={`radio-${field.id}-${index}`} className="text-gray-700">
                    {option}
                  </label>
                </div>
              ))}
            </div>
          </div>
        );

      case 'select':
        return (
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2 capitalize">{field.label}</label>
            <select
              className="w-full px-3 py-2 border rounded outline-none capitalize"
              value={formData[field.id] || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
            >
              <option value="">Select {field.label}</option>
              {field.options.map((option, index) => (
                <option key={index} value={option} className="capitalize">
                  {option}
                </option>
              ))}
            </select>
          </div>
        );

      default:
        return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.campaignName) {
      toast.error('Campaign Name is required');
      setIsLoading(false);
      return;
    }

    try {
      const endpoint = editingCampaign
        ? `http://localhost:5000/api/campaign-update/${editingCampaign.id}`
        : 'http://localhost:5000/api/campaign';

      const response = await axios.post(
        endpoint,
        {
          campaignFields: {
            campaignName: formData.campaignName,
            fields: fields,
          },
          metadata: {
            timestamp: new Date().toISOString(),
            source: 'dynamic-form-builder',
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      setAddCampaign(false);
      fetchCampaigns();
      toast.success(editingCampaign ? 'Campaign updated successfully!' : 'Form submitted successfully!');
      resetForm();
      setIsLoading(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit form');
      setIsLoading(false);
    }
  };

  const submitButtonText = editingCampaign ? 'Update Campaign' : 'Create Campaign';

  return (
    <>
      <div className="mx-auto bg-white rounded-lg shadow p-4">
        <div className="flex items justify-between space-x-6">
          <div className="w-full">
            <h1 className="font-semibold leading-5 text-start capitalize text-2xl text-gray-900 dark:text-white mb-4">Campaign Form</h1>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2 capitalize">Campaign Name</label>
              <input
                type="text"
                placeholder="Enter Campaign Name"
                className="w-full px-3 py-2 border rounded outline-none capitalize"
                value={formData.campaignName}
                onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
                required
              />
            </div>

            <div className="mb-6">
              <button
                onClick={addField}
                className="py-2 px-4 bg-blue hover:bg-blue-dark text-white font-medium rounded-md shadow-sm outline-none flex items-center gap-2"
              >
                <FaPlus /> Add Field
              </button>
            </div>

            <div className="space-y-4">
              {fields.map(
                (field) =>
                  field.visible && (
                    <div key={field.id} className="p-4 bg-white border rounded-lg shadow-sm">
                      <div className="flex items-center gap-4">
                        <input
                          type="text"
                          placeholder="Field Label"
                          className="flex-1 px-3 py-2 border rounded outline-none"
                          value={field.label}
                          onChange={(e) => handleFieldChange(field.id, 'label', e.target.value)}
                        />
                        <select
                          className="px-3 py-2 border rounded outline-none"
                          value={field.type}
                          onChange={(e) => handleFieldChange(field.id, 'type', e.target.value)}
                        >
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="email">Email</option>
                          <option value="date">Date</option>
                          <option value="textarea">Textarea</option>
                          <option value="checkbox">Checkbox</option>
                          <option value="radio">Radio Button</option>
                          <option value="select">Select Box</option>
                        </select>
                        <button onClick={() => removeField(field.id)} className="text-red-500 hover:text-red-600">
                          <FaTrash />
                        </button>
                      </div>

                      <div className="mt-4 bg-gray-50 p-3 rounded border">
                        <div className="flex items-center gap-2 mb-2">
                          <FaFilter className="text-gray-500" />
                          <span className="font-semibold text-sm">Conditional Logic</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <select
                            value={field.condition.dependentField || ''}
                            onChange={(e) => updateCondition(field.id, 'dependentField', e.target.value)}
                            className="px-2 py-1 border rounded outline-none"
                          >
                            <option value="">Select Dependent Field</option>
                            {fields
                              .filter((f) => f.id !== field.id)
                              .map((f) => (
                                <option key={f.id} value={f.id.toString()}>
                                  {f.label || `Field ${f.id}`}
                                </option>
                              ))}
                          </select>

                          <select
                            value={field.condition.operator}
                            onChange={(e) => updateCondition(field.id, 'operator', e.target.value)}
                            className="px-2 py-1 border rounded outline-none"
                          >
                            <option value="equals">Equals</option>
                            <option value="not equals">Not Equals</option>
                          </select>

                          <input
                            type="text"
                            placeholder="Condition Value"
                            value={field.condition.value}
                            onChange={(e) => updateCondition(field.id, 'value', e.target.value)}
                            className="px-2 py-1 border rounded outline-none"
                          />
                        </div>
                      </div>

                      {['select', 'radio'].includes(field.type) && (
                        <div className="mt-4 space-y-2">
                          {field.options.map((option, index) => (
                            <div key={index} className="flex items-center gap-4">
                              <input
                                type="text"
                                placeholder={`Option ${index + 1}`}
                                className="flex-1 px-3 py-2 border rounded outline-none"
                                value={option}
                                onChange={(e) => updateOption(field.id, index, e.target.value)}
                              />
                              <button
                                onClick={() => removeOption(field.id, index)}
                                className="text-red-500 hover:text-red-600"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => addOption(field.id)}
                            className="bg-green-500 text-white px-4 py-2 rounded shadow hover:bg-green-600"
                          >
                            Add Option
                          </button>
                        </div>
                      )}
                    </div>
                  )
              )}
            </div>
          </div>
          <div className="w-full border-l-2 ps-8">
            <h2 className="text-2xl font-semibold mb-4">Form Preview</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2 capitalize">Campaign Name</label>
                <input
                  type="text"
                  placeholder="Enter Campaign Name"
                  className="w-full px-3 py-2 border rounded outline-none capitalize"
                  value={formData.campaignName}
                  onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
                  required
                />
              </div>
              {fields.map((field) => renderFormField(field))}
            </form>
            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={isLoading}
                onClick={handleSubmit}
                className={`px-4 py-2 rounded-md shadow-sm flex items-center gap-2 hover:bg-blue-dark ${
                  isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue text-white'
                }`}
              >
                {isLoading ? (
                  <>
                    <FaSpinner className="animate-spin" /> {editingCampaign ? 'Updating...' : 'Submitting...'}
                  </>
                ) : (
                  submitButtonText
                )}
              </button>
              {editingCampaign && (
                <button
                  type="button"
                  onClick={() => setAddCampaign(false)}
                  className="ml-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-md"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CampaignForm;
