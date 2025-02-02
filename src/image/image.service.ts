import { BadRequestException, Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { PrismaService } from 'src/prisma/prisma.service';
import { FileUpload } from 'graphql-upload-ts';

@Injectable()
export class ImageService {
    constructor(private prisma: PrismaService) {}

    async uploadToCloudinary(file: FileUpload): Promise<any> {
        const { createReadStream, filename } = file;
        try {
            return new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream({
                    folder: 'products'
                },
                async (error, result) => {
                    if (error) return reject(error);

                    try {
                        const image = await this.prisma.image.create({
                            data: {
                                public_id: result.public_id,
                                url: result.secure_url,
                                width: result.width,
                                height: result.height,
                                format: result.format,
                            }
                        });

                        resolve(image);
                    } catch (prismaError) {
                        reject(prismaError);
                    }
                }
            );
            const stream = createReadStream();
            stream.pipe(uploadStream);
            stream.on('error', (error) => {
                reject(error);
            });
        });
        } catch (error) {
            console.error('Image upload error:', error);
            throw new BadRequestException('Image upload Failed');
        }
    }
}
