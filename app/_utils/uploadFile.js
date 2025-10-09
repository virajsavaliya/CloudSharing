import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { app } from "../../firebaseConfig";

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

export async function uploadFile(file, onProgress, retryCount = 0) {
  try {
    const storage = getStorage(app);
    const storageRef = ref(storage, `file-upload/${file.name}`);
    
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        uploadedAt: new Date().toISOString()
      }
    });

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(progress);
        },
        async (error) => {
          console.error('Upload error:', error);
          
          // Retry logic for network errors
          if (retryCount < MAX_RETRIES && 
              (error.code === 'storage/retry-limit-exceeded' || 
               error.code === 'storage/unknown')) {
            console.log(`Retrying upload... Attempt ${retryCount + 1}`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            try {
              const result = await uploadFile(file, onProgress, retryCount + 1);
              resolve(result);
            } catch (retryError) {
              reject(retryError);
            }
          } else {
            reject(error);
          }
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({
              url: downloadURL,
              name: file.name,
              size: file.size,
              type: file.type
            });
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    console.error('Upload initialization error:', error);
    throw error;
  }
}
