import React from 'react';

const QRDisplay = ({ qrCode, orderId }) => {
  if (!qrCode) return null;

  return (
    <div className="flex flex-col items-center gap-4 bg-white p-6 rounded-xl shadow-sm border">
      <h3 className="font-bold text-gray-700">Scan at Counter</h3>
      <div className="p-2 border-2 border-dashed border-gray-300 rounded-lg">
        <img src={`data:image/png;base64,${qrCode}`} alt="Order QR Code" className="w-48 h-48" />
      </div>
      <div className="bg-gray-100 px-4 py-2 rounded-full font-mono font-bold text-gray-800">
        #{orderId}
      </div>
    </div>
  );
};

export default QRDisplay;
