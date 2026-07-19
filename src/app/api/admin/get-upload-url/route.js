import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { fileName, bucket } = await request.json();

        if (!fileName) {
            return NextResponse.json({ error: 'Falta el nombre del archivo' }, { status: 400 });
        }

        // 1. Verificar autenticación y rol de admin
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        const authHeader = request.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

        const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 });
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
        const { data: userData } = await supabaseAdmin.from('usuarios').select('rol').eq('id', user.id).single();
        
        const isAdmin = userData?.rol === 'admin' || user.user_metadata?.role === 'admin';
        if (!isAdmin) {
            return NextResponse.json({ error: 'Se requieren permisos de administrador' }, { status: 403 });
        }

        // 2. Generar Signed URL para subida (válida por 15 minutos)
        // Usamos createSignedUploadUrl para permitir la subida directa desde el cliente
        const { data, error } = await supabaseAdmin.storage
            .from(bucket || 'ministerios')
            .createSignedUploadUrl(fileName);

        if (error) throw error;

        return NextResponse.json({ 
            signedUrl: data.signedUrl, 
            token: data.token,
            path: data.path 
        });

    } catch (error) {
        console.error('Error al generar Signed URL:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
