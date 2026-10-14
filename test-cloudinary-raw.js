// test-cloudinary-raw.js — arquivo TEMPORÁRIO de diagnóstico. Apague depois de usar.
require('dotenv/config');
const { v2: cloudinary } = require('cloudinary');

const cloud = process.env.CLOUDINARY_CLOUD_NAME;
const key = process.env.CLOUDINARY_API_KEY;
const secret = process.env.CLOUDINARY_API_SECRET;

const png =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

(async () => {
  const timestamp = Math.floor(Date.now() / 1000);
  const public_id = 'teste-isolamento/raw';
  const signature = cloudinary.utils.api_sign_request({ timestamp, public_id }, secret);

  const form = new FormData();
  form.append('file', png);
  form.append('api_key', key);
  form.append('timestamp', String(timestamp));
  form.append('public_id', public_id);
  form.append('signature', signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
    method: 'POST',
    body: form,
  });

  console.log('status        :', res.status);
  console.log('x-cld-error   :', res.headers.get('x-cld-error'));
  console.log('body          :', (await res.text()).slice(0, 400));
})();