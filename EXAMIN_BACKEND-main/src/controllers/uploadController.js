import cloudinary from '../config/cloudinary.js';

export async function uploadSingle(req, res, next) {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file provided' });
    const folder = typeof req.query.folder === 'string' ? req.query.folder : 'examin';

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder },
        (err, uploaded) => {
          if (err) return reject(err);
          resolve(uploaded);
        }
      );
      stream.end(file.buffer);
    });

    res.status(201).json({
      url: result.secure_url,
      public_id: result.public_id,
      bytes: result.bytes,
      format: result.format,
      width: result.width,
      height: result.height,
    });
  } catch (e) { next(e); }
}
