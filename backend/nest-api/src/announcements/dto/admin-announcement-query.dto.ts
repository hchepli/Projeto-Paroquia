import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class AdminAnnouncementQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filtra por status. Se omitido, retorna DRAFT e PUBLISHED juntos.',
    enum: ['DRAFT', 'PUBLISHED'],
    example: 'DRAFT',
  })
  @IsIn(['DRAFT', 'PUBLISHED'])
  @IsOptional()
  status?: 'DRAFT' | 'PUBLISHED';
}
