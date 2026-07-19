'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import styles from './login.module.css';
import { signIn, getCurrentUser } from '@/lib/supabase';

export default function LoginClient() {
    const router = useRouter();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    useEffect(() => {
        const savedEmail = localStorage.getItem('tupahue_remember_email');
        const savedPass = localStorage.getItem('tupahue_remember_pass');

        if (savedEmail) {
            setFormData(prev => ({ ...prev, email: savedEmail, password: savedPass || '' }));
            setRememberMe(true);
        }

        const checkUser = async () => {
            const user = await getCurrentUser();
            if (user) router.push('/biblioteca');
        };
        checkUser();
    }, [router]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.email || !formData.password) {
            setError('Por favor completa todos los campos');
            return;
        }

        setLoading(true);

        try {
            const { data, error } = await signIn(formData.email, formData.password);

            if (error) {
                setError('Email o contraseña incorrectos');
            } else {
                if (rememberMe) {
                    localStorage.setItem('tupahue_remember_email', formData.email);
                    localStorage.setItem('tupahue_remember_pass', formData.password);
                } else {
                    localStorage.removeItem('tupahue_remember_email');
                    localStorage.removeItem('tupahue_remember_pass');
                }
                router.push('/biblioteca');
            }
        } catch (err) {
            setError('Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.pageContainer}>
            <Navbar />

            <section className={styles.loginSection}>
                <div className={styles.container}>
                    <div className={styles.loginCard}>
                        <div className={styles.loginHeader}>
                            <div className={styles.logoContainer}>
                                <Image
                                    src="/img/LogoTupahue.png"
                                    alt="Logo Tupahue"
                                    width={100}
                                    height={100}
                                    className={styles.loginLogo}
                                />
                            </div>
                            <h1 className={styles.loginTitle}>Bienvenido</h1>
                            <p className={styles.loginSubtitle}>Inicia sesión en tu cuenta</p>
                        </div>

                        <form className={styles.loginForm} onSubmit={handleSubmit} noValidate>
                            {error && (
                                <div className={styles.errorMessage}>
                                    <i className="bi bi-exclamation-circle"></i> {error}
                                </div>
                            )}

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
                                        placeholder="Tu contraseña"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        className={styles.togglePassword}
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                    >
                                        <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
                                    </button>
                                </div>
                            </div>

                            <div className={styles.formOptions}>
                                <label className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        className={styles.checkbox}
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                    />
                                    Recordarme
                                </label>
                                <Link href="/recuperar-password" className={styles.forgotPassword}>
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>

                            <button type="submit" className={styles.submitButton} disabled={loading}>
                                {loading ? (
                                    <><i className="bi bi-hourglass-split"></i> Iniciando sesión…</>
                                ) : (
                                    <><i className="bi bi-box-arrow-in-right"></i> Iniciar Sesión</>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
