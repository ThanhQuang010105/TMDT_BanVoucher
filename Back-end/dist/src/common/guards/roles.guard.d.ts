import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseService } from '../../supabase/supabase.service';
export declare class RolesGuard implements CanActivate {
    private reflector;
    private supabase;
    constructor(reflector: Reflector, supabase: SupabaseService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
