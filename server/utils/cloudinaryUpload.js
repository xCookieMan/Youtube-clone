import cloudinary from "../config/cloudinary.js";

/**
 * Uploads a video and an optional thumbnail to Cloudinary in parallel.
 *
 * @param {Buffer} videoBuffer - The video file buffer (required)
 * @param {Buffer|null} [thumbnailBuffer=null] - Optional thumbnail buffer
 * @returns {Promise<{video: {url: string, publicId: string}, thumbnail: {url: string, publicId: string} | null}>}
 */
export const uploadVideoWithThumbnail = async (
  videoBuffer,
  thumbnailBuffer = null
) => {
  if (!videoBuffer || !Buffer.isBuffer(videoBuffer)) {
    throw new Error("Valid video buffer is required");
  }

  let uploadedVideo = null;
  let uploadedThumbnail = null;

  try {
    /* ================= VIDEO UPLOAD ================= */
    const uploadVideo = () =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: "video",
            folder: "youtube/videos",
            chunk_size: 6_000_000,
            timeout: 120_000,
          },
          (err, result) => {
            if (err) return reject(err);
            resolve({ url: result.secure_url, publicId: result.public_id });
          }
        );
        stream.end(videoBuffer);
      });

    /* ================= THUMBNAIL UPLOAD ================= */
    const uploadThumbnail = () => {
      if (!thumbnailBuffer) return Promise.resolve(null);

      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: "image",
            folder: "youtube/thumbnails",
            timeout: 30_000,
          },
          (err, result) => {
            if (err) return reject(err);
            resolve({ url: result.secure_url, publicId: result.public_id });
          }
        );
        stream.end(thumbnailBuffer);
      });
    };

    /* ================= PARALLEL UPLOAD ================= */
    [uploadedVideo, uploadedThumbnail] = await Promise.all([
      uploadVideo(),
      uploadThumbnail(),
    ]);

    return { video: uploadedVideo, thumbnail: uploadedThumbnail };
  } catch (err) {
    console.error("❌ Upload failed. Cleaning Cloudinary assets...");

    if (uploadedVideo?.publicId) {
      await cloudinary.uploader.destroy(uploadedVideo.publicId, {
        resource_type: "video",
      });
    }

    if (uploadedThumbnail?.publicId) {
      await cloudinary.uploader.destroy(uploadedThumbnail.publicId);
    }

    throw err;
  }
};

/**
 * Upload video only (no thumbnail)
 * @param {Buffer} videoBuffer
 * @returns {Promise<{url: string, publicId: string}>}
 */
export const uploadVideoOnly = async (videoBuffer) => {
  const { video } = await uploadVideoWithThumbnail(videoBuffer, null);
  return video;
};

/**
 * Upload image only
 * @param {Buffer} imageBuffer
 * @param {string} folder
 * @returns {Promise<{url: string, publicId: string}>}
 */
export const uploadImage = async (imageBuffer, folder = "youtube/images") => {
  if (!imageBuffer || !Buffer.isBuffer(imageBuffer)) {
    throw new Error("Valid image buffer is required");
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "image", folder, timeout: 30_000 },
      (err, result) => {
        if (err) return reject(err);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(imageBuffer);
  });
};
