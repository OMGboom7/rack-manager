import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaService } from './prisma/prisma.service';
import { AuthModule } from './auth/auth.module';
import { DatacenterModule } from './datacenter/datacenter.module';
import { RackModule } from './rack/rack.module';
import { DeviceModule } from './device/device.module';
import { UserModule } from './user/user.module';
import { AuditLogService } from './common/services/audit-log.service';
import { AuditController } from './common/controllers/audit.controller';
import { HealthController } from './common/controllers/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 30,
    }]),
    AuthModule,
    DatacenterModule,
    RackModule,
    DeviceModule,
    UserModule,
  ],
  controllers: [AuditController, HealthController],
  providers: [
    PrismaService,
    AuditLogService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [PrismaService, AuditLogService],
})
export class AppModule {}
