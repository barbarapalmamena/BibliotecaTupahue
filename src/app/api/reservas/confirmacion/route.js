import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder_key');

export async function POST(request) {
    try {
        const body = await request.json();
        const { email, nombre, libroTitulo, autor, diasPrestamo } = body;

        if (!email || !libroTitulo) {
            return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
        }

        const fechaVencimiento = new Date();
        fechaVencimiento.setDate(fechaVencimiento.getDate() + (parseInt(diasPrestamo) || 14));
        const fechaFormateada = fechaVencimiento.toLocaleDateString('es-CL', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const { data, error } = await resend.emails.send({
            from: 'Biblioteca Tupahue <onboarding@resend.dev>',
            to: email,
            subject: `Confirmación de Reserva: ${libroTitulo} - Biblioteca Tupahue`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #3c4d6b; border-radius: 10px;">
                    <h2 style="color: #3c4d6b; text-align: center;">¡Reserva Confirmada! 📚</h2>
                    <p>Hola <strong>${nombre || 'Hermano/a'}</strong>,</p>
                    <p>Has reservado exitosamente el siguiente libro en la <strong>Biblioteca de la Iglesia Reformada Tupahue</strong>:</p>
                    
                    <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #3c4d6b; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>Libro:</strong> ${libroTitulo}</p>
                        ${autor ? `<p style="margin: 5px 0;"><strong>Autor:</strong> ${autor}</p>` : ''}
                        <p style="margin: 5px 0;"><strong>Plazo de lectura:</strong> ${diasPrestamo} días</p>
                        <p style="margin: 5px 0;"><strong>Fecha límite para devolver:</strong> <span style="color: #d9534f; font-weight: bold;">${fechaFormateada}</span></p>
                    </div>

                    <p>Por favor, acércate al encargado de la biblioteca para retirar tu ejemplar.</p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;" />
                    
                    <p style="font-size: 0.9rem; color: #666; text-align: center;">
                        Que este libro sea de edificación para tu vida spiritual.<br>
                        <strong>Equipo de Biblioteca Tupahue</strong>
                    </p>
                </div>
            `
        });

        if (error) {
            console.error('Error enviando email de confirmación:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, id: data.id });
    } catch (err) {
        console.error('Error en API confirmacion reserva:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
