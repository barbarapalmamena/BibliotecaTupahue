import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function POST(request) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        // 1. Verificar autorización
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

        const supabase = supabaseServiceKey
            ? createClient(supabaseUrl, supabaseServiceKey)
            : createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

        // 2. Verificar rol admin
        const { data: userData } = await supabase
            .from('usuarios')
            .select('rol')
            .eq('id', user.id)
            .single();

        const isAdmin = userData?.rol === 'admin' || user.user_metadata?.role === 'admin' || user.email === 'barbarapalmamena@gmail.com';

        if (!isAdmin) {
            return NextResponse.json({ error: 'Prohibido' }, { status: 403 });
        }

        // 3. Obtener datos de la reserva
        const { reservaId } = await request.json();
        const { data: reserva, error: resError } = await supabase
            .from('reservas')
            .select('*, libros(titulo)')
            .eq('id', reservaId)
            .single();

        if (resError || !reserva) {
            return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
        }

        // Obtener datos del usuario receptor
        const { data: receptor } = await supabase
            .from('usuarios')
            .select('nombre, email')
            .eq('id', reserva.usuario_id)
            .single();

        if (!receptor?.email) return NextResponse.json({ error: 'El usuario no tiene email registrado' }, { status: 400 });

        // 4. Enviar email vía Gmail SMTP a la persona + copia al admin
        await sendEmail({
            to: receptor.email,
            cc: 'barbarapalmamena@gmail.com', // Copia de respaldo al admin
            subject: 'Recordatorio de Devolución - Biblioteca Tupahue',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #3c4d6b;">Recordatorio de Biblioteca</h2>
                    <p>Hola <strong>${receptor.nombre}</strong>,</p>
                    <p>Esperamos que estés bien. Te escribimos de la <strong>Iglesia Reformada Tupahue</strong> para recordarte que tienes un préstamo pendiente:</p>
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>Libro:</strong> ${reserva.libros?.titulo || 'Libro'}</p>
                        <p style="margin: 5px 0;"><strong>Fecha de reserva:</strong> ${new Date(reserva.created_at).toLocaleDateString('es-CL')}</p>
                    </div>
                    <p>Por favor, acércate a la biblioteca a la brevedad para realizar la devolución y permitir que otros hermanos puedan disfrutar de este recurso.</p>
                    <p style="margin-top: 30px; font-size: 0.9rem; color: #666;">
                        Bendiciones,<br>
                        Equipo de Biblioteca Tupahue
                    </p>
                </div>
            `
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Error enviando email:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
