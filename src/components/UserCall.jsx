import { User, Mail, Phone, MapPin, Home, Building, MapPinned, Building2, MailOpen, MessageSquare } from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';

const UserCall = ({ formData, setFormData, userCallDialog }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  function userCallorm() {
    return (
      <form className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* First Name */}
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              name="firstName"
              type="text"
              placeholder="First Name"
              value={formData.firstName}
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
              value={formData.lastName}
              onChange={handleChange}
              className="pl-10 border-border"
              aria-label="Last Name"
            />
          </div>
          {/* Mobile Number */}
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              name="number"
              type="text"
              placeholder="Mobile Number"
              value={formData.number}
              onChange={handleChange}
              className="pl-10 border-border"
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
              value={formData.alternateNumber}
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
              value={formData.address}
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
              value={formData.state}
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
              value={formData.district}
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
              value={formData.city}
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
              value={formData.postalCode}
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
              value={formData.email}
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
            value={formData.comment}
            onChange={handleChange}
            className="pl-10 min-h-20 resize-none border-border"
            aria-label="Comment"
          />
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
