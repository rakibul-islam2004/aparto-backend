import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class BarcodesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates a configurable 12-digit barcode.
   * Structure: Category Prefix (2) + Variant Code (4) + Unique Serial (4) + Check Digits (2) = 12 Digits
   */
  async generate12DigitBarcode(
    categoryPrefix: string,
    variantAttrCode: string,
  ): Promise<{ barcode: string; breakdown: { prefix: string; variantCode: string; serial: string; checkDigits: string } }> {
    // 1. Validate Category Prefix (2 digits)
    const normalizedPrefix = (categoryPrefix || '10').padStart(2, '0').slice(-2);

    // 2. Validate Variant Code (4 digits)
    const normalizedVariantCode = (variantAttrCode || '0001').padStart(4, '0').slice(-4);

    // 3. Obtain Next Unique Serial for scope (4 digits)
    const totalVariants = await this.prisma.productVariant.count();
    const nextSerialNum = (totalVariants + 1) % 10000;
    const normalizedSerial = nextSerialNum.toString().padStart(4, '0');

    // 4. Calculate 2 Check Digits (Luhn-like checksum modulo 100)
    const rawTen = `${normalizedPrefix}${normalizedVariantCode}${normalizedSerial}`;
    const checkDigits = this.calculateCheckDigits(rawTen);

    const full12DigitBarcode = `${rawTen}${checkDigits}`;

    // Verify database uniqueness
    const existing = await this.prisma.productVariant.findUnique({
      where: { barcode: full12DigitBarcode },
    });

    if (existing) {
      // Offset serial by timestamp fallback if collision occurs
      const altSerial = ((Date.now() % 9000) + 1000).toString();
      const altRaw = `${normalizedPrefix}${normalizedVariantCode}${altSerial}`;
      const altCheck = this.calculateCheckDigits(altRaw);
      return {
        barcode: `${altRaw}${altCheck}`,
        breakdown: {
          prefix: normalizedPrefix,
          variantCode: normalizedVariantCode,
          serial: altSerial,
          checkDigits: altCheck,
        },
      };
    }

    return {
      barcode: full12DigitBarcode,
      breakdown: {
        prefix: normalizedPrefix,
        variantCode: normalizedVariantCode,
        serial: normalizedSerial,
        checkDigits: checkDigits,
      },
    };
  }

  /**
   * Calculates 2 check digits for a 10-digit payload string
   */
  private calculateCheckDigits(payload: string): string {
    let sumOdd = 0;
    let sumEven = 0;
    for (let i = 0; i < payload.length; i++) {
      const num = parseInt(payload[i], 10) || 0;
      if (i % 2 === 0) {
        sumOdd += num * 3;
      } else {
        sumEven += num * 1;
      }
    }
    const total = sumOdd + sumEven;
    const remainder = (100 - (total % 100)) % 100;
    return remainder.toString().padStart(2, '0');
  }
}
