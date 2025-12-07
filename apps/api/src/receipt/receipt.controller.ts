import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ReceiptService } from './receipt.service';

@Controller('receipts')
@UseGuards(AuthGuard('jwt'))
export class ReceiptController {
  constructor(private readonly receiptService: ReceiptService) {}

  @Post('scan')
  @UseInterceptors(
    FileInterceptor('receipt', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
      },
      fileFilter: (req, file, callback) => {
        // Only accept images
        if (!file.mimetype.match(/^image\//)) {
          return callback(
            new BadRequestException('Only image files are allowed'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async scanReceipt(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new PayloadTooLargeException('File size must be less than 10MB');
    }

    const parsed = await this.receiptService.parseReceipt(
      file.buffer as Buffer,
      file.mimetype as string,
    );

    return parsed;
  }
}
