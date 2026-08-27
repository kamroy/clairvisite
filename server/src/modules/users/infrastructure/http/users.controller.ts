import { Body, Controller, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../../../common/decorators/current-user.decorator';
import { UpdateMyProfileUseCase } from '../../application/update-my-profile.use-case';
import { UpdateProfileDto } from './users.dto';

function toPublicProfile(user: { id: string; email: string; fullName: string; role: string; phone: string | null; avatarUrl: string | null }) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
  };
}

// Ouvert à tous les rôles authentifiés : chaque utilisateur ne peut modifier que son propre profil.
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly updateMyProfile: UpdateMyProfileUseCase) {}

  @Patch('me')
  async updateProfile(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateProfileDto) {
    const updated = await this.updateMyProfile.execute(user.sub, dto);
    return toPublicProfile(updated);
  }
}
