import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AlbumsService } from './albums.service';
import { CreateAlbumDto } from './dto/create-album.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Auditable } from '../audit-logs/decorators/auditable.decorator';

@ApiBearerAuth()
@Controller('albums')
export class AlbumsController {
  constructor(private readonly albumsService: AlbumsService) {}

  @Auditable('Album')
  @Roles('Admin Geral', 'Secretaria')
  @Post()
  create(@Body() createAlbumDto: CreateAlbumDto) {
    return this.albumsService.create(createAlbumDto);
  }

  @Public()
  @Get()
  findAll() {
    return this.albumsService.findAll();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.albumsService.findOne(+id);
  }

  @Auditable('Album')
  @Roles('Admin Geral', 'Secretaria')
  @Patch(':id')
  update(@Param('id') id: number, @Body() updateAlbumDto: UpdateAlbumDto) {
    return this.albumsService.update(+id, updateAlbumDto);
  }

  @Auditable('Album')
  @Roles('Admin Geral', 'Secretaria')
  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.albumsService.remove(+id);
  }
}