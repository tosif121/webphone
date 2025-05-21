const maskPhoneNumber = (phoneNumber) => {
  const tokenData = localStorage.getItem('token');
  const parsedData = JSON.parse(tokenData);
  const numberMasking = parsedData?.userData?.numberMasking;

  if (numberMasking) {
    if (!phoneNumber) return phoneNumber;

    if (phoneNumber.startsWith('+91')) {
      const numberWithoutCountryCode = phoneNumber.slice(3);

      if (numberWithoutCountryCode.length <= 2) {
        return phoneNumber;
      }

      const maskedPart = numberWithoutCountryCode.slice(0, -2).replace(/./g, '*');
      const lastTwoDigits = numberWithoutCountryCode.slice(-2);

      return `+91${maskedPart}${lastTwoDigits}`;
    }

    if (phoneNumber.length <= 2) {
      return phoneNumber;
    }

    const maskedPart = phoneNumber.slice(0, -2).replace(/./g, '*');
    const lastTwoDigits = phoneNumber.slice(-2);

    return `${maskedPart}${lastTwoDigits}`;
  }

  return phoneNumber;
};

export default maskPhoneNumber;
