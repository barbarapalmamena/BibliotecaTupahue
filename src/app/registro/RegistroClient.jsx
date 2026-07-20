'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import styles from './registro.module.css';
import { signUp, getCurrentUser } from '@/lib/supabase';

export default function RegistroClient() {
    const router = useRouter();
    const [formData, setFormData] = useState({ nombre: '', email: '', password: '', confirmar: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        const checkUser = async () => {
            const user = await getCurrentUser();
            if (user) router.push('/');
        };
        checkUser();
    }, [router]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!formData.nombre || !formData.email || !formData.password || !formData.confirmar) {
            setError('Por favor completa todos los campos');
            return;
        }

        if (formData.password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        if (formData.password !== formData.confirmar) {
            setError('Las contraseñas no coinciden');
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await signUp(formData.email, formData.password, formData.nombre);

            if (error) {
                if (error.message?.includes('already registered')) {
                    setError('Este correo ya está registrado');
                } else {
                    setError(error.message || 'Error al registrarse');
                }
            } else {
                setSuccess('¡Registro exitoso! Revisa tu correo para confirmar tu cuenta.');
                setFormData({ nombre: '', email: '', password: '', confirmar: '' });
            }
        } catch (err) {
            setError('Error al registrarse');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.pageContainer}>
            <Navbar />

            <section className={styles.registroSection}>
                <div className={styles.container}>
                    <div className={styles.registroCard}>
                        <div className={styles.registroHeader}>
                            <div className={styles.logoContainer}>
                                <Image
                                    src="/img/LogoTupahue.png"
                                    alt="Logo Tupahue"
                                    width={90}
                                    height={90}
                                    className={styles.registroLogo}
                                />
                            </div>
                            <h1 className={styles.registroTitle}>Crear Cuenta</h1>
                            <p className={styles.registroSubtitle}>Gestiona la biblioteca de la Iglesia</p>
                        </div>

                        <form className={styles.registroForm} onSubmit={handleSubmit} noValidate>
                            {error && (
                                <div className={styles.errorMessage}>
                                    <i className="bi bi-exclamation-circle"></i> {error}
                                </div>
                            )}

                            {success && (
                                <div className={styles.successMessage}>
                                    <i className="bi bi-check-circle"></i> {success}
                                </div>
                            )}

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel} htmlFor="nombre">
                                    <i className="bi bi-person"></i> Nombre
                                </label>
                                <input
                                    id="nombre"
                                    type="text"
                                    name="nombre"
                                    className={styles.formInput}
                                    placeholder="Tu nombre completo"
                                    value={formData.nombre}
                                    onChange={handleChange}
                                    required
                                    autoComplete="name"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel} htmlFor="email">
                                    <i className="bi bi-envelope"></i> Correo Electrónico
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    className={styles.formInput}
                                    placeholder="tu@email.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    autoComplete="email"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel} htmlFor="password">
                                    <i className="bi bi-lock"></i> Contraseña
                                </label>
                                <div className={styles.passwordContainer}>
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        className={styles.formInput}
                                        placeholder="Mínimo 6 caracteres"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        className={styles.togglePassword}
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
                                    </button>
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel} htmlFor="confirmar">
                                    <i className="bi bi-lock-fill"></i> Confirmar Contraseña
                                </label>
                                <div className={styles.passwordContainer}>
                                    <input
                                        id="confirmar"
                                        type={showConfirm ? 'text' : 'password'}
                                        name="confirmar"
                                        className={styles.formInput}
                                        placeholder="Repite tu contraseña"
                                        value={formData.confirmar}
                                        onChange={handleChange}
                                        required
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        className={styles.togglePassword}
                                        onClick={() => setShowConfirm(!showConfirm)}
                                    >
                                        <i className={`bi bi-eye${showConfirm ? '-slash' : ''}`}></i>
                                    </button>
                                </div>
                            </div>

                            <button type="submit" className={styles.submitButton} disabled={loading}>
                                {loading ? (
                                    <><i className="bi bi-hourglass-split"></i> Registrando…</>
                                ) : (
                                    <><i className="bi bi-person-plus"></i> Crear Cuenta</>
                                )}
                            </button>
                        </form>

                        <div className={styles.registroFooter}>
                            <p>
                                ¿Ya tienes cuenta?{' '}
                                <Link href="/login" className={styles.loginLink}>
                                    Inicia sesión aquí
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
