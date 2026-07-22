import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        const bucket = formData.get('bucket') || 'ministerios';

        if (!file) {
            return NextResponse.json({ error: 'No se proporcionó ningún archivo' }, { status: 400 });
        }

        // 1. Verificar autenticación y rol de admin desde el servidor
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        const authHeader = request.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

        const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 });
        }

        // Verificar si es admin (usando metadata o tabla usuarios)
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
        const { data: userData } = await supabaseAdmin.from('usuarios').select('rol').eq('id', user.id).single();
        
        const isAdmin = userData?.rol === 'admin' || user.user_metadata?.role === 'admin';
        if (!isAdmin) {
            return NextResponse.json({ error: 'Se requieren permisos de administrador' }, { status: 403 });
        }

        // 2. Subir archivo usando SERVICE_ROLE para saltar RLS
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = fileName;

        const { data, error: uploadError } = await supabaseAdmin.storage
            .from(bucket)
            .upload(filePath, file, {
                contentType: file.type,
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) throw uploadError;

        // 3. Obtener URL pública
        const { data: { publicUrl } } = supabaseAdmin.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return NextResponse.json({ publicUrl });

    } catch (error) {
        console.error('Error en API de subida:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
