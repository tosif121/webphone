import { User, Mail, Phone, MapPin, Building, MapPinned, Building2, MailOpen, MessageSquare } from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { useEffect, useState } from 'react';

const UserCall = ({ localFormData, setLocalFormData, userCallDialog, userCall, handleSubmit, formSubmitted }) => {
  // Initialize form data function (NOT memoized)
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

  // Only update when userCall changes (not when localFormData changes)
  useEffect(() => {
    // Only reinitialize if userCall.contactNumber changes (new call)
    if (userCall?.contactNumber && userCall.contactNumber !== currentFormData.contactNumber) {
      setCurrentFormData(initializeFormData());
    }
  }, [userCall?.contactNumber]); // Only watch contactNumber

  const handleChange = (e) => {
    const { name, value } = e.target;

    const updatedData = {
      ...currentFormData,
      [name]: value,
    };

    // Update local state immediately
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

  const userCallForm = () => {
    return (
      <form className="space-y-6 max-h-[32rem] overflow-y-auto pr-2" onSubmit={onSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* First Name */}
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
            <Input
              name="firstName"
              type="text"
              placeholder="First Name"
              value={currentFormData.firstName}
              onChange={handleChange}
              className="pl-10 border-border"
              aria-label="First Name"
            />
          </div>

          {/* Last Name */}
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
            <Input
              name="lastName"
              type="text"
              placeholder="Last Name"
              value={currentFormData.lastName}
              onChange={handleChange}
              className="pl-10 border-border"
              aria-label="Last Name"
            />
          </div>

          {/* Mobile Number - Fixed and disabled */}
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
            <Input
              name="contactNumber"
              type="tel"
              placeholder="Mobile Number"
              value={userCall?.contactNumber || currentFormData.contactNumber}
              disabled
              className="pl-10 border-border bg-muted/50 cursor-not-allowed"
              aria-label="Mobile Number"
            />
          </div>

          {/* Alternate Number */}
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
            <Input
              name="alternateNumber"
              type="tel"
              placeholder="Alternate Number"
              value={currentFormData.alternateNumber}
              onChange={handleChange}
              className="pl-10 border-border"
              aria-label="Alternate Number"
            />
          </div>

          {/* Email */}
          <div className="relative md:col-span-2">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
            <Input
              name="emailId"
              type="email"
              placeholder="Email Address"
              value={currentFormData.emailId}
              onChange={handleChange}
              className="pl-10 border-border"
              aria-label="Email"
            />
          </div>

          {/* Address */}
          <div className="relative md:col-span-2">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
            <Input
              name="Contactaddress"
              type="text"
              placeholder="Street Address"
              value={currentFormData.Contactaddress}
              onChange={handleChange}
              className="pl-10 border-border"
              aria-label="Address"
            />
          </div>

          {/* City */}
          <div className="relative">
            <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
            <Input
              name="ContactCity"
              type="text"
              placeholder="City"
              value={currentFormData.ContactCity}
              onChange={handleChange}
              className="pl-10 border-border"
              aria-label="City"
            />
          </div>

          {/* District */}
          <div className="relative">
            <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
            <Input
              name="ContactDistrict"
              type="text"
              placeholder="District"
              value={currentFormData.ContactDistrict}
              onChange={handleChange}
              className="pl-10 border-border"
              aria-label="District"
            />
          </div>

          {/* State */}
          <div className="relative">
            <MapPinned className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
            <Input
              name="ContactState"
              type="text"
              placeholder="State"
              value={currentFormData.ContactState}
              onChange={handleChange}
              className="pl-10 border-border"
              aria-label="State"
            />
          </div>

          {/* Postal Code */}
          <div className="relative">
            <MailOpen className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
            <Input
              name="ContactPincode"
              type="text"
              placeholder="Postal Code"
              value={currentFormData.ContactPincode}
              onChange={handleChange}
              className="pl-10 border-border"
              aria-label="Postal Code"
            />
          </div>
        </div>

        {/* Comment */}
        <div className="relative">
          <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
          <Textarea
            name="comment"
            placeholder="Enter your comments or notes here..."
            value={currentFormData.comment}
            onChange={handleChange}
            className="pl-10 min-h-24 resize-none border-border"
            aria-label="Comment"
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button type="submit" disabled={formSubmitted} className="min-w-[120px]">
            {formSubmitted ? 'Saving...' : 'Save Contact'}
          </Button>
        </div>
      </form>
    );
  };

  if (userCallDialog) {
    return userCallForm();
  }

  return (
    <Card className="backdrop-blur-sm bg-card/80 rounded-lg max-w-3xl mx-auto shadow-lg">
      <CardHeader className="pb-4 border-b">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/20">
            <User className="text-primary" size={20} aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-2xl text-foreground">Contact Details</CardTitle>
            <CardDescription className="text-muted-foreground text-sm">
              {userCall?.contactNumber ? `Caller: ${userCall.contactNumber}` : 'Edit or review contact information'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">{userCallForm()}</CardContent>
    </Card>
  );
};

export default UserCall;
