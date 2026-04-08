/**
 * Image processing utilities for base64 conversion and compression
 */

/**
 * Compress and convert image file to base64
 * @param {File} file - Image file to process
 * @param {number} maxDimension - Maximum width/height (default: 800)
 * @param {number} quality - JPEG quality 0-1 (default: 0.85)
 * @returns {Promise<string>} Base64 data URL
 */
export const compressImageToBase64 = (file, maxDimension = 800, quality = 0.85) => {
  return new Promise((resolve, reject) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      reject(new Error('Only JPEG, PNG, GIF, and WebP images are allowed'));
      return;
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      reject(new Error('Image size must be less than 5MB'));
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      try {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxDimension) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
        }
        
        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to base64 with compression
        const adjustedQuality = file.size > 1024 * 1024 ? Math.min(quality, 0.7) : quality;
        const base64 = canvas.toDataURL('image/jpeg', adjustedQuality);
        
        resolve(base64);
      } catch (error) {
        reject(new Error(`Failed to process image: ${error.message}`));
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    
    // Create object URL for the image
    const objectURL = URL.createObjectURL(file);
    img.src = objectURL;
    
    // Clean up object URL after image loads
    img.onload = (originalOnload => {
      return function(...args) {
        URL.revokeObjectURL(objectURL);
        return originalOnload.apply(this, args);
      };
    })(img.onload);
  });
};

/**
 * Generate unique image ID
 * @param {string} userId - User ID
 * @returns {string} Unique image identifier
 */
export const generateImageId = (userId = 'anonymous') => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  return `${userId}_${timestamp}_${randomString}`;
};

/**
 * Validate image file
 * @param {File} file - File to validate
 * @returns {Object} Validation result
 */
export const validateImageFile = (file) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG, GIF, and WebP images are allowed' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'Image size must be less than 5MB' };
  }
  
  return { valid: true };
};

/**
 * Get estimated base64 size (approximate)
 * @param {string} base64String - Base64 data URL
 * @returns {number} Estimated size in bytes
 */
export const getBase64Size = (base64String) => {
  // Remove data URL prefix to get pure base64
  const base64Data = base64String.split(',')[1] || base64String;
  
  // Calculate size: base64 is ~4/3 times larger than original
  const padding = base64Data.endsWith('==') ? 2 : base64Data.endsWith('=') ? 1 : 0;
  return (base64Data.length * 3 / 4) - padding;
};

/**
 * Create image preview from base64 or file
 * @param {string|File} source - Base64 string or File object
 * @returns {Promise<string>} Preview URL
 */
export const createImagePreview = async (source) => {
  if (typeof source === 'string') {
    // Already a base64 data URL
    return source;
  }
  
  if (source instanceof File) {
    // Convert file to base64
    return compressImageToBase64(source);
  }
  
  throw new Error('Invalid source type for image preview');
}; 