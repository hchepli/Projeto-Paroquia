import { PartialType } from '@nestjs/swagger';
import { CreateAttendanceConfirmationDto } from './create-attendance-confirmation.dto';

export class UpdateAttendanceConfirmationDto extends PartialType(CreateAttendanceConfirmationDto) {}
