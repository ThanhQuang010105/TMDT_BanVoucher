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
const TABLES = [
    'chi_nhanh', 'nhat_ky_he_thong', 'tai_khoan', 'voucher_phat_hanh',
    'lich_su_giao_dich', 'don_hang', 'danh_gia', 'danh_muc',
    'doi_soat', 'phan_loai', 'khach_hang', 'voucher_chi_nhanh',
    'doi_tac', 'chi_tiet_gio_hang', 'chi_tiet_don_hang', 'dieu_kien_ap_dung',
    'khieu_nai', 'cay_danh_muc', 'voucher'
];
async function scan() {
    console.log('Scanning all tables for "starbucks_vn@gmail.com"...');
    for (const table of TABLES) {
        const { data, error } = await supabase.from(table).select('*');
        if (error) {
            console.error(`Error reading table ${table}:`, error);
            continue;
        }
        if (!data)
            continue;
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowStr = JSON.stringify(row).toLowerCase();
            if (rowStr.includes('starbucks_vn@gmail.com')) {
                console.log(`FOUND in table [${table}] at index ${i}:`, row);
            }
        }
    }
    console.log('Scan complete.');
}
scan();
//# sourceMappingURL=scan-db.js.map