import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './infrastructure/persistence/prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { TechniciansModule } from './modules/technicians/technicians.module';
import { AvailabilitiesModule } from './modules/availabilities/availabilities.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { AdminModule } from './modules/admin/admin.module';
import { RegionsModule } from './modules/regions/regions.module';
import { CsrfModule } from './common/csrf/csrf.module';
import { CsrfGuard } from './common/guards/csrf.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    PrismaModule,
    CsrfModule,
    UsersModule,
    AuthModule,
    TechniciansModule,
    AvailabilitiesModule,
    BookingsModule,
    AdminModule,
    RegionsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: CsrfGuard },
  ],
})
export class AppModule {}
