import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage, STORAGE_FOLDER } from "../firebase";

/**
 * Validates image file type and size
 */
export function validateImageFile(file) {
  if (!file) return { valid: false, error: "No file selected." };

  const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  if (!validTypes.includes(file.type.toLowerCase())) {
    return { 
      valid: false, 
      error: "Invalid file format. Only JPG, JPEG, PNG, and WebP images are accepted." 
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
 * Converts a File or Blob into a compressed Base64 Data URL (e.g. for avatars / instant saving)
 * Resizes down to maxWidth (default 400px) and quality 0.8 to keep size ultra-small (~20-35 KB)
 * Takes ~10-30ms.
 */
export function fileToBase64(file, maxWidth = 400, quality = 0.8) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve('');

    // If already a Data URL string
    if (typeof file === 'string' && file.startsWith('data:image/')) {
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

        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => {
        resolve(event.target.result);
      };
    };
    reader.onerror = (err) => reject(err);
  });
}

/**
 * Fast profile photo upload handler:
 * 1. Instantly prepares an ultra-lightweight compressed photo (~20-30KB).
 * 2. Attempts Firebase Storage upload with a short 2-second timeout.
 * 3. If Firebase Storage succeeds fast, returns the Storage URL.
 * 4. If Firebase Storage is slow, has CORS errors, or is blocked, instantly returns the compressed photo Data URL.
 * Total time: Under 1 second!
 */
export async function uploadProfilePhoto(file, phone, onProgress) {
  try {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Generate lightweight compressed data URL immediately (< 50ms)
    const compressedDataUrl = await fileToBase64(file, 400, 0.8);
    if (onProgress) onProgress(40);

    const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
    const timestamp = Date.now();
    const fileName = `${cleanPhone}_${timestamp}.jpg`;
    const storageRef = ref(storage, `${STORAGE_FOLDER}/${fileName}`);

    // Try Firebase Storage with a strict 2000ms race timeout
    const storagePromise = new Promise((resolve, reject) => {
      // Convert DataURL to blob for storage upload
      fetch(compressedDataUrl)
        .then(res => res.blob())
        .then(blob => {
          const uploadTask = uploadBytesResumable(storageRef, blob, {
            contentType: 'image/jpeg',
            customMetadata: { memberPhone: cleanPhone, uploadedAt: new Date().toISOString() }
          });

          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
              if (onProgress && !isNaN(progress)) {
                onProgress(Math.max(40, progress));
              }
            },
            (error) => {
              reject(error);
            },
            async () => {
              try {
                const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(downloadUrl);
              } catch (e) {
                reject(e);
              }
            }
          );
        })
        .catch(reject);
    });

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Storage timeout")), 2000)
    );

    try {
      const downloadUrl = await Promise.race([storagePromise, timeoutPromise]);
      if (onProgress) onProgress(100);
      return { success: true, downloadUrl };
    } catch (raceErr) {
      // If storage times out (due to CORS retry loops) or rejects, use the compressed data URL instantly!
      console.warn("Storage upload bypassed/timed out, saving compressed photo to Firestore directly:", raceErr.message);
      if (onProgress) onProgress(100);
      return { 
        success: true, 
        downloadUrl: compressedDataUrl, 
        isFallback: true 
      };
    }
  } catch (error) {
    console.error("Upload handler error:", error);
    try {
      const fallbackUrl = await fileToBase64(file, 400, 0.8);
      return { success: true, downloadUrl: fallbackUrl, isFallback: true };
    } catch (e) {
      return { success: false, error: error.message };
    }
  }
}


