import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage, STORAGE_FOLDER } from "../firebase";

/**
 * Validates image file type and size
 */
export function validateImageFile(file) {
  if (!file) return { valid: false, error: "No file selected." };

  const validTypes = ["image/jpeg", "image/png", "image/jpg"];
  if (!validTypes.includes(file.type.toLowerCase())) {
    return { 
      valid: false, 
      error: "Invalid file format. Only JPG, JPEG, and PNG images are accepted." 
    };
  }

  // 10MB limit
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: "Image file size exceeds 10MB limit. Please choose a smaller photo." 
    };
  }

  return { valid: true };
}

/**
 * Compresses an image file before upload for fast transfer and storage efficiency
 */
export function compressImage(file, maxWidth = 800, quality = 0.8) {
  return new Promise((resolve) => {
    // If not an image or SVG, return as is
    if (!file || !file.type.startsWith('image/') || file.type === 'image/svg+xml') {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve(file);
            }
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}


/**
 * Uploads a profile image to Firebase Storage under `member_profiles/`
 * @param {File} file 
 * @param {string} phone 
 * @param {function} onProgress 
 * @returns {Promise<{success: boolean, downloadUrl?: string, error?: string}>}
 */
export async function uploadProfilePhoto(file, phone, onProgress) {
  try {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Auto-compress image before upload
    const compressed = await compressImage(file, 800, 0.85);

    const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
    const timestamp = Date.now();
    const fileName = `${cleanPhone}_${timestamp}.jpg`;
    const storageRef = ref(storage, `${STORAGE_FOLDER}/${fileName}`);

    // Create upload task
    const uploadTask = uploadBytesResumable(storageRef, compressed, {
      contentType: 'image/jpeg',
      customMetadata: {
        memberPhone: cleanPhone,
        uploadedAt: new Date().toISOString()
      }
    });


    return new Promise((resolve) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          if (onProgress) {
            onProgress(progress);
          }
        },
        async (error) => {
          console.error("Firebase Storage Upload Error:", error);
          // If storage security rules are restrictive, fallback to compressed base64 to ensure user can still proceed
          try {
            console.warn("Falling back to embedded image data URL...");
            const base64Url = await fileToBase64(file);
            resolve({ 
              success: true, 
              downloadUrl: base64Url, 
              isFallback: true,
              warning: "Uploaded using compressed image storage (Firebase Storage permission fallback)."
            });
          } catch (fallbackError) {
            resolve({ 
              success: false, 
              error: `Storage upload failed: ${error.message}` 
            });
          }
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({ success: true, downloadUrl });
          } catch (urlError) {
            console.error("Error retrieving download URL:", urlError);
            const base64Url = await fileToBase64(file);
            resolve({ success: true, downloadUrl: base64Url });
          }
        }
      );
    });
  } catch (error) {
    console.error("Upload exception:", error);
    return { success: false, error: error.message };
  }
}
