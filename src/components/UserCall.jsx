import { User, Mail, Phone, MapPin, Home, Building, MapPinned, Building2, MailOpen, MessageSquare } from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';

const UserCall = ({ 
  formData, 
  setFormData, 
  userCallDialog, 
  userCall, 
  handleSubmit, 
  formSubmitted,
  // NEW PROPS for local form data
  localFormData,
  setLocalFormData
}) => {
  // Use localFormData if provided, otherwise fallback to formData
  const currentFormData = localFormData || formData || {};
  const setCurrentFormData = setLocalFormData || setFormData || (() => {});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  function userCallorm() {
    return (
      <form className="space-y-6" onSubmit={handleSubmit}>
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
          {/* Mobile Number - Now fixed and disabled */}
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              name="number"
              type="tel"
              placeholder="Mobile Number"
              value={userCall?.contactNumber || ''}
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
              name="address"
              type="text"
              placeholder="Address"
              value={currentFormData.address || ''}
              onChange={handleChange}
              className="pl-10 border-border"
              aria-label="Address"
            />
          </div>
          {/* State */}
          <div className="relative">
            <MapPinned className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              name="state"
              type="text"
              placeholder="State"
              value={currentFormData.state || ''}
              onChange={handleChange}
              className="pl-10 border-border"
              aria-label="State"
            />
          </div>
          {/* District */}
          <div className="relative">
            <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              name="district"
              type="text"
              placeholder="District"
              value={currentFormData.district || ''}
              onChange={handleChange}
              className="pl-10 border-border"
              aria-label="District"
            />
          </div>
          {/* City */}
          <div className="relative">
            <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              name="city"
              type="text"
              placeholder="City"
              value={currentFormData.city || ''}
              onChange={handleChange}
              className="pl-10 border-border"
              aria-label="City"
            />
          </div>
          {/* Postal Code */}
          <div className="relative">
            <MailOpen className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              name="postalCode"
              type="text"
              placeholder="Postal Code"
              value={currentFormData.postalCode || ''}
              onChange={handleChange}
              className="pl-10 border-border"
              aria-label="Postal Code"
            />
          </div>
          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              name="email"
              type="email"
              placeholder="Email"
              value={currentFormData.email || ''}
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
    return userCallorm();
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
      <CardContent>{userCallorm()}</CardContent>
    </Card>
  );
};

export default UserCall;
