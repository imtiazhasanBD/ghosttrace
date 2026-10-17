import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Look for x-ghosttrace-key or Authorization: Bearer <key>
    const headerKey = request.headers['x-ghosttrace-key'];
    const authHeader = request.headers['authorization'];

    let apiKey = headerKey;
    if (!apiKey && authHeader && authHeader.startsWith('Bearer ')) {
      apiKey = authHeader.substring(7).trim();
    }

    if (!apiKey || typeof apiKey !== 'string') {
      throw new UnauthorizedException('Missing GhostTrace API Key');
    }

    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    const keyRecord = await this.prisma.apiKey.findUnique({
      where: { keyHash },
      include: { project: true },
    });

    if (!keyRecord) {
      throw new UnauthorizedException('Invalid GhostTrace API Key');
    }

    if (keyRecord.revokedAt) {
      throw new UnauthorizedException('GhostTrace API Key has been revoked');
    }

    if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('GhostTrace API Key has expired');
    }

    // Attach project and api key info to request
    request.project = keyRecord.project;
    request.apiKeyRecord = keyRecord;

    // Asynchronously update lastUsedAt without blocking
    this.prisma.apiKey
      .update({
        where: { id: keyRecord.id },
        data: { lastUsedAt: new Date() },
      })
      .catch((err) => {
        // Non-fatal background error
      });

    return true;
  }
}
