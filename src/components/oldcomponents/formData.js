export const formData = {
  formTitle: 'Outbound Form',
  sections: [
    {
      id: 1,
      nextSection: 'next',
      title: '',
      fields: [
        {
          label: 'Relationship Manager',
          name: 'Relationship Manager',
          type: 'multiple-options',
          required: true,
          options: [
            {
              label: 'Anant Khandal',
              value: 'Anant Khandal',
            },
            {
              label: 'Vijay Sharma',
              value: 'Vijay Sharma',
            },
            {
              label: 'Rohit Singh',
              value: 'Rohit Singh',
            },
            {
              label: 'Arjun Singh',
              value: 'Arjun Singh',
            },
            {
              label: 'Others (Specify)',
              value: 'Others (Specify)',
            },
          ],
        },
      ],
    },
    {
      id: 2,
      nextSection: 'next',
      title: 'Caller Details',
      fields: [
        {
          label: "Patient's Name",
          name: "Patient's Name",
          type: 'text',
          required: true,
        },
        {
          label: 'Contact Number',
          name: 'Contact Number',
          type: 'text',
          required: true,
        },
        {
          label: 'Call Status',
          name: 'Call Status',
          type: 'select',
          options: [
            {
              label: 'Connected',
              value: 'Connected',
            },
            {
              label: 'Call Waiting',
              value: 'Call Waiting',
            },
            {
              label: 'Not Answered',
              value: 'Not Answered',
            },
            {
              label: 'Asked to Call Back',
              value: 'Asked to Call Back',
            },
            {
              label: 'Switched Off / Not reachable',
              value: 'Switched Off / Not reachable',
            },
            {
              label: 'Wrong Number',
              value: 'Wrong Number',
            },
            {
              label: 'Call Disconnected',
              value: 'Call Disconnected',
            },
            {
              label: 'Already Visited Name in OPD / IPD List',
              value: 'Already Visited Name in OPD / IPD List',
            },
            {
              label: 'Mobile Number Not Mentioned',
              value: 'Mobile Number Not Mentioned',
            },
          ],
          required: true,
        },
      ],
    },
    {
      id: 3,
      nextSection: 'next',
      title: 'Purpose Of Calling',
      isDynamicSection: true,
      fields: [
        {
          label: 'Purpose Of Calling',
          // "isDynamicOption": "true",
          isDynamicOption: true,
          name: 'Purpose Of Calling',
          type: 'select',
          options: [
            {
              label: 'Feedback-IPD Discharge',
              value: 'Feedback-IPD Discharge',
              nextSection: 4,
            },
            {
              label: 'Feedback-OPD Visit',
              value: 'Feedback-OPD Visit',
              nextSection: 5,
            },
            {
              label: 'Follow Up-Appointment',
              value: 'Follow Up-Appointment',
              nextSection: 7,
            },
            {
              label: 'Follow Up-Surgery Query',
              value: 'Follow Up-Surgery Query',
              nextSection: 9,
            },
            {
              label: 'Follow Up-OPD Query',
              value: 'Follow Up-OPD Query',
              nextSection: 9,
            },
            {
              label: 'Follow up- Diagnose & Tests',
              value: 'Follow up- Diagnose & Tests',
              nextSection: 10,
            },
            {
              label: 'STS',
              value: 'STS',
              nextSection: 11,
            },
            {
              label: 'Call Back',
              value: 'Call Back',
              nextSection: 12,
            },
            {
              label: 'Appointment Reschedule',
              value: 'Appointment Reschedule',
              nextSection: 'next',
            },
            {
              label: 'Appointment Cancel',
              value: 'Appointment Cancel',
              nextSection: 'submit',
            },
            {
              label: 'Followup Up-Covid Query',
              value: 'Followup Up-Covid Query',
              nextSection: 8,
            },
            {
              label: 'Feedback- Complaint/Negative Feedback',
              value: 'Feedback- Complaint/Negative Feedback',
              nextSection: 14,
            },
            {
              label: 'Follow up- Emergency Query',
              value: 'Follow up- Emergency Query',
              nextSection: 9,
            },
            {
              label: 'Follow up- Whats app Query',
              value: 'Follow up- Whats app Query',
              nextSection: 15,
            },
            {
              label: 'Campaign Lead',
              value: 'Campaign Lead',
              nextSection: 16,
            },
            {
              label: 'IPD Revisit Follow-up',
              value: 'IPD Revisit Follow-up',
              nextSection: 17,
            },
            {
              label: 'Whats App Query',
              value: 'Whats App Query',
              nextSection: 18,
            },
            {
              label: 'Informative',
              value: 'Informative',
              nextSection: 21,
            },
            {
              label: 'Facebook',
              value: 'Facebook',
              nextSection: 22,
            },
          ],
          required: true,
        },
      ],
    },
    {
      id: 4,
      nextSection: 13,
      title: 'Feedback-IPD',
      fields: [
        {
          label: 'IPD Number',
          name: 'IPD Number',
          type: 'text',
          required: false,
        },
        {
          question: 'Doctor Name',
          label: 'Doctor Name',
          name: 'Doctor Name',
          type: 'select',
          options: [
            {
              label: 'Dr. John Smith',
              value: 'Dr. John Smith',
            },
            {
              label: 'Dr. Jane Doe',
              value: 'Dr. Jane Doe',
            },
            {
              label: 'Dr. James Bond',
              value: 'Dr. James Bond',
            },
            {
              label: 'Dr. Emma Watson',
              value: 'Dr. Emma Watson',
            },
            {
              label: 'Dr. Chris Hemsworth',
              value: 'Dr. Chris Hemsworth',
            },
          ],
          required: true,
        },
        {
          label: 'How would you rate the service?',
          name: 'Are you happy with the treatment provided in the hospital?',
          type: 'rating',
          question: 'Are you happy with the treatment provided in the hospital?',
          required: true,
        },
        {
          label: 'How would you rate the service?',
          name: 'Did the Doctor Explain about your problem / disease ?',
          type: 'rating',
          question: 'Did the Doctor Explain about your problem / disease ?',
          required: true,
        },
        {
          label: 'How would you rate the service?',
          name: 'Did the nursing staff gave solution to your problem ?',
          type: 'rating',
          question: 'Did the nursing staff gave solution to your problem ?',
          required: true,
        },
        {
          label: 'How would you rate the service?',
          name: 'Are you happy with the hygiene and cleanliness maintained in the wards ?',
          type: 'rating',
          question: 'Are you happy with the hygiene and cleanliness maintained in the wards ?',
          required: true,
        },
        {
          label: 'How would you rate the service?',
          name: 'Do you want, the services given in the ward should be increased ?',
          type: 'rating',
          question: 'Do you want, the services given in the ward should be increased ?',
          required: true,
        },
        {
          label: 'How would you rate the service?',
          name: 'Are you happy with the services / information provided at the reception ?',
          type: 'rating',
          question: 'Are you happy with the services / information provided at the reception ?',
          required: true,
        },
        {
          label: 'How would you rate the service?',
          name: 'Are you happy with the services of lab / X-Ray / Sonography / CT-Scan ?',
          type: 'rating',
          question: 'Are you happy with the services of lab / X-Ray / Sonography / CT-Scan ?',
          required: true,
        },
        {
          label: 'How would you rate the service?',
          name: 'Are you happy with the services and behavior of TPA / Bhamashah Team ?',
          type: 'rating',
          question: 'Are you happy with the services and behavior of TPA / Bhamashah Team ?',
          required: true,
        },
        {
          label: 'Select your preferences',
          name: 'preferences',
          type: 'checkbox',
          options: [
            {
              label: "Unhappy with nursing staff's behavior",
              value: "Unhappy with nursing staff's behavior",
            },
            {
              label: 'Unhappy with services and behavior at pharmacy',
              value: 'Unhappy with services and behavior at pharmacy',
            },
            {
              label: 'Not all the medicines were available at pharmacy',
              value: 'Not all the medicines were available at pharmacy',
            },
            {
              label: 'Nursing staff was rude and non cooperative',
              value: 'Nursing staff was rude and non cooperative',
            },
            {
              label: 'Doctor was in hurry',
              value: 'Doctor was in hurry',
            },
            {
              label: 'Reception was not responsive',
              value: 'Reception was not responsive',
            },
            {
              label: 'Nursing staff did not explain about the medicines given',
              value: 'Nursing staff did not explain about the medicines given',
            },
            {
              label: 'Doctor did not visited on the time',
              value: 'Doctor did not visited on the time',
            },
            {
              label: "Unhappy with Doctor's treatment",
              value: "Unhappy with Doctor's treatment",
            },
            {
              label: 'Unhappy with billing department',
              value: 'Unhappy with billing department',
            },
            {
              label: 'Unhappy with TPA',
              value: 'Unhappy with TPA',
            },
            {
              label: 'No proper care taken at Emergency',
              value: 'No proper care taken at Emergency',
            },
            {
              label: 'Others',
              value: 'Others',
            },
            {
              label: 'Fully satisfied',
              value: 'Fully satisfied',
            },
          ],
          required: false,
        },
        {
          label: 'Remarks',
          name: 'Remarks',
          type: 'text',
          required: false,
        },
      ],
    },
    {
      id: 5,
      nextSection: 13,
      title: 'Feedback-OPD',
      fields: [
        {
          question: 'Doctor Name',
          label: 'Doctor Name',
          name: 'Doctor Name',
          type: 'select',
          options: [
            {
              label: 'Dr. John Smith',
              value: 'Dr. John Smith',
            },
            {
              label: 'Dr. Jane Doe',
              value: 'Dr. Jane Doe',
            },
            {
              label: 'Dr. James Bond',
              value: 'Dr. James Bond',
            },
            {
              label: 'Dr. Emma Watson',
              value: 'Dr. Emma Watson',
            },
            {
              label: 'Dr. Chris Hemsworth',
              value: 'Dr. Chris Hemsworth',
            },
          ],
          required: true,
        },
        {
          label: 'How would you rate the service?',
          name: 'Are OPD timings convenient for you ?',
          type: 'rating',
          question: 'Are OPD timings convenient for you ?',
          required: true,
        },
        {
          label: 'How would you rate the service?',
          name: 'Did you find parking facility comfortably in the hospital?',
          type: 'rating',
          question: 'Did you find parking facility comfortably in the hospital?',
          required: true,
        },
        {
          label: 'How would you rate the service?',
          name: 'Have you faced problems in finding the concerned department?',
          type: 'rating',
          question: 'Have you faced problems in finding the concerned department?',
          required: true,
        },
        {
          label: 'How would you rate the service?',
          name: 'Did you find waiting area clean / sufficient ?',
          type: 'rating',
          question: 'Did you find waiting area clean / sufficient ?',
          required: true,
        },
        {
          label: 'How would you rate the service?',
          name: 'Did you wait for long before consultation?',
          type: 'rating',
          question: 'Did you wait for long before consultation?',
          required: true,
        },
        {
          label: 'How would you rate the service?',
          name: 'Did you wait for long before your tests?',
          type: 'rating',
          question: 'Did you wait for long before your tests?',
          required: true,
        },
        {
          label: 'How would you rate the service?',
          name: 'Was the Doctor focused about your treatment and your problem?',
          type: 'rating',
          question: 'Was the Doctor focused about your treatment and your problem?',
          required: true,
        },
        {
          label: 'How would you rate the service?',
          name: 'Did you receive reports on time?',
          type: 'rating',
          question: 'Did you receive reports on time?',
          required: true,
        },
        {
          label: 'How would you rate the service?',
          name: 'Doctor explained about your treatment and responded to all your questions?',
          type: 'rating',
          question: 'Doctor explained about your treatment and responded to all your questions?',
          required: true,
        },
        {
          label: 'How would you rate the service?',
          name: 'Are you happy with the treatment / services provided in the Hospital?',
          type: 'rating',
          question: 'Are you happy with the treatment / services provided in the Hospital?',
          required: true,
        },
        {
          label: 'Remarks',
          name: 'Remarks',
          type: 'text',
          required: false,
        },
      ],
    },
    {
      id: 6,
      nextSection: 'submit',
      title: 'Reschedule Appointment',
      fields: [
        {
          label: 'Reason for reschedule',
          name: 'Reason for reschedule',
          type: 'text',
          required: true,
        },
        {
          question: 'Doctor Name',
          label: 'Doctor Name',
          name: 'Doctor Name',
          type: 'select',
          options: [
            {
              label: 'Dr. John Smith',
              value: 'Dr. John Smith',
            },
            {
              label: 'Dr. Jane Doe',
              value: 'Dr. Jane Doe',
            },
            {
              label: 'Dr. James Bond',
              value: 'Dr. James Bond',
            },
            {
              label: 'Dr. Emma Watson',
              value: 'Dr. Emma Watson',
            },
            {
              label: 'Dr. Chris Hemsworth',
              value: 'Dr. Chris Hemsworth',
            },
          ],
          required: true,
        },
        {
          label: 'Reschedule Date',
          name: 'Reschedule Date',
          type: 'date',
          required: true,
        },
        {
          label: 'Reschedule Time',
          name: 'Reschedule Time',
          type: 'time',
          required: true,
        },
      ],
    },
    {
      id: 7,
      nextSection: 'submit',
      title: 'Follow up-Appointment',
      fields: [
        {
          label: 'Follow up-Appointment',
          name: 'Follow up-Appointment',
          type: 'text',
          required: true,
        },
        {
          question: 'Reason for not showing up for the appointment',
          label: 'Reason for not showing up for the appointment',
          name: 'Reason for not showing up for the appointment',
          type: 'select',
          options: [
            {
              label: 'Could not come during appointment time and wants rescheduling',
              value: 'Could not come during appointment time and wants rescheduling',
            },
            {
              label: 'Consulted somewhere else',
              value: 'Consulted somewhere else',
            },
            {
              label: 'Not needed anymore',
              value: 'Not needed anymore',
            },
            {
              label: 'Others',
              value: 'Others',
            },
            {
              label: 'Visited Hospital',
              value: 'Visited Hospital',
            },
          ],
          required: true,
        },
        {
          label: 'Action Taken',
          name: 'Action Taken',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      id: 8,
      nextSection: 'submit',
      title: 'Follow up-Surgery/Covid',
      isDynamicSection: true,
      fields: [
        {
          question: 'Purpose of enquiry',
          isDynamicOption: true,
          label: 'Enquery Purpose',
          name: 'Enquery Purpose',
          type: 'select',
          options: [
            {
              label: 'Family member',
              value: 'Family member',
              nextSection: 4,
            },
            {
              label: 'Self',
              value: 'Self',
            },
            {
              label: 'Others',
              value: 'Others',
            },
          ],
          required: true,
        },
        {
          label: 'Remarks',
          name: 'Remarks',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      id: 9,
      nextSection: 13,
      title: 'Follow up-OPD',
      fields: [
        {
          question: 'Purpose of OPD enquiry',
          label: 'OPD Enquiry Purpose',
          name: 'perposeOfOpdEnquery',
          type: 'select',
          options: [
            {
              label: 'Family member',
              value: 'Family member',
            },
            {
              label: 'Self',
              value: 'Self',
            },
            {
              label: 'Others',
              value: 'Others',
            },
          ],
          required: true,
        },
        {
          question: 'Call Status',

          name: 'callStatus',
          type: 'multiple-options',
          required: true,
          options: [
            {
              label: 'Visited',
              value: 'Visited',
            },
            {
              label: 'Non Visited',
              value: 'Non Visited',
            },
          ],
        },
        {
          question: 'Reason for not getting test done',
          label: 'Reason for not getting test done',
          name: 'Reason for not getting test done',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      id: 10,
      nextSection: 'submit',
      title: 'Follow up- Diagnose& Tests',
      fields: [
        {
          question: 'Did you get the test done?',
          label: 'Did you get the test done?',
          name: 'Did you get the test done?',
          type: 'select',
          options: [
            {
              label: 'Yes',
              value: 'Yes',
            },
            {
              label: 'No',
              value: 'No',
            },
          ],
          required: true,
        },
      ],
    },
    {
      id: 11,
      nextSection: 'submit',
      title: 'STS',
      fields: [
        {
          label: 'Concern',
          name: 'Concern',
          type: 'text',
          required: true,
        },
        {
          label: 'Action Taken',
          name: 'Action Taken',
          type: 'text',
          required: true,
        },
        {
          question: 'STS Created',
          label: 'STS Created',
          name: 'STS Created',
          type: 'select',
          options: [
            {
              label: 'Yes',
              value: 'Yes',
            },
            {
              label: 'No',
              value: 'No',
            },
          ],
          required: true,
        },
      ],
    },
    {
      id: 12,
      nextSection: 'submit',
      title: 'Call back',
      fields: [
        {
          question: 'Doctor Name',
          label: 'Doctor Name',
          name: 'Doctor Name',
          type: 'select',
          options: [
            {
              label: 'Dr. John Smith',
              value: 'Dr. John Smith',
            },
            {
              label: 'Dr. Jane Doe',
              value: 'Dr. Jane Doe',
            },
            {
              label: 'Dr. James Bond',
              value: 'Dr. James Bond',
            },
            {
              label: 'Dr. Emma Watson',
              value: 'Dr. Emma Watson',
            },
            {
              label: 'Dr. Chris Hemsworth',
              value: 'Dr. Chris Hemsworth',
            },
          ],
          required: true,
        },
        {
          label: 'Department Name',
          name: 'Department Name',
          type: 'text',
          required: true,
        },
        {
          label: 'Action Taken',
          name: 'Action Taken',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      id: 13,
      nextSection: 'submit',
      title: 'Reference',
      fields: [
        {
          question: 'Would you like to refer Chirayu Hospital to your friends and family?',
          name: 'Would you like to refer Chirayu Hospital to your friends and family?',
          type: 'multiple-options',
          required: true,
          options: [
            {
              label: 'Yes',
              value: 'Yes',
            },
            {
              label: 'No',
              value: 'No',
            },
            {
              label: 'May be',
              value: 'May be',
            },
            {
              label: 'NA',
              value: 'NA',
            },
          ],
        },
      ],
    },
    {
      id: 14,
      nextSection: 'next',
      title: 'Feedback-Complaints/Negative Feedback',
      fields: [
        {
          question: 'Closure Status',
          name: 'Closure Status',
          type: 'multiple-options',
          required: true,
          options: [
            {
              label: 'Yes',
              value: 'Yes',
            },
            {
              label: 'No',
              value: 'No',
            },
            {
              label: 'May be',
              value: 'May be',
            },
            {
              label: 'NA',
              value: 'NA',
            },
          ],
        },
        {
          question: 'Are you happy with the resolution provided?',
          name: 'Are you happy with the resolution provided?',
          type: 'multiple-options',
          required: true,
          options: [
            {
              label: 'Done',
              value: 'Done',
            },
            {
              label: 'Not Done',
              value: 'Not Done',
            },
          ],
        },
        {
          label: 'Remarks',
          name: 'Remarks',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      id: 15,
      nextSection: 'next',
      title: 'Follow up- Whats app Query',
      fields: [
        {
          question: 'Closer Status',
          name: 'Closer Status',
          type: 'multiple-options',
          required: true,
          options: [
            {
              label: 'Visited',
              value: 'Visited',
            },
            {
              label: 'Not Visited',
              value: 'Not Visited',
            },
          ],
        },
        {
          label: 'Remarks',
          name: 'Remarks',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      id: 16,
      nextSection: 'submit',
      title: 'Campaign Lead',
      fields: [
        {
          question: 'Interested',
          name: 'Interested',
          type: 'multiple-options',
          required: true,
          options: [
            {
              label: 'Yes',
              value: 'Yes',
            },
            {
              label: 'No',
              value: 'No',
            },
          ],
        },
        {
          label: 'Remark',
          name: 'Remark',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      id: 17,
      nextSection: 'submit',
      title: 'IPD Revisit Follow-up',
      fields: [
        {
          question: 'Doctor Name',
          label: 'Doctor Name',
          name: 'Doctor Name',
          type: 'select',
          options: [
            {
              label: 'Dr. John Smith',
              value: 'Dr. John Smith',
            },
            {
              label: 'Dr. Jane Doe',
              value: 'Dr. Jane Doe',
            },
            {
              label: 'Dr. James Bond',
              value: 'Dr. James Bond',
            },
            {
              label: 'Dr. Emma Watson',
              value: 'Dr. Emma Watson',
            },
            {
              label: 'Dr. Chris Hemsworth',
              value: 'Dr. Chris Hemsworth',
            },
          ],
          required: true,
        },
        {
          question: 'Discharge Date',
          label: 'Discharge Date',
          name: 'Discharge Date',
          type: 'date',
          required: true,
        },
        {
          question: 'Discharge Time',
          label: 'Discharge Time',
          name: 'Discharge Time',
          type: 'time',
          required: true,
        },
        {
          label: 'Remarks',
          name: 'Remarks',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      id: 18,
      nextSection: 'submit',
      title: 'Whats App Query',
      fields: [
        {
          question: 'Doctor Name',
          label: 'Doctor Name',
          name: 'Doctor Name',
          type: 'select',
          options: [
            {
              label: 'Dr. John Smith',
              value: 'Dr. John Smith',
            },
            {
              label: 'Dr. Jane Doe',
              value: 'Dr. Jane Doe',
            },
            {
              label: 'Dr. James Bond',
              value: 'Dr. James Bond',
            },
            {
              label: 'Dr. Emma Watson',
              value: 'Dr. Emma Watson',
            },
            {
              label: 'Dr. Chris Hemsworth',
              value: 'Dr. Chris Hemsworth',
            },
          ],
          required: true,
        },
        {
          label: 'Action Taken',
          name: 'Action Taken',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      id: 19,
      nextSection: 'submit',
      title: 'Remarks For Not Connected Call',
      fields: [
        {
          label: 'Remarks',
          name: 'Remarks',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      id: 20,
      nextSection: 'submit',
      title: 'Remarks For Mobile Number Not Mentioned',
      fields: [
        {
          label: 'Remarks',
          name: 'Remarks',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      id: 21,
      nextSection: 'submit',
      title: 'Informative Calls',
      fields: [
        {
          question: 'Interested',
          name: 'Interested',
          type: 'multiple-options',
          required: true,
          options: [
            {
              label: 'Connected',
              value: 'Connected',
            },
            {
              label: 'Not- Connected',
              value: 'Not- Connected',
            },
          ],
        },
        {
          label: 'Remarks',
          name: 'Remarks',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      id: 22,
      nextSection: 'submit',
      title: 'Facebook Calls',
      fields: [
        {
          question: 'Call Status',
          name: 'Call Status',
          type: 'multiple-options',
          required: true,
          options: [
            {
              label: 'Connected',
              value: 'Connected',
            },
            {
              label: 'Not- Connected',
              value: 'Not- Connected',
            },
          ],
        },
        {
          label: 'Remarks',
          name: 'Remarks',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
};
