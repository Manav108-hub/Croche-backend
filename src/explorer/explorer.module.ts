import { Module } from '@nestjs/common';
import { ExplorerController } from './explorer.controller';
import { VoyagerController } from './voyager.controller';

@Module({
  controllers: [ExplorerController, VoyagerController]
})
export class ExplorerModule {}
