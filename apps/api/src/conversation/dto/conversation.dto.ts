import { IsEnum, IsString, IsOptional } from 'class-validator';
import { Subject } from '@prisma/client';

export class CreateConversationDto {
  @IsEnum(Subject)
  @IsOptional()
  subject?: Subject;

  @IsString()
  @IsOptional()
  segmentId?: string;

  @IsString()
  @IsOptional()
  subjectId?: string;

  @IsString()
  @IsOptional()
  courseId?: string;

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

  @IsString()
  @IsOptional()
  lang?: string;
}
