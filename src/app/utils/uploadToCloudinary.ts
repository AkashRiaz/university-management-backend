import { cloudinary } from "../lib/cloudinary";

export const uploadToCloudinary = (file: Express.Multer.File) => {
  return new Promise<{
    secure_url: string;
    public_id: string;
  }>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
      },

      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result) {
          reject(new Error("Cloudinary upload failed"));

          return;
        }

        resolve({
          secure_url: result.secure_url,

          public_id: result.public_id,
        });
      },
    );

    uploadStream.end(file.buffer);
  });
};
