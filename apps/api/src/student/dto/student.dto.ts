import { IsEnum, IsArray } from 'class-validator';
import { Subject, ExplainStyle, StudyGoal } from '@prisma/client';

export class CreateProfileDto {
  @IsArray()
  @IsEnum(Subject, { each: true })
  preferSubjects: Subject[];

  @IsArray()
  @IsEnum(Subject, { each: true })
  hardSubjects: Subject[];

  @IsEnum(ExplainStyle)
  explainStyle: ExplainStyle;

  @IsEnum(StudyGoal)
  goal: StudyGoal;
}
