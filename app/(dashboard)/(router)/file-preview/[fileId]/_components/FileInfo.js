import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

function FileInfo({ file }) {
  const [fileType, setFileType] = useState("Unknown");

  useEffect(() => {
    if (file?.fileType) {
      setFileType(file.fileType.split('/')[0]);
    }
  }, [file]);

  return file && (
    <div className='text-center border flex justify-center m-5 flex-col items-center p-4 rounded-md border-gray-300'>

      {/* ✅ QR Code for file/folder short URL */}
      {file.shortUrl && (
        <div className='bg-white p-3 rounded-lg shadow-md mb-4'>
          <QRCodeSVG
            value={file.shortUrl}
            size={150}
            level={'H'}
            includeMargin={true}
            imageSettings={{
              src: '/logo_icon.svg',
              x: undefined,
              y: undefined,
              height: 34,
              width: 34,
              excavate: true,
            }}
          />
        </div>
      )}

      {/* ✅ File/Folder Info */}
      <div className='flex flex-col items-center gap-2 w-full max-w-sm'>
        <h2 className='overflow-hidden text-ellipsis whitespace-nowrap font-medium w-full text-center'>
          {file.fileName || file.name || file.folderName || "Untitled"}
        </h2>
        <div className='text-gray-400 text-[13px] space-y-1'>
          <h2>{fileType}</h2>
          {file.fileSize !== undefined ? (
            <h2>{(file.fileSize / (1024 * 1024)).toFixed(2)} MB</h2>
          ) : (
            <h2>{file.files ? `${file.files.length} files` : "No Size Available"}</h2>
          )}
        </div>
      </div>
    </div>
  );
}

export default FileInfo;
