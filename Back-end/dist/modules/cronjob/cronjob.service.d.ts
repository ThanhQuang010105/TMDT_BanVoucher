import { SupabaseService } from '../../supabase/supabase.service';
export declare class CronjobService {
    private supabase;
    private readonly logger;
    constructor(supabase: SupabaseService);
    expireVouchers(): Promise<void>;
}
