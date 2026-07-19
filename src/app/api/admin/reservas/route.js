import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar token del usuario que hace la petición
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    // Verificar si es admin en la tabla usuarios o en metadata
    const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('rol')
        .eq('id', user.id)
        .single();

    const isAdmin = userData?.rol === 'admin' || user.user_metadata?.role === 'admin';

    if (!isAdmin) {
        return NextResponse.json({ error: 'Prohibido. Se requiere rol de admin.' }, { status: 403 });
    }

    // Obtener todas las reservas con datos de libros y usuarios
    // Nota: Usamos una consulta manual para unir con la tabla usuarios en el esquema público
    const { data, error } = await supabase
        .from('reservas')
        .select(`
            id,
            estado,
            created_at,
            fecha_devolucion,
            libro_id,
            user_id,
            libros (titulo, autor, paginas)
        `)
        .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Ahora obtenemos los perfiles de los usuarios para completar la info
    // Esto es más seguro que intentar joins complejos si las relaciones no están explícitas en Supabase
    const { data: profiles } = await supabase.from('usuarios').select('id, nombre, email');
    
    const combinedData = data.map(reserva => ({
        ...reserva,
        usuario: profiles.find(p => p.id === reserva.user_id) || { nombre: 'Usuario Desconocido', email: 'N/A' }
    }));

    return NextResponse.json({ data: combinedData });
}
