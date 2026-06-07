"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
const SEEDED_ACCOUNTS = [
    { email: 'admin@gmail.com', oldId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', role: 'admin' },
    { email: 'cgv_cinema@gmail.com', oldId: '33333333-3333-3333-3333-333333333333', role: 'doi_tac' },
    { email: 'starbucks_vn@gmail.com', oldId: '44444444-4444-4444-4444-444444444444', role: 'doi_tac' },
    { email: 'highlands_vn@gmail.com', oldId: '66666666-6666-6666-6666-666666666666', role: 'doi_tac' },
    { email: 'khoado@gmail.com', oldId: '11111111-1111-1111-1111-111111111111', role: 'khach_hang' },
    { email: 'thinhdao@gmail.com', oldId: '22222222-2222-2222-2222-222222222222', role: 'khach_hang' },
    { email: 'minhanh@gmail.com', oldId: '55555555-5555-5555-5555-555555555555', role: 'khach_hang' },
];
async function fixSeeded() {
    console.log('Starting seed accounts migration...');
    for (const account of SEEDED_ACCOUNTS) {
        const tempEmail = account.email.replace('@', '_old_temp@');
        const { data: tempAcc } = await supabase
            .from('tai_khoan')
            .select('*')
            .eq('username', tempEmail)
            .maybeSingle();
        if (tempAcc) {
            console.log(`Restoring temp name ${tempEmail} back to ${account.email}`);
            await supabase
                .from('tai_khoan')
                .update({ username: account.email })
                .eq('ma_tk', tempAcc.ma_tk);
        }
    }
    const { data, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
        console.error('Error listing auth users:', listError);
        return;
    }
    const users = data.users || [];
    for (const account of SEEDED_ACCOUNTS) {
        console.log(`\nProcessing ${account.email}...`);
        const tempEmail = account.email.replace('@', '_old_temp@');
        const { data: oldAcc } = await supabase
            .from('tai_khoan')
            .select('*')
            .eq('ma_tk', account.oldId)
            .maybeSingle();
        if (oldAcc) {
            console.log(`Renaming existing tai_khoan username to temp: ${tempEmail}`);
            const { error: renameError } = await supabase
                .from('tai_khoan')
                .update({ username: tempEmail })
                .eq('ma_tk', account.oldId);
            if (renameError) {
                console.error(`Failed to rename username:`, renameError);
                continue;
            }
        }
        let authUser = users.find(u => u.email?.toLowerCase() === account.email.toLowerCase());
        if (!authUser) {
            console.log(`Creating user in Supabase Auth: ${account.email}...`);
            const { data: createData, error: createError } = await supabase.auth.admin.createUser({
                email: account.email,
                password: '123456',
                email_confirm: true,
            });
            if (createError) {
                console.error(`Failed to create ${account.email} in Auth:`, createError.message);
                if (oldAcc) {
                    await supabase.from('tai_khoan').update({ username: account.email }).eq('ma_tk', oldAcc.ma_tk);
                }
                continue;
            }
            authUser = createData.user;
        }
        else {
            console.log(`User already exists in Supabase Auth: ${account.email}. Updating password to 123456...`);
            const { error: updError } = await supabase.auth.admin.updateUserById(authUser.id, {
                password: '123456',
            });
            if (updError)
                console.error(`Error setting password for ${account.email}:`, updError);
        }
        if (!authUser)
            continue;
        const newId = authUser.id;
        if (newId === account.oldId) {
            console.log(`User ${account.email} already has the correct ID matching auth.`);
            await supabase.from('tai_khoan').update({ username: account.email, trang_thai_hoat_dong: 'active' }).eq('ma_tk', newId);
            continue;
        }
        console.log(`Migrating database tables: ${account.oldId} -> ${newId}`);
        const { error: insError } = await supabase.from('tai_khoan').insert({
            ma_tk: newId,
            username: account.email,
            vai_tro: account.role,
            trang_thai_hoat_dong: 'active',
            ngay_tao: oldAcc ? oldAcc.ngay_tao : new Date().toISOString(),
        });
        if (insError && !insError.message.includes('duplicate key')) {
            console.error(`Failed to insert new tai_khoan:`, insError);
            if (oldAcc) {
                await supabase.from('tai_khoan').update({ username: account.email }).eq('ma_tk', oldAcc.ma_tk);
            }
            continue;
        }
        if (account.role === 'doi_tac') {
            const { error: dtUpdError } = await supabase
                .from('doi_tac')
                .update({ ma_tk: newId })
                .eq('ma_tk', account.oldId);
            if (dtUpdError)
                console.error(`Error updating doi_tac for ${account.email}:`, dtUpdError);
        }
        else if (account.role === 'khach_hang') {
            const { error: khUpdError } = await supabase
                .from('khach_hang')
                .update({ ma_tk: newId })
                .eq('ma_tk', account.oldId);
            if (khUpdError)
                console.error(`Error updating khach_hang for ${account.email}:`, khUpdError);
        }
        const { error: nkUpdError } = await supabase
            .from('nhat_ky_he_thong')
            .update({ ma_tk: newId })
            .eq('ma_tk', account.oldId);
        if (nkUpdError)
            console.error(`Error updating nhat_ky_he_thong:`, nkUpdError);
        const { error: delError } = await supabase
            .from('tai_khoan')
            .delete()
            .eq('ma_tk', account.oldId);
        if (delError) {
            console.error(`Error deleting old tai_khoan ${account.oldId}:`, delError);
        }
        else {
            console.log(`Successfully migrated ${account.email} to new ID ${newId}`);
        }
    }
    console.log('\nMigration completed successfully.');
}
fixSeeded();
//# sourceMappingURL=fix-seeded.js.map