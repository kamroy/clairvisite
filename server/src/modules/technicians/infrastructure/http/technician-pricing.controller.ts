import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../../../common/decorators/current-user.decorator';
import { AddTechnicianPricingItemUseCase } from '../../application/use-cases/add-technician-pricing-item.use-case';
import { RemoveTechnicianPricingItemUseCase } from '../../application/use-cases/remove-technician-pricing-item.use-case';
import { ListTechnicianPricingItemsUseCase } from '../../application/use-cases/list-technician-pricing-items.use-case';
import { AddPricingItemDto } from './technician-pricing.dto';

@Controller('technicians')
export class TechnicianPricingController {
  constructor(
    private readonly addItem: AddTechnicianPricingItemUseCase,
    private readonly removeItem: RemoveTechnicianPricingItemUseCase,
    private readonly listItems: ListTechnicianPricingItemsUseCase,
  ) {}

  // Déclarés avant ':id/pricing-items' (voir technicians.controller.ts pour la même
  // discipline) : un segment littéral 'me' ne doit pas être avalé par ':id'.
  @Post('me/pricing-items')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('technicien')
  add(@CurrentUser() user: AuthenticatedUser, @Body() dto: AddPricingItemDto) {
    return this.addItem.execute(user.sub, dto.label, dto.price);
  }

  @Delete('me/pricing-items/:itemId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('technicien')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('itemId') itemId: string) {
    return this.removeItem.execute(user.sub, itemId);
  }

  @Get(':id/pricing-items')
  list(@Param('id') id: string) {
    return this.listItems.execute(id);
  }
}
