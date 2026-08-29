import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './infrastructure/persistence/prisma/prisma.module';
import { StorageModule } from './infrastructure/storage/storage.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { TechniciansModule } from './modules/technicians/technicians.module';
import { TechnicianExtrasModule } from './modules/technicians/technician-extras.module';
import { AvailabilitiesModule } from './modules/availabilities/availabilities.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { ReportsModule } from './modules/reports/reports.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AdminModule } from './modules/admin/admin.module';
import { AdminRolesModule } from './modules/admin-roles/admin-roles.module';
import { RegionsModule } from './modules/regions/regions.module';
import { CsrfModule } from './common/csrf/csrf.module';
import { CsrfGuard } from './common/guards/csrf.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    PrismaModule,
    StorageModule,
    CsrfModule,
    UsersModule,
    AuthModule,
    TechniciansModule,
    TechnicianExtrasModule,
    AvailabilitiesModule,
    BookingsModule,
    ReportsModule,
    MessagingModule,
    NotificationsModule,
    AdminModule,
    AdminRolesModule,
    RegionsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: CsrfGuard },
  ],
})
export class AppModule {}
