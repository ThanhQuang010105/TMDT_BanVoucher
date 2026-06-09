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
const uuid_1 = require("uuid");
dotenv.config();
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
async function test() {
    const email = `test_partner_${Date.now()}@gmail.com`;
    const password = 'password123';
    const ten_doanh_nghiep = 'Test Partner Corp';
    console.log('--- STEP 1: CREATE AUTH USER ---');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role: 'doi_tac' },
    });
    if (authError) {
        console.error('Auth Error:', authError);
        return;
    }
    const userId = authData.user?.id;
    console.log('User ID created:', userId);
    console.log('--- STEP 2: INSERT TAI_KHOAN ---');
    const { error: tkError } = await supabase.from('tai_khoan').insert({
        ma_tk: userId,
        username: email,
        vai_tro: 'doi_tac',
        trang_thai_hoat_dong: 'pending',
    });
    if (tkError) {
        console.error('Tai Khoan Error:', tkError);
        return;
    }
    console.log('Tai Khoan inserted.');
    console.log('--- STEP 3: INSERT DOI_TAC ---');
    const maDt = `DT-${(0, uuid_1.v4)().slice(0, 8).toUpperCase()}`;
    const { error: dtError } = await supabase.from('doi_tac').insert({
        ma_dt: maDt,
        ma_tk: userId,
        ten_doanh_nghiep: ten_doanh_nghiep,
        nguoi_dai_dien: 'Test Representative',
        ma_so_thue: `MST-${Date.now().toString().slice(-8)}`,
        trang_thai_duyet: 'pending',
    });
    if (dtError) {
        console.error('Doi Tac Error:', dtError);
        return;
    }
    console.log('Doi Tac inserted successfully with ma_dt:', maDt);
}
test();
//# sourceMappingURL=test-register-partner.js.map