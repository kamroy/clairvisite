import { Module } from '@nestjs/common';
import { USER_REPOSITORY } from './domain/user.repository.port';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository';
import { UsersController } from './infrastructure/http/users.controller';
import { UpdateMyProfileUseCase } from './application/update-my-profile.use-case';

@Module({
  controllers: [UsersController],
  providers: [{ provide: USER_REPOSITORY, useClass: PrismaUserRepository }, UpdateMyProfileUseCase],
  exports: [USER_REPOSITORY],
})
export class UsersModule {}
