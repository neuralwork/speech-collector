import fs from 'fs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';

// Utility function to add a prefix to the filename while retaining the directory structure
function addTempPrefixToFilename(filePath, prefix = 'temp-') {
  const dirPath = path.dirname(filePath);
  const baseName = path.basename(filePath);
  const tempFileName = `${prefix}${baseName}`;
  return path.join(dirPath, tempFileName);
}

export class FileStorage {
  constructor(storageType) {
    this.storageType = storageType;
    this.s3Client = this.initializeS3Client(storageType);
    ffmpeg.setFfmpegPath(ffmpegPath);
    const directoryPath = process.env.SOUND_RECORDINGS_PATH;
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }
    if (storageType === 'aws-s3'){
      this.bucketName = process.env.AWS_BUCKET_NAME
    } else if (storageType === 'r2'){
      this.bucketName = process.env.CF_R2_BUCKET_NAME
    }
  }

  initializeS3Client(storageType) {
    if (storageType === 'r2') {
      return new S3Client({
        region: 'auto',
        endpoint: process.env.CF_R2_ENDPOINT,
        credentials: {
          accessKeyId: process.env.CF_R2_ACCESS_KEY_ID,
          secretAccessKey: process.env.CF_R2_SECRET_ACCESS_KEY,
        },
      });
    } else if (storageType === 'aws-s3') {
      return new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      });
    } else if (storageType !== 'local') {
      throw new Error("Specified storage type not implemented!");
    }
    return null;
  }

  async reencodeFile(inputPath) {
    const tempOutputPath = addTempPrefixToFilename(inputPath, 'tmp-');
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .output(tempOutputPath)
        .outputOptions('-c:a pcm_s16le')
        .on('end', () => {
          console.log('Re-encoding finished');
          fs.renameSync(tempOutputPath, inputPath);
          resolve();
        })
        .on('error', (err) => {
          console.error('Error during re-encoding:', err.message);
          if (fs.existsSync(tempOutputPath)) fs.unlinkSync(tempOutputPath);
          reject(err);
        })
        .run();
    });
  }

  async saveRecording(file, outputFilename) {
    const tempFilePath = path.join(process.env.SOUND_RECORDINGS_PATH, outputFilename);

    try {
      if (!Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
        throw new Error('Invalid or empty buffer provided');
      }

      fs.writeFileSync(tempFilePath, file.buffer);
      console.log(`Temporary file written to ${tempFilePath}`);

      await this.reencodeFile(tempFilePath);

      if (this.storageType === 'local') {
        console.log(`File saved locally as ${outputFilename}`);
      } else if (this.storageType === 'r2' || this.storageType === 'aws-s3') {
        await this.uploadToS3(tempFilePath, outputFilename);
      } else {
        throw new Error('Invalid storage type specified');
      }
    } catch (error) {
      console.error(`Error saving file: ${error.message}`);
      throw error;
    } finally {
      if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
    }
  }

  async uploadToS3(filePath, outputFilename) {
    const fileBuffer = fs.readFileSync(filePath);
    const params = {
      Bucket: this.bucketName,
      Key: outputFilename,
      Body: fileBuffer,
      ContentType: 'audio/wav',
    };
    try {
      const response = await this.s3Client.send(new PutObjectCommand(params));
      console.log(`File uploaded successfully with ETag: ${response.ETag}`);
    } catch (error) {
      console.error(`Error uploading to S3: ${error.message}`);
      throw error;
    }
  }
}

export default FileStorage;
