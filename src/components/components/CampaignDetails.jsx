import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import CampaignAgentTable from './CampaignAgentTable';

const CampaignDetails = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [formData, setFormData] = useState({});
  const [visibleFields, setVisibleFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [campaignDetails, setCampaignDetails] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/campaign');
        const campaignData = response.data.data.map((item) => ({
          name: item.data.campaignFields.campaignName,
          fields: [
            ...item.data.campaignFields.fields.map((field) => ({
              ...field,
              visible: field.condition.dependentField ? false : field.visible,
            })),
            {
              id: 'status',
              label: 'status',
              type: 'select',
              options: ['approved', 'rejected', 'pending'],
              visible: true,
              condition: { dependentField: null },
              required: true,
            },
          ],
        }));

        setCampaigns(campaignData);
        if (campaignData.length > 0) {
          setSelectedCampaign(campaignData[0].name);
          setVisibleFields(campaignData[0].fields);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to fetch campaigns');
      }
    };

    fetchCampaigns();
  }, []);

  const validateForm = () => {
    const newErrors = {};

    visibleFields.forEach((field) => {
      if (field.visible && field.required) {
        if (!formData[field.id] || formData[field.id].trim() === '') {
          newErrors[field.id] = `${field.label} is required`;
        }
      }
      if (
        field.id === 'status' &&
        (!formData.status || !['approved', 'rejected', 'pending'].includes(formData.status))
      ) {
        newErrors.status = 'Please select a valid status';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const evaluateCondition = (dependentValue, operator, value) => {
    switch (operator) {
      case 'equals':
        return String(dependentValue).toLowerCase() === String(value).toLowerCase();
      case 'notEquals':
        return String(dependentValue).toLowerCase() !== String(value).toLowerCase();
      default:
        return false;
    }
  };

  const handleCampaignChange = (e) => {
    const selected = campaigns.find((campaign) => campaign.name === e.target.value);
    setSelectedCampaign(selected.name);
    setFormData({});
    setErrors({});
    setVisibleFields(
      selected.fields.map((field) => ({
        ...field,
        visible: field.condition.dependentField ? false : field.visible,
      }))
    );
  };

  const handleInputChange = (id, value) => {
    const updatedFormData = { ...formData, [id]: value };
    setFormData(updatedFormData);

    // Clear error when field is filled
    if (errors[id]) {
      setErrors({ ...errors, [id]: undefined });
    }

    const updatedFields = visibleFields.map((field) => {
      if (field.condition && field.condition.dependentField) {
        const dependentValue = updatedFormData[field.condition.dependentField];
        const isVisible = evaluateCondition(dependentValue, field.condition.operator, field.condition.value);

        if (!isVisible && updatedFormData[field.id]) {
          delete updatedFormData[field.id];
        }

        return { ...field, visible: isVisible };
      }
      return field;
    });

    setFormData(updatedFormData);
    setVisibleFields(updatedFields);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fill the form submitting');
      return;
    }

    setLoading(true);

    try {
      const labelBasedFormData = Object.keys(formData).reduce((acc, fieldId) => {
        const field = visibleFields.find((f) => String(f.id) === String(fieldId));

        if (field) {
          acc[field.label] = formData[fieldId];
        }

        return acc;
      }, {});

      const payload = {
        campaignName: selectedCampaign,
        formData: labelBasedFormData,
      };

      const response = await axios.post('http://localhost:5000/api/campaign-agent', payload);

      toast.success('Campaign data saved successfully!');

      setFormData({});
      setErrors({});
      setVisibleFields(
        visibleFields.map((field) => ({
          ...field,
          visible: field.condition.dependentField ? false : field.visible,
        }))
      );
    } catch (err) {
      console.error('Submission error:', err);
      toast.error('Failed to save campaign data');
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field) => {
    switch (field.type) {
      case 'text':
      case 'number':
        return (
          <div>
            <input
              type={field.type}
              id={field.id}
              value={formData[field.id] || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className={`input-box ${errors[field.id] ? 'border-red-500' : ''}`}
            />
            {errors[field.id] && <p className="text-red-500 text-sm mt-1">{errors[field.id]}</p>}
          </div>
        );
      case 'textarea':
        return (
          <div>
            <textarea
              id={field.id}
              value={formData[field.id] || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className={`input-box ${errors[field.id] ? 'border-red-500' : ''}`}
              rows="3"
            />
            {errors[field.id] && <p className="text-red-500 text-sm mt-1">{errors[field.id]}</p>}
          </div>
        );
      case 'select':
        return (
          <div>
            <select
              id={field.id}
              value={formData[field.id] || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className={`input-box ${errors[field.id] ? 'border-red-500' : ''}`}
            >
              <option value="" className="dark:bg-black/50">
                Select an option
              </option>
              {field.options.map((option, index) => (
                <option key={index} value={option} className="dark:bg-black/50">
                  {option}
                </option>
              ))}
            </select>
            {errors[field.id] && <p className="text-red-500 text-sm mt-1">{errors[field.id]}</p>}
          </div>
        );
      case 'radio':
        return (
          <div>
            <div className="flex gap-4">
              {field.options.map((option, index) => (
                <label key={index} className="!flex !items-center !gap-2 input-label">
                  <input
                    type="radio"
                    name={field.id}
                    value={option}
                    checked={formData[field.id] === option}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                  />
                  <span className="text-sm capitalize">{option}</span>
                </label>
              ))}
            </div>
            {errors[field.id] && <p className="text-red-500 text-sm mt-1">{errors[field.id]}</p>}
          </div>
        );
      default:
        return null;
    }
  };

  const handleButtonClick = () => {
    setCampaignDetails(false);
  };

  const renderButton = () => (
    <button className="primary-btn" onClick={handleButtonClick}>
      Add Campaign
    </button>
  );

  return (
    <>
      {campaignDetails ? (
        <CampaignAgentTable button={renderButton()} />
      ) : (
        <div className="w-full mx-auto bg-white dark:bg-black/50 rounded-lg shadow p-3">
          <div className="mb-4 text-end">
            <button className="primary-btn" onClick={() => setCampaignDetails(true)}>
              Campaign Details
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 md:gap-4">
            <div>
              <label className="input-label">Select Campaign</label>
              <select className="input-box" value={selectedCampaign} onChange={handleCampaignChange}>
                {campaigns.map((campaign) => (
                  <option key={campaign.name} value={campaign.name} className="dark:bg-black/50">
                    {campaign.name}
                  </option>
                ))}
              </select>
            </div>

            {visibleFields.map(
              (field) =>
                field.visible && (
                  <div key={field.id}>
                    <label className="input-label" htmlFor={field.id}>
                      {field.label}
                    </label>
                    {renderField(field)}
                  </div>
                )
            )}
          </div>

          <button onClick={handleSubmit} className="primary-btn mt-4" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      )}
    </>
  );
};

export default CampaignDetails;
