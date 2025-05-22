import axios from 'axios';
import React, { useEffect, useState } from 'react';
import CommonTable from './table/CommonTable';
import { BiEdit, BiTrash } from 'react-icons/bi';
import toast from 'react-hot-toast';
import CampaignForm from './CampaignForm';
import Modal from './table/Modal';

function Campaign() {
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addCampaign, setAddCampaign] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState(null);

  const handleEdit = (campaign) => {
    setEditingCampaign(campaign);
    setAddCampaign(true);
  };

  const renderAction = (id) => {
    const campaign = campaigns.find((c) => c.id === id);
    return (
      <>
        <button
          onClick={() => handleEdit(campaign)}
          className="bg-green-500 text-white px-2.5 py-2 rounded hover:bg-green-800 me-3"
        >
          <BiEdit size={20} />
        </button>
        <button
          onClick={() => {
            setCampaignToDelete(id);
            setIsDeleteModalOpen(true);
          }}
          className="bg-red-500 text-white px-2.5 py-2 rounded hover:bg-red-800"
        >
          <BiTrash size={20} />
        </button>
      </>
    );
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/campaign');
      if (response.data.status) {
        setCampaigns(
          response.data.data.map((campaign) => ({
            id: campaign._id,
            campaignName: campaign.data.campaignFields.campaignName,
            fields: campaign.data.campaignFields.fields,
          }))
        );
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch campaigns');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!campaignToDelete) return;

    try {
      const response = await axios.post(`http://localhost:5000/api/campaign-delete/${campaignToDelete}`);
      if (response.data.status) {
        toast.success('Campaign deleted successfully');
        setCampaigns((prev) => prev.filter((campaign) => campaign.id !== campaignToDelete));
        setIsDeleteModalOpen(false);
      }
    } catch (error) {
      console.error('Error deleting campaign:', error.response?.data || error.message);
      toast.error('Failed to delete campaign');
    }
  };

  const columns = [
    { label: 'Campaign Name', accessor: 'campaignName' },
    { label: 'Action', accessor: 'id', render: renderAction, sorting: false },
  ];

  return (
    <>
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete"
        handleSubmit={handleDelete}
        submitButtonText="Delete"
        submitButtonClassName="bg-red-500 hover:bg-red-600 text-white"
      >
        <p className="text-gray-700 dark:text-gray-300 p-4 text-center">
          Are you sure you want to delete this campaign?{' '}
        </p>
      </Modal>

      <div className="text-end mb-4">
        <button
          className="primary-btn"
          onClick={() => {
            setEditingCampaign(null);
            setAddCampaign(!addCampaign);
          }}
        >
          {(!addCampaign && 'Add Campaign') || 'Campaign Details'}
        </button>
      </div>
      {(addCampaign && (
        <CampaignForm
          setAddCampaign={setAddCampaign}
          fetchCampaigns={fetchCampaigns}
          editingCampaign={editingCampaign}
        />
      )) || <CommonTable title="Campaign" data={campaigns} columns={columns} loading={isLoading} />}
    </>
  );
}

export default Campaign;
