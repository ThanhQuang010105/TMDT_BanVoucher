import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CronjobService } from './cronjob.service';
import { SupabaseModule } from '../../supabase/supabase.module';

@Module({
  imports: [ScheduleModule.forRoot(), SupabaseModule],
  providers: [CronjobService],
})
export class CronjobModule {}
