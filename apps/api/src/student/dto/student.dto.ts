import { IsEnum, IsArray } from 'class-validator';
import { Subject, ExplainStyle, StudyGoal } from '@prisma/client';

export class CreateProfileDto {
  @IsArray()
  preferSubjects: string[];

  @IsArray()
  hardSubjects: string[];

  @IsEnum(ExplainStyle)
  explainStyle: ExplainStyle;

  @IsEnum(StudyGoal)
  goal: StudyGoal;
}
