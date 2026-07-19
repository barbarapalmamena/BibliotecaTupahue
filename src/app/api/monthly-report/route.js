import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        // Verificar secreto (para seguridad de CRON)
        const authHeader = request.headers.get('Authorization');
        const secret = process.env.NEXT_PUBLIC_CRON_SECRET || 'test';
        
        if (authHeader !== `Bearer ${secret}`) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        // Estadísticas básicas
        const { data: reservas, error: resError } = await supabase
            .from('reservas')
            .select('id, user_id, estado')
            .gte('created_at', firstDay);

        if (resError) throw resError;

        const stats = {
            mes: now.toLocaleString('es-CL', { month: 'long', year: 'numeric' }),
            totalReservas: reservas.length,
            usuariosUnicos: new Set(reservas.map(r => r.user_id)).size,
            activos: reservas.filter(r => r.estado === 'activa').length
        };

        // Aquí se podría enviar un email con el reporte vía Resend también
        
        return NextResponse.json({ success: true, stats });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
