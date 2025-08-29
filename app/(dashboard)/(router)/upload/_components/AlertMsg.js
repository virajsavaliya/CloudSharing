import { AlertCircle } from 'lucide-react';
import React from 'react';

function AlertMsg({ msg }) {
  return (
    <div className="flex items-center gap-3 rounded-lg p-3 bg-red-100 border border-red-200 text-red-600">
      <AlertCircle />
      <span className="text-sm">{msg}</span>
    </div>
  );
}

export default AlertMsg;