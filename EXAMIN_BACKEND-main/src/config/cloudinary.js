import { v2 as cloudinary } from 'cloudinary';
import { required, env } from './env.js';

cloudinary.config({
  cloud_name: required('CLOUDINARY_CLOUD_NAME', process.env.CLOUDINARY_CLOUD_NAME),
  api_key: required('CLOUDINARY_API_KEY', process.env.CLOUDINARY_API_KEY),
  api_secret: required('CLOUDINARY_API_SECRET', process.env.CLOUDINARY_API_SECRET),
  secure: true,
});

export default cloudinary;
