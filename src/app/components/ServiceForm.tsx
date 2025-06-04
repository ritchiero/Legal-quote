import React from 'react';

interface ServiceFormProps {
  onSubmit: (data: any) => void;
}

export const ServiceForm: React.FC<ServiceFormProps> = ({ onSubmit }) => {
  return (
    <div className="w-full">
      <textarea
        className="w-full p-4 border rounded-lg text-gray-900 bg-white"
        placeholder="Describe el servicio legal que deseas crear..."
      />
    </div>
  );
};

export default ServiceForm; 