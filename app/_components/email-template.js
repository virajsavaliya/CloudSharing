export function EmailTemplate({ response }) {
  const truncateFileName = (name, maxLength = 25) => {
    if (!name) return "Unknown";
    if (name.length > maxLength) {
      const extensionIndex = name.lastIndexOf(".");
      const extension = extensionIndex !== -1 ? name.slice(extensionIndex) : "";
      return name.slice(0, maxLength) + "..." + extension;
    }
    return name;
  };

  const getFileDetails = () => {
    // Handle folder case
    if (response.type === "folder") {
      return {
        fileName: response.fileName || `Folder ${response.id}`,
        fileSize: `${response.files?.length || 0} files`,
        fileType: "Folder"
      };
    }

    // Handle multiple files case
    if (response.files && Array.isArray(response.files) && response.files.length > 0) {
      const totalSize = response.files.reduce((total, file) => total + (file.size || 0), 0);
      return {
        fileName: `${response.files.length} files.zip`,
        fileSize: totalSize > 0 ? `${(totalSize / (1024 * 1024)).toFixed(2)} MB` : '0 MB',
        fileType: "ZIP"
      };
    }

    // Handle single file case with better fallbacks
    const fileSize = response.fileSize ? (response.fileSize / (1024 * 1024)).toFixed(2) : 0;
    return {
      fileName: response.fileName || 'File',
      fileSize: `${fileSize} MB`,
      fileType: response.fileType ? shortenFileType(response.fileType) : 'File'
    };
  };

  const shortenFileType = (fileType) => {
    const fileTypeMap = {
      "image/jpeg": ".jpeg",
        "image/png": ".png",
        "image/svg+xml": ".svg",
        "image/gif": ".gif",
        "image/heic": ".heic",
        "image/heif": ".heif",
        "image/dng": ".dng",
        "application/pdf": ".pdf",
        "application/zip": ".zip",
        "application/x-rar-compressed": ".rar",
        "application/x-7z-compressed": ".7z",
        "application/x-tar": ".tar",
        "application/x-gzip": ".gz",
        "application/x-zip-compressed": ".zip",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
          ".docx",
        "application/msword": ".doc",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
          ".xlsx",
        "application/vnd.ms-excel": ".xls",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation":
          ".pptx",
        "application/vnd.ms-powerpoint": ".ppt",
        "application/msaccess": ".accdb",
        "application/vnd.ms-project": ".mpp",
        "application/vnd.visio": ".vsdx",
        "video/mp4": ".mp4",
        "video/x-msvideo": ".avi",
        "video/x-ms-wmv": ".wmv",
        "video/x-matroska": ".mkv",
        "video/webm": ".webm",
        "video/quicktime": ".mov",
        "video/mpeg": ".mpeg",
        "video/ogg": ".ogv",
        "video/3gpp": ".3gp",
        "video/3gpp2": ".3g2",
        "video/x-flv": ".flv",
        "video/x-m4v": ".m4v",
        "audio/mpeg": ".mp3",
        "audio/wav": ".wav",
        "audio/ogg": ".ogg",
        "audio/flac": ".flac",
        "audio/aac": ".aac",
        "audio/mp4": ".m4a",
        "audio/amr": ".amr",
        "audio/x-ms-wma": ".wma",
    };
    return fileTypeMap[fileType] || fileType || 'File';
  };

  const fileDetails = getFileDetails();

  return `
    <html>
      <head>
        <style>
          body {
            margin: 0;
            padding: 0;
            background-color: #f4f6f8;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #333;
          }

          .email-wrapper {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          }

          .email-header {
            background-color: #1a73e8;
            padding: 30px;
            text-align: center;
            color: #ffffff;
          }

          .email-header h1 {
            margin: 0;
            font-size: 24px;
          }

          .email-body {
            padding: 30px;
          }

          .greeting {
            font-size: 16px;
            margin-bottom: 10px;
          }

          .info-text {
            margin: 15px 0;
            font-size: 15px;
            color: #444;
          }

          .file-box {
            background-color: #f1f3f5;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
          }

          .file-box div {
            margin-bottom: 8px;
          }

          .file-box .label {
            font-weight: 600;
          }

          .download-button {
            display: inline-block;
            padding: 12px 20px;
            background-color: #1a73e8;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 4px;
            font-weight: 600;
            margin-top: 10px;
            transition: background-color 0.3s ease;
          }

          .download-button:hover {
            background-color: #155ab6;
          }

          .footer {
            font-size: 12px;
            color: #999999;
            text-align: center;
            padding: 20px;
            background-color: #f8f9fa;
            border-top: 1px solid #e0e0e0;
          }

          .footer a {
            color: #1a73e8;
            text-decoration: none;
          }

          @media only screen and (max-width: 600px) {
            .email-body, .email-header {
              padding: 20px;
            }

            .email-header h1 {
              font-size: 20px;
            }

            .download-button {
              width: 100%;
              text-align: center;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-header">
            <h1>${response.userName} shared a file with you</h1>
          </div>
          <div class="email-body">
            <p class="greeting">Hello ${response.emailToSend.split("@")[0]},</p>
            <p class="info-text">You've received a new file via CloudShare with the details below:</p>

            <div class="file-box">
              <div><span class="label">File Name:</span> ${fileDetails.fileName}</div>
              <div><span class="label">File Size:</span> ${fileDetails.fileSize}</div>
              <div><span class="label">File Type:</span> ${fileDetails.fileType}</div>
              ${response.type === "folder" && response.files ? `
              <div class="contained-files">
                <span class="label">Contains:</span>
                <ul style="margin-top: 5px; margin-bottom: 0;">
                  ${response.files.map(file => `
                    <li>${truncateFileName(file.name)} (${(file.size / (1024 * 1024)).toFixed(2)} MB)</li>
                  `).join('')}
                </ul>
              </div>` : ''}
            </div>

            <a href="${response.shortUrl}" class="download-button">Download File</a>

            <p class="info-text">Note: Please download and use the file at your own discretion.</p>
            <p class="info-text">Share files easily at <a href="https://cloudsharing.vercel.app/">cloudsharing</a>.</p>
            <p class="info-text">By accessing the file, you agree to our <a href="https://cloudsharing.vercel.app/terms" style="color: #1a73e8; text-decoration: none;">Terms & Conditions</a>.</p>

            <p class="info-text">Best regards,<br>The CloudShare Team</p>
          </div>

          <div class="footer">
            &copy; 2025 CloudShare. All rights reserved.<br>
            Visit: <a href="https://virajsavaliya.in">virajsavaliya</a><br>
            <em>*Please do not reply. This is an automated email.</em>
          </div>
        </div>
      </body>
    </html>
  `;
}
