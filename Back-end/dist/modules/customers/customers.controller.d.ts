import { CustomersService } from './customers.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
export declare class CustomersController {
    private readonly customersService;
    constructor(customersService: CustomersService);
    getMyProfile(token: string): Promise<{
        data: {
            ma_kh: any;
            ho_ten: any;
            sdt: any;
            dia_chi: any;
            email: any;
        };
    }>;
    updateMyProfile(token: string, dto: UpdateProfileDto): Promise<{
        message: string;
        data: any;
    }>;
    changePassword(token: string, dto: ChangePasswordDto): Promise<{
        message: string;
    }>;
}
