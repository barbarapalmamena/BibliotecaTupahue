'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import styles from './misReservas.module.css';
import {
    getCurrentUser,
    getReservasUsuario,
    devolverLibro,
    signOut,
    getUserRole
} from '@/lib/supabase';

export default function MisReservasClient() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [misReservas, setMisReservas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [devolviendo, setDevolviendo] = useState(null);

    const calcularDias = (reserva) => {
        try {
            if (!reserva?.created_at || !reserva?.vencimiento) return null;
            const inicio = new Date(reserva.created_at);
            const vence  = new Date(reserva.vencimiento);
            const hoy    = new Date();
            if (isNaN(inicio) || isNaN(vence)) return null;
            const total         = Math.max(1, Math.round((vence - inicio) / (1000 * 60 * 60 * 24)));
            const transcurridos = Math.max(0, Math.round((hoy - inicio) / (1000 * 60 * 60 * 24)));
            const restantes     = Math.max(0, Math.round((vence - hoy) / (1000 * 60 * 60 * 24)));
            const progreso      = Math.min(100, Math.round((transcurridos / total) * 100));
            const vencido       = hoy > vence;
            return { total, transcurridos, restantes, progreso, vencido };
        } catch {
            return null;
        }
    };

    useEffect(() => {
        const cargar = async () => {
            setLoading(true);
            try {
                const currentUser = await getCurrentUser();
                if (!currentUser) {
                    router.push('/login');
                    return;
                }
                const role = await getUserRole(currentUser.id);
                const isAdmin = role === 'admin' || currentUser.user_metadata?.role === 'admin';
                if (isAdmin) {
                    router.push('/');
                    return;
                }
                setUser(currentUser);
                const { data, error } = await getReservasUsuario(currentUser.id);
                if (error) console.error('Error al cargar reservas:', error);
                if (data) setMisReservas(data);
            } catch (err) {
                console.error('Error en cargar:', err);
            }
            setLoading(false);
        };
        cargar();
    }, [router]);

    const handleDevolver = async (reservaId, libroId) => {
        if (!confirm('¿Estás seguro de que quieres devolver este libro?')) return;
        setDevolviendo(reservaId);
        const { error } = await devolverLibro(reservaId, libroId);
        if (error) {
            alert('Error al devolver: ' + error.message);
        } else {
            alert('¡Libro devuelto exitosamente!');
            const { data } = await getReservasUsuario(user.id);
            if (data) setMisReservas(data);
        }
        setDevolviendo(null);
    };

    const handleLogout = async () => {
        await signOut();
        router.push('/');
    };

    const activas   = misReservas.filter(r => r.estado === 'activa');
    const historial = misReservas.filter(r => r.estado !== 'activa');

    return (
        <div className={styles.pageContainer}>
            <Navbar user={user} onLogout={handleLogout} />

            <div className={styles.mainContainer}>
                <h1 className={styles.pageTitle}>Mis Reservas</h1>

                {loading ? (
                    <div className={styles.loadingMessage}>
                        <i className="bi bi-hourglass-split"></i> Cargando tus reservas…
                    </div>
                ) : misReservas.length === 0 ? (
                    <div className={styles.emptyState}>
                        <i className="bi bi-bookmark-x"></i>
                        <p>No tienes reservas aún.</p>
                        <a href="/" className={styles.btnExplorar}>
                            <i className="bi bi-book"></i> Explorar libros
                        </a>
                    </div>
                ) : (
                    <>
                        {/* ── ACTIVAS ── */}
                        {activas.length > 0 && (
                            <section className={styles.section}>
                                <h2 className={styles.sectionTitle}>
                                    <i className="bi bi-bookmark-check" style={{ color: '#0d6efd' }}></i>
                                    Reservas Activas
                                </h2>
                                <div className={styles.reservasGrid}>
                                    {activas.map(res => {
                                        const dias = calcularDias(res);
                                        return (
                                            <div
                                                key={res.id}
                                                className={`${styles.card} ${dias?.vencido ? styles.cardVencida : styles.cardActiva}`}
                                            >
                                                <div className={styles.cardHeader}>
                                                    <i className="bi bi-book" style={{ color: '#3c4d6b', fontSize: '1.4rem' }}></i>
                                                    <span className={dias?.vencido ? styles.badgeDanger : styles.badgeActivo}>
                                                        {dias?.vencido ? '⚠️ Vencida' : '✅ Activa'}
                                                    </span>
                                                </div>

                                                <h3 className={styles.libroTitulo}>{res.libros?.titulo || 'Libro'}</h3>
                                                {res.libros?.autor && (
                                                    <p className={styles.libroAutor}>
                                                        <i className="bi bi-person"></i> {res.libros.autor}
                                                    </p>
                                                )}

                                                {dias && (
                                                    <>
                                                        <div className={styles.infoRow}>
                                                            <i className="bi bi-calendar3"></i>
                                                            <span>Llevas <strong>{dias.transcurridos} día{dias.transcurridos !== 1 ? 's' : ''}</strong> con este libro</span>
                                                        </div>
                                                        <div className={styles.infoRow}>
                                                            <i className="bi bi-clock" style={{ color: dias.vencido ? '#dc3545' : dias.restantes <= 2 ? '#ffc107' : '#28a745' }}></i>
                                                            <span>
                                                                {dias.vencido
                                                                    ? <strong style={{ color: '#dc3545' }}>Plazo vencido</strong>
                                                                    : <><strong style={{ color: dias.restantes <= 2 ? '#e0a800' : '#28a745' }}>{dias.restantes} día{dias.restantes !== 1 ? 's' : ''}</strong> restantes</>
                                                                }
                                                            </span>
                                                        </div>
                                                        <div className={styles.infoRow}>
                                                            <i className="bi bi-calendar-x"></i>
                                                            <span>Vence el <strong>{new Date(res.vencimiento).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}</strong></span>
                                                        </div>

                                                        {/* Barra de progreso */}
                                                        <div className={styles.progressWrapper}>
                                                            <div className={styles.progressBar}>
                                                                <div
                                                                    className={styles.progressFill}
                                                                    style={{
                                                                        width: `${dias.progreso}%`,
                                                                        background: dias.vencido ? '#dc3545' : dias.progreso >= 80 ? '#ffc107' : '#17a2b8'
                                                                    }}
                                                                />
                                                            </div>
                                                            <span className={styles.progressLabel}>{dias.progreso}% del tiempo usado</span>
                                                        </div>

                                                        {dias.vencido && (
                                                            <p className={styles.alertDanger}>⚠️ Por favor, devuelve el libro lo antes posible.</p>
                                                        )}
                                                        {!dias.vencido && dias.restantes <= 2 && (
                                                            <p className={styles.alertWarning}>⏰ ¡Te quedan pocos días! Recuerda devolver el libro.</p>
                                                        )}
                                                    </>
                                                )}

                                                <button
                                                    onClick={() => handleDevolver(res.id, res.libro_id)}
                                                    disabled={devolviendo === res.id}
                                                    className={styles.btnDevolver}
                                                >
                                                    <i className="bi bi-arrow-return-left"></i>
                                                    {devolviendo === res.id ? 'Devolviendo…' : 'Marcar como Devuelto'}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {/* ── HISTORIAL ── */}
                        {historial.length > 0 && (
                            <section className={styles.section}>
                                <h2 className={styles.sectionTitle}>
                                    <i className="bi bi-clock-history" style={{ color: '#28a745' }}></i>
                                    Historial de Lecturas
                                </h2>
                                <div className={styles.reservasGrid}>
                                    {historial.map(res => (
                                        <div key={res.id} className={`${styles.card} ${styles.cardDevuelta}`}>
                                            <div className={styles.cardHeader}>
                                                <i className="bi bi-book" style={{ color: '#3c4d6b', fontSize: '1.4rem' }}></i>
                                                <span className={styles.badgeDevuelto}>✔ Devuelto</span>
                                            </div>
                                            <h3 className={styles.libroTitulo}>{res.libros?.titulo || 'Libro'}</h3>
                                            {res.libros?.autor && (
                                                <p className={styles.libroAutor}>
                                                    <i className="bi bi-person"></i> {res.libros.autor}
                                                </p>
                                            )}
                                            {res.fecha_devolucion && (
                                                <div className={styles.infoRow}>
                                                    <i className="bi bi-check-circle" style={{ color: '#28a745' }}></i>
                                                    <span>Devuelto el <strong>{new Date(res.fecha_devolucion).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}</strong></span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </>
                )}
            </div>

            <Footer />
        </div>
    );
}
