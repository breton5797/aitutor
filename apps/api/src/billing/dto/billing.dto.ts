import { IsEnum } from 'class-validator';
import { PlanType } from '@prisma/client';

export class SubscribeDto {
  @IsEnum(PlanType)
  planType: PlanType;
}
