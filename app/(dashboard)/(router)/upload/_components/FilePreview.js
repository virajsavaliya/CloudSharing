import { X, CheckCircle } from "lucide-react";
import React from "react";
import { getFileIcon } from "../../../../_utils/fileIcons";

function FilePreview({ file, removeFile, uploaded }) {
  // Get icon based on file extension/type
  const iconSrc = getFileIcon(file.name || file.type);

  return (
    <div className="flex items-center gap-2 justify-between mt-5 w-full border rounded-md p-2 border-blue-200">
      <div className="flex items-center p-2 gap-2">
        <img
          src={getFileIcon(file.name || file.type)}
          alt="file icon"
          width={40}
          height={40}
          className="object-contain"
        />
        <div className="text-left overflow-hidden">
          <h2 className="overflow-hidden text-ellipsis whitespace-nowrap w-32 md:w-48">
            {file.name}
          </h2>
          <h2 className="text-[12px] text-gray-400">
            {file?.type} / {(file.size / 1024 / 1024).toFixed(2)}MB
          </h2>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {/* Green Tick for uploaded files */}
        {uploaded && <CheckCircle className="text-green-500" size={22} />}
        <X
          className="text-red-500 cursor-pointer"
          onClick={() => {
            removeFile(file);
          }}
        />
      </div>
    </div>
  );
}

export default FilePreview;
