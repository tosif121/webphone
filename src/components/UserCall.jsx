import { User, Mail, Phone, MapPin, Building, MapPinned, Building2, MailOpen, MessageSquare } from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { useEffect, useState } from 'react';

const UserCall = ({ localFormData, setLocalFormData, userCallDialog, userCall, handleSubmit, formSubmitted }) => {
  // Initialize state - prioritize localFormData, fallback to userCall
  const initializeFormData = () => {
    return {
      firstName: localFormData?.firstName || userCall?.firstName || '',
      lastName: localFormData?.lastName || userCall?.lastName || '',
      emailId: localFormData?.emailId || userCall?.emailId || userCall?.Email || userCall?.email || '',
      contactNumber: userCall?.contactNumber || localFormData?.contactNumber || '',
      alternateNumber: localFormData?.alternateNumber || userCall?.alternateNumber || '',
      comment: localFormData?.comment || userCall?.comment || userCall?.Remarks || '',
      Contactaddress: localFormData?.Contactaddress || userCall?.Contactaddress || userCall?.address || '',
      ContactDistrict: localFormData?.ContactDistrict || userCall?.ContactDistrict || '',
      ContactCity: localFormData?.ContactCity || userCall?.ContactCity || userCall?.city || userCall?.CIty || '',
      ContactState: localFormData?.ContactState || userCall?.ContactState || userCall?.state || '',
      ContactPincode:
        localFormData?.ContactPincode ||
        userCall?.ContactPincode ||
        userCall?.postalCode ||
        userCall?.['Pincode '] ||
        '',
    };
  };

  const [currentFormData, setCurrentFormData] = useState(initializeFormData());

  // Update when localFormData or userCall changes
  useEffect(() => {
    const newData = initializeFormData();
    setCurrentFormData(newData);
  }, [localFormData, userCall]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    const updatedData = {
      ...currentFormData,
      [name]: value,
    };

    setCurrentFormData(updatedData);

    // Update parent state
    if (setLocalFormData) {
      setLocalFormData(updatedData);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    // Submission with exact API field names
    const submissionData = {
      firstName: currentFormData.firstName,
      lastName: currentFormData.lastName,
      emailId: currentFormData.emailId,
      contactNumber: userCall?.contactNumber || currentFormData.contactNumber,
      alternateNumber: currentFormData.alternateNumber,
      comment: currentFormData.comment,
      Contactaddress: currentFormData.Contactaddress,
      ContactDistrict: currentFormData.ContactDistrict,
      ContactCity: currentFormData.ContactCity,
      ContactState: currentFormData.ContactState,
      ContactPincode: currentFormData.ContactPincode,
    };
    handleSubmit(e, submissionData);
  };

  function userCallForm() {
    return (
      <form className="space-y-6 max-h-[32rem] overflow-y-auto" onSubmit={onSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* First Name */}
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              name="firstName"
              type="text"
              placeholder="First Name"
              value={currentFormData.firstName || ''}
              onChange={handleChange}
              className="pl-10 border-border"
              aria-label="First Name"
            />
          </div>

          {/* Last Name */}
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              name="lastName"
              type="text"
              placeholder="Last Name"
              value={currentFormData.lastName || ''}
              onChange={handleChange}
              className="pl-10 border-border"
              aria-label="Last Name"
            />
          </div>

          {/* Mobile Number - Fixed and disabled */}
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              name="contactNumber"
              type="tel"
              placeholder="Mobile Number"
              value={userCall?.contactNumber || currentFormData.contactNumber || ''}
              disabled
              className="pl-10 border-border bg-muted/50 cursor-not-allowed"
              aria-label="Mobile Number"
            />
          </div>

          {/* Alternate Number */}
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              name="alternateNumber"
              type="text"
              placeholder="Alternate Number"
              value={currentFormData.alternateNumber || ''}
              onChange={handleChange}
              className="pl-10 border-border"
              aria-label="Alternate Number"
            />
          </div>

          {/* Address */}
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              name="Contactaddress"
              type="text"
              placeholder="Address"
              value={currentFormData.Contactaddress || ''}
              onChange={handleChange}
              className="pl-10 border-border"
              aria-label="Address"
            />
          </div>

          {/* State */}
          <div className="relative">
            <MapPinned className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              name="ContactState"
              type="text"
              placeholder="State"
              value={currentFormData.ContactState || ''}
              onChange={handleChange}
              className="pl-10 border-border"
              aria-label="State"
            />
          </div>

          {/* District */}
          <div className="relative">
            <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              name="ContactDistrict"
              type="text"
              placeholder="District"
              value={currentFormData.ContactDistrict || ''}
              onChange={handleChange}
              className="pl-10 border-border"
              aria-label="District"
            />
          </div>

          {/* City */}
          <div className="relative">
            <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              name="ContactCity"
              type="text"
              placeholder="City"
              value={currentFormData.ContactCity || ''}
              onChange={handleChange}
              className="pl-10 border-border"
              aria-label="City"
            />
          </div>

          {/* Postal Code */}
          <div className="relative">
            <MailOpen className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              name="ContactPincode"
              type="text"
              placeholder="Postal Code"
              value={currentFormData.ContactPincode || ''}
              onChange={handleChange}
              className="pl-10 border-border"
              aria-label="Postal Code"
            />
          </div>

          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              name="emailId"
              type="email"
              placeholder="Email"
              value={currentFormData.emailId || ''}
              onChange={handleChange}
              className="pl-10 border-border"
              aria-label="Email"
            />
          </div>
        </div>

        {/* Comment */}
        <div className="relative">
          <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Textarea
            name="comment"
            placeholder="Enter your comment here!"
            value={currentFormData.comment || ''}
            onChange={handleChange}
            className="pl-10 min-h-20 resize-none border-border"
            aria-label="Comment"
          />
        </div>

        <div className="flex justify-end mt-6">
          <Button type="submit" disabled={formSubmitted}>
            Save Contact
          </Button>
        </div>
      </form>
    );
  }

  if (userCallDialog) {
    return userCallForm();
  }

  return (
    <Card className="backdrop-blur-sm bg-card/80 rounded-lg max-w-2xl mx-auto">
      <CardHeader className="pb-2">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center shadow-md">
            <User className="text-primary-foreground" size={18} aria-hidden="true" />
          </div>
          <div className="ml-3">
            <CardTitle className="text-xl text-foreground">Contact Details</CardTitle>
            <CardDescription className="text-muted-foreground">Edit or review contact information</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>{userCallForm()}</CardContent>
    </Card>
  );
};

export default UserCall;
