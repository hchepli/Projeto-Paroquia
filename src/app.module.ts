import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { VolunteersModule } from './volunteers/volunteers.module';
import { MassesModule } from './masses/masses.module';
import { EventsModule } from './events/events.module';
import { CategoriesModule } from './categories/categories.module';
import { SchedulesModule } from './schedules/schedules.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { AlbumsModule } from './albums/albums.module';
import { PhotosModule } from './photos/photos.module';
import { SacramentsModule } from './sacraments/sacraments.module';
import { PastoralGroupsModule } from './pastoral-groups/pastoral-groups.module';
import { AttendanceConfirmationsModule } from './attendance-confirmations/attendance-confirmations.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { ScheduleAssignmentModule } from './schedule-assignment/schedule-assignment.module';
import { PermissionModule } from './permission/permission.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guards';
import { StorageModule } from './storage/storage.module';
import { CalendarModule } from './calendar/calendar.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditInterceptor } from './audit-logs/interceptors/audit.interceptor';
import * as Joi from 'joi';
import { APP_FILTER } from '@nestjs/core';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().min(32).required(),
      }),
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    RolesModule,
    VolunteersModule,
    MassesModule,
    EventsModule,
    CategoriesModule,
    SchedulesModule,
    AnnouncementsModule,
    AlbumsModule,
    PhotosModule,
    SacramentsModule,
    PastoralGroupsModule,
    AttendanceConfirmationsModule,
    AuditLogsModule,
    ScheduleAssignmentModule,
    PermissionModule,
    StorageModule,
    CalendarModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: PrismaExceptionFilter,
    },
  ],
})
export class AppModule { }