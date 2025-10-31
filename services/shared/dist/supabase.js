"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSupabaseClient = createSupabaseClient;
const supabase_js_1 = require("@supabase/supabase-js");
function createSupabaseClient() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_KEY');
    }
    return (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
}
