// scripts/check-destroy.ts (temporário, pode apagar depois)
import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const url = process.argv[2];
const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/);
const publicId = match?.[1];
console.log('public_id extraído:', publicId);

cloudinary.uploader.destroy(publicId!).then((r) => console.log('resultado:', r));