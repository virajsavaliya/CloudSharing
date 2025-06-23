"use client";
import React, { useState, useEffect } from "react";
import { db } from "../../../../../firebaseConfig";
import { doc, deleteDoc } from "firebase/firestore";

function FilesTable({ files: propFiles, searchFile, setSearchFile, onDeleteFile }) {
  const [files, setFiles] = useState(propFiles || []);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);

  // Keep local files in sync with propFiles
  useEffect(() => {
    setFiles(propFiles || []);
  }, [propFiles]);

  const filteredFiles = files.filter(f =>
    (f.fileName || f.folderId || "").toLowerCase().includes(searchFile.toLowerCase())
  );

  const handleDelete = (file) => {
    setFileToDelete(file);
    setConfirmDelete(true);
  };

  const confirmDeleteFile = async () => {
    if (!fileToDelete) return;
    setDeletingId(fileToDelete.id);
    setConfirmDelete(false);
    if (onDeleteFile) {
      await onDeleteFile(fileToDelete.id);
    } else {
      // Delete from correct Firestore collection
      try {
        const collectionName = fileToDelete.type === "folder" ? "uploadedFolders" : "uploadedFile";
        await deleteDoc(doc(db, collectionName, fileToDelete.id));
        setFiles(prev => prev.filter(f => f.id !== fileToDelete.id));
      } catch (e) {
        alert("Failed to delete file from database.");
      }
    }
    setDeletingId(null);
    setFileToDelete(null);
  };

  const handleMoreInfo = (file) => {
    setSelectedFile(file);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedFile(null);
  };

  const closeConfirm = () => {
    setConfirmDelete(false);
    setFileToDelete(null);
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
        <h2 className="text-2xl font-bold">Files & Folders</h2>
        <input
          type="text"
          placeholder="Search files..."
          className="border rounded px-3 py-2 w-full md:w-64"
          value={searchFile}
          onChange={e => setSearchFile(e.target.value)}
        />
      </div>
      <div className="overflow-x-auto bg-white rounded-xl shadow-md p-4">
        <table className="min-w-full table-auto border-separate border-spacing-y-2">
          <thead className="hidden md:table-header-group">
            <tr className="text-left text-gray-600 text-sm uppercase">
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Size</th>
              <th className="px-4 py-2">User</th>
              <th className="px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredFiles.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-gray-400 py-6">
                  No files found
                </td>
              </tr>
            ) : (
              filteredFiles.map((f, idx) => (
                <tr
                  key={f.id || idx}
                  className="bg-gray-50 rounded-lg md:table-row flex flex-col md:flex-row mb-3 shadow-sm"
                >
                  <td className="px-4 py-2 font-medium text-sm text-gray-800 w-full md:w-auto">
                    <div className="md:hidden font-semibold">Type:</div>
                    {f.type === "folder" ? "Folder" : "File"}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700 w-full md:w-auto">
                    <div className="md:hidden font-semibold">Name:</div>
                    {f.fileName || f.folderId || f.id}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700 w-full md:w-auto">
                    <div className="md:hidden font-semibold">Size:</div>
                    {f.type === "folder"
                      ? `${f.files?.length || 0} files`
                      : f.fileSize
                      ? `${(f.fileSize / 1024 / 1024).toFixed(2)} MB`
                      : ""}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700 w-full md:w-auto">
                    <div className="md:hidden font-semibold">User:</div>
                    {f.userEmail}
                  </td>
                  <td className="px-4 py-2 text-center w-full md:w-auto flex gap-2 md:justify-center">
                    <button
                      className="text-blue-600 hover:text-blue-800 px-2 py-1 rounded-md hover:bg-blue-100 text-sm"
                      onClick={() => handleMoreInfo(f)}
                    >
                      More Info
                    </button>
                    <button
                      className="text-red-500 hover:text-red-700 px-2 py-1 rounded-md hover:bg-red-100 text-sm"
                      onClick={() => handleDelete(f)}
                      disabled={deletingId === f.id}
                    >
                      {deletingId === f.id ? "Deleting..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Modal for More Info */}
      {showModal && selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
              onClick={closeModal}
              aria-label="Close"
            >
              &times;
            </button>
            <h3 className="text-xl font-bold mb-4">File/Folder Details</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-semibold">Type:</span> {selectedFile.type === "folder" ? "Folder" : "File"}
              </div>
              <div>
                <span className="font-semibold">Name:</span> {selectedFile.fileName || selectedFile.folderId || selectedFile.id}
              </div>
              {selectedFile.type !== "folder" && (
                <div>
                  <span className="font-semibold">Size:</span>{" "}
                  {selectedFile.fileSize
                    ? `${(selectedFile.fileSize / 1024 / 1024).toFixed(2)} MB`
                    : ""}
                </div>
              )}
              {selectedFile.type === "folder" && (
                <div>
                  <span className="font-semibold">Files in Folder:</span> {selectedFile.files?.length || 0}
                </div>
              )}
              <div>
                <span className="font-semibold">User (Sender):</span> {selectedFile.userEmail}
              </div>
              {selectedFile.receivers && selectedFile.receivers.length > 0 && (
                <div>
                  <span className="font-semibold">Receivers:</span>{" "}
                  {selectedFile.receivers.join(", ")}
                </div>
              )}
              <div>
                <span className="font-semibold">Created At:</span>{" "}
                {selectedFile.createdAt?.toDate
                  ? selectedFile.createdAt.toDate().toLocaleString()
                  : selectedFile.createdAt?.toLocaleString?.() ||
                    (selectedFile.createdAt
                      ? new Date(selectedFile.createdAt).toLocaleString()
                      : "Unknown")}
              </div>
              {selectedFile.updatedAt && (
                <div>
                  <span className="font-semibold">Last Updated:</span>{" "}
                  {selectedFile.updatedAt?.toDate
                    ? selectedFile.updatedAt.toDate().toLocaleString()
                    : selectedFile.updatedAt?.toLocaleString?.() ||
                      (selectedFile.updatedAt
                        ? new Date(selectedFile.updatedAt).toLocaleString()
                        : "")}
                </div>
              )}
              <div>
                <span className="font-semibold">ID:</span> {selectedFile.id}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Custom Delete Confirmation Popup */}
      {confirmDelete && fileToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
              onClick={closeConfirm}
              aria-label="Close"
            >
              &times;
            </button>
            <h3 className="text-lg font-bold mb-3 text-red-600">Confirm Delete</h3>
            <p className="mb-4 text-gray-700">
              Are you sure you want to delete{" "}
              <span className="font-semibold">{fileToDelete.fileName || fileToDelete.folderId || fileToDelete.id}</span>?
              <br />
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                onClick={closeConfirm}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                onClick={confirmDeleteFile}
                disabled={deletingId === fileToDelete.id}
              >
                {deletingId === fileToDelete.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FilesTable;
