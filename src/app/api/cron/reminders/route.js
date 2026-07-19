import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder_key');

export const revalidate = 0;

export async function GET(request) {
    try {
        // 1. Verificar secreto del cron para seguridad
        const authHeader = request.headers.get('Authorization');
        if (authHeader !== `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET}`) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const hoy = new Date();
        
        // 2. Obtener todas las reservas activas (prestadas)
        const { data: reservas, error } = await supabase
            .from('reservas')
            .select(`
                *,
                libros(titulo),
                usuarios:user_id(nombre, email)
            `)
            .eq('estado', 'activa');

        if (error) throw error;

        const resultados = {
            enviados_3_dias: 0,
            enviados_vencidos: 0,
            errores: 0
        };

        for (const reserva of reservas) {
            if (!reserva.usuarios?.email) continue;

            const fechaVencimiento = new Date(reserva.vencimiento);
            const diffTiempo = fechaVencimiento - hoy;
            const diffDias = Math.ceil(diffTiempo / (1000 * 60 * 60 * 24));

            let subject = '';
            let html = '';
            let tipoNotificacion = '';

            // Caso A: Faltan exactamente 3 días (o entre 2 y 3 para ser seguros)
            if (diffDias === 3) {
                tipoNotificacion = '3_dias';
                subject = 'Recordatorio: Tu préstamo vence en 3 días - Biblioteca Tupahue';
                html = `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                        <h2 style="color: #3c4d6b;">Aviso de Próximo Vencimiento</h2>
                        <p>Hola <strong>${reserva.usuarios.nombre}</strong>,</p>
                        <p>Te recordamos que el plazo para devolver el libro <strong>"${reserva.libros.titulo}"</strong> vence en <strong>3 días</strong> (${fechaVencimiento.toLocaleDateString('es-CL')}).</p>
                        <p>Si ya lo terminaste, te agradecemos que lo acerques a la biblioteca en tu próxima visita.</p>
                        <p style="margin-top: 30px; font-size: 0.9rem; color: #666;">Bendiciones,<br>Equipo Biblioteca Tupahue</p>
                    </div>
                `;
            } 
            // Caso B: Ya venció (diferencia negativa o 0)
            else if (diffDias <= 0) {
                tipoNotificacion = 'vencido';
                subject = '¡ATENCIÓN! Préstamo vencido - Biblioteca Tupahue';
                html = `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #d9534f; border-radius: 10px;">
                        <h2 style="color: #d9534f;">Préstamo Vencido</h2>
                        <p>Hola <strong>${reserva.usuarios.nombre}</strong>,</p>
                        <p>El plazo de devolución para el libro <strong>"${reserva.libros.titulo}"</strong> ha vencido el día <strong>${fechaVencimiento.toLocaleDateString('es-CL')}</strong>.</p>
                        <p>Por favor, realiza la devolución lo antes posible para que otros hermanos puedan utilizar este material.</p>
                        <p style="margin-top: 30px; font-size: 0.9rem; color: #666;">Bendiciones,<br>Equipo Biblioteca Tupahue</p>
                    </div>
                `;
            }

            if (tipoNotificacion) {
                const { error: emailError } = await resend.emails.send({
                    from: 'Biblioteca Tupahue <onboarding@resend.dev>',
                    to: reserva.usuarios.email,
                    subject: subject,
                    html: html
                });

                if (emailError) {
                    console.error(`Error enviando a ${reserva.usuarios.email}:`, emailError);
                    resultados.errores++;
                } else {
                    if (tipoNotificacion === '3_dias') resultados.enviados_3_dias++;
                    else resultados.enviados_vencidos++;
                }
            }
        }

        return NextResponse.json({ success: true, resultados });

    } catch (err) {
        console.error('Error en cron de recordatorios:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
