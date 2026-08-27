import { IsIn } from 'class-validator';

export class SetTechnicianStatusDto {
  @IsIn(['approved', 'rejected'])
  status: 'approved' | 'rejected';
}
