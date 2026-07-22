import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
            return NextResponse.json({ error: 'Variables de Supabase no configuradas' }, { status: 500 });
        }

        const authHeader = request.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'No autorizado - Sin token' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const authClient = createClient(supabaseUrl, supabaseAnonKey);
        const { data: { user }, error: authError } = await authClient.auth.getUser(token);

        if (authError || !user) return NextResponse.json({ error: 'No autorizado - Token inválido' }, { status: 401 });

        // Verificar si es admin
        const { data: userData } = await authClient
            .from('usuarios')
            .select('rol')
            .eq('id', user.id)
            .single();

        const isAdmin = userData?.rol === 'admin' || user.user_metadata?.role === 'admin' || user.email === 'barbarapalmamena@gmail.com';

        if (!isAdmin) {
            return NextResponse.json({ error: 'Prohibido. Se requiere rol de admin.' }, { status: 403 });
        }

        const dbClient = supabaseServiceKey
            ? createClient(supabaseUrl, supabaseServiceKey)
            : createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } });

        const { data: reservasData, error: reservasError } = await dbClient
            .from('reservas')
            .select(`
                id,
                estado,
                created_at,
                vencimiento,
                libro_id,
                usuario_id,
                libros (titulo, autor, paginas)
            `)
            .order('created_at', { ascending: false });

        if (reservasError) {
            console.error('Error al consultar reservas:', reservasError);
            return NextResponse.json({ error: reservasError.message }, { status: 500 });
        }

        const { data: profiles } = await dbClient.from('usuarios').select('id, nombre, email');
        
        const combinedData = (reservasData || []).map(reserva => ({
            ...reserva,
            usuario: (profiles || []).find(p => p.id === reserva.usuario_id) || { nombre: 'Usuario Desconocido', email: 'N/A' }
        }));

        return NextResponse.json({ data: combinedData });
    } catch (err) {
        console.error('Error interno API reservas:', err);
        return NextResponse.json({ error: err.message || 'Error del servidor' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        const authHeader = request.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const authClient = createClient(supabaseUrl, supabaseAnonKey);
        const { data: { user }, error: authError } = await authClient.auth.getUser(token);

        if (authError || !user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

        const { data: userData } = await authClient
            .from('usuarios')
            .select('rol')
            .eq('id', user.id)
            .single();

        const isAdmin = userData?.rol === 'admin' || user.user_metadata?.role === 'admin' || user.email === 'barbarapalmamena@gmail.com';
        if (!isAdmin) return NextResponse.json({ error: 'Prohibido' }, { status: 403 });

        const { searchParams } = new URL(request.url);
        const reservaId = searchParams.get('reservaId');
        const libroId = searchParams.get('libroId');

        if (!reservaId) return NextResponse.json({ error: 'Falta reservaId' }, { status: 400 });

        const dbClient = supabaseServiceKey
            ? createClient(supabaseUrl, supabaseServiceKey)
            : createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } });

        // 1. Eliminar la reserva de la base de datos
        const { error: delError } = await dbClient
            .from('reservas')
            .delete()
            .eq('id', reservaId);

        if (delError) return NextResponse.json({ error: delError.message }, { status: 500 });

        // 2. Si tenía libro asociado, reponer el stock
        if (libroId) {
            const { data: libro } = await dbClient.from('libros').select('cantidad').eq('id', libroId).single();
            await dbClient.from('libros').update({
                cantidad: (libro?.cantidad || 0) + 1,
                disponible: true
            }).eq('id', libroId);
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Error al eliminar reserva API:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
