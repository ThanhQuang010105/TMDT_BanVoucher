import { SupabaseService } from '../../supabase/supabase.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
export declare class CustomersService {
    private readonly supabaseService;
    constructor(supabaseService: SupabaseService);
    getMyProfile(accessToken: string): Promise<{
        data: {
            ma_kh: any;
            ho_ten: any;
            sdt: any;
            dia_chi: any;
            email: any;
        };
    }>;
    updateMyProfile(accessToken: string, dto: UpdateProfileDto): Promise<{
        message: string;
        data: any;
    }>;
    changePassword(accessToken: string, dto: ChangePasswordDto): Promise<{
        message: string;
    }>;
}
