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
async function test() {
    console.log('Renaming starbucks_vn@gmail.com in tai_khoan permanently to temp...');
    await supabase
        .from('tai_khoan')
        .update({ username: 'starbucks_vn_old_temp@gmail.com' })
        .eq('ma_tk', '44444444-4444-4444-4444-444444444444');
    console.log('Trying to create starbucks_vn_test@gmail.com in Auth...');
    const res1 = await supabase.auth.admin.createUser({
        email: 'starbucks_vn_test@gmail.com',
        password: '123456',
        email_confirm: true,
    });
    console.log('Result for starbucks_vn_test@gmail.com:', res1.error ? res1.error.message : 'SUCCESS');
    console.log('Trying to create starbucks_vn@gmail.com in Auth...');
    const res2 = await supabase.auth.admin.createUser({
        email: 'starbucks_vn@gmail.com',
        password: '123456',
        email_confirm: true,
    });
    console.log('Result for starbucks_vn@gmail.com:', res2.error ? res2.error.message : 'SUCCESS');
}
test();
//# sourceMappingURL=test-emails.js.map