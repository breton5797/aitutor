import { IsEnum, IsString, IsOptional } from 'class-validator';
import { Subject } from '@prisma/client';

export class CreateConversationDto {
  @IsEnum(Subject)
  subject: Subject;

  @IsString()
  @IsOptional()
  title?: string;
}

export class SendMessageDto {
  @IsString()
  content: string;

  @IsString()
  @IsOptional()
  mode?: 'TEXT' | 'VOICE';
}
