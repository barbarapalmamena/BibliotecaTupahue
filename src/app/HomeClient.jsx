'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import styles from './page.module.css';
import { getCurrentUser, signOut, supabase } from '@/lib/supabase';

export default function HomeClient() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [config, setConfig] = useState({});
    const [articulos, setArticulos] = useState([]);

    useEffect(() => {
        loadUser();
        fetchConfig();
        fetchArticulos();
    }, []);

    const fetchArticulos = async () => {
        const { data } = await supabase
            .from('articulos')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(3);
        setArticulos(data || []);
    };

    const fetchConfig = async () => {
        const { data } = await supabase.from('configuracion').select('*');
        const configMap = {};
        data?.forEach(item => { configMap[item.clave] = item.valor; });
        setConfig(configMap);
    };

    const getEmbedUrl = (url) => {
        if (!url) return null;
        if (url.includes('youtube.com/embed/') || url.includes('youtube-nocookie.com/embed/')) return url;

        let videoId = '';
        if (url.includes('youtube.com/watch?v=')) {
            videoId = url.split('v=')[1].split('&')[0];
        } else if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1].split('?')[0];
        } else if (url.includes('youtube.com/playlist?list=')) {
            const listId = url.split('list=')[1].split('&')[0];
            return `https://www.youtube.com/embed/videoseries?list=${listId}`;
        }

        if (videoId) return `https://www.youtube.com/embed/${videoId}`;
        return url;
    };

    const loadUser = async () => {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
    };

    const handleLogout = async () => {
        await signOut();
        setUser(null);
        router.push('/');
    };

    return (
        <div className={styles.pageContainer}>
            <Navbar user={user} onLogout={handleLogout} />

            {/* ── HERO ── */}
            <section
                className={styles.hero}
                style={{ backgroundImage: "url('/img/inicio.jpg')" }}
            >
                <div className={styles.heroOverlay}>
                    <h1 className={styles.heroTitle}>
                        BIENVENIDOS<br />
                        IGLESIA TUPAHUE<br />
                        REFORMADA
                    </h1>
                    <Link href="/biblioteca" className={styles.heroCta}>
                        <i className="bi bi-book"></i> Ver Biblioteca
                    </Link>
                </div>
            </section>

            {/* ── MISIÓN Y VISIÓN ── */}
            <section className={styles.misionVision}>
                <div className={styles.container}>
                    <p className={styles.misionText}>
                        Somos una iglesia formada por personas que expresan la misma fe, reciben el mismo Señor,
                        creen en su nombre y fueron llamados a ser parte de una nueva familia donde están todos
                        aquellos que hacen la voluntad del Padre.
                    </p>
                </div>
            </section>

            {/* ── VIDEOS ── */}
            <section className={styles.videosSection}>
                <div className={styles.container}>
                    <h2 className={styles.sectionTitle}>Nuestros Servicios</h2>
                    <div className={styles.videosGrid}>
                        <div className={styles.videoCard}>
                            <div className={styles.videoContainer}>
                                <iframe
                                    src={getEmbedUrl(config.video_dominical) || "https://www.youtube.com/embed/videoseries?list=PLmShX6jrCSweWQtT-WZp5OwIjjP_hFKh6"}
                                    allowFullScreen
                                    title="Servicio Dominical"
                                />
                            </div>
                            <div className={styles.cardBody}>
                                <h5 className={styles.cardTitle}>Servicio Dominical</h5>
                            </div>
                        </div>

                        <div className={styles.videoCard}>
                            <div className={styles.videoContainer}>
                                <iframe
                                    src={getEmbedUrl(config.video_credo) || "https://www.youtube.com/embed/jMQa-1Gk3a4?si=EN8szu3jncPMrSAL"}
                                    allowFullScreen
                                    title="El credo"
                                />
                            </div>
                            <div className={styles.cardBody}>
                                <h5 className={styles.cardTitle}>El credo</h5>
                            </div>
                        </div>

                        <div className={styles.videoCard}>
                            <div className={styles.videoContainer}>
                                <iframe
                                    src={getEmbedUrl(config.video_estudio) || "https://www.youtube.com/embed/videoseries?list=PLmShX6jrCSwcOTbXLuwmtWHJdXPLnXI_k"}
                                    allowFullScreen
                                    title="Estudio Bíblico"
                                />
                            </div>
                            <div className={styles.cardBody}>
                                <h5 className={styles.cardTitle}>Estudio Bíblico</h5>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── ARTÍCULOS / BLOG ── */}
            {articulos.length > 0 && (
                <section className={styles.articlesSection}>
                    <div className={styles.container}>
                        <h2 className={styles.sectionTitle}>Palabra de Vida</h2>
                        <div className={styles.articlesGrid}>
                            {articulos.map((articulo) => (
                                <article key={articulo.id} className={styles.articleCard}>
                                    <div className={styles.articleBody}>
                                        <div className={styles.articleMeta}>
                                            {new Date(articulo.created_at).toLocaleDateString('es-ES', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </div>
                                        <h3 className={styles.articleTitle}>{articulo.titulo}</h3>
                                        <div
                                            className={styles.articleText}
                                            dangerouslySetInnerHTML={{ __html: articulo.contenido }}
                                        />
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── ENCUENTROS ── */}
            <section className={styles.encuentrosSection}>
                <div className={styles.container}>
                    <h2 className={styles.sectionTitle}>Encuentros</h2>
                    <div className={styles.encuentrosGrid}>
                        <div className={styles.encuentroCard}>
                            <div className={styles.encuentroImageContainer}>
                                <Image
                                    src="/img/oracion.jpeg"
                                    alt="Reunión de Oración"
                                    width={400}
                                    height={300}
                                    className={styles.encuentroImage}
                                />
                            </div>
                            <div className={styles.cardBody}>
                                <h4 className={styles.cardTitle}>Reunión de Oración</h4>
                                <p className={styles.cardText}><i className="bi bi-calendar3"></i> Miércoles</p>
                                <p className={styles.cardText}><i className="bi bi-clock"></i> 19:30 hrs</p>
                            </div>
                        </div>

                        <div className={styles.encuentroCard}>
                            <div className={styles.encuentroImageContainer}>
                                <Image
                                    src="/img/servicio.jpeg"
                                    alt="Servicio Dominical"
                                    width={400}
                                    height={300}
                                    className={styles.encuentroImage}
                                />
                            </div>
                            <div className={styles.cardBody}>
                                <h4 className={styles.cardTitle}>Servicio Dominical</h4>
                                <p className={styles.cardText}><i className="bi bi-calendar3"></i> Domingo</p>
                                <p className={styles.cardText}><i className="bi bi-clock"></i> Escuela Bíblica 10:30 hrs</p>
                                <p className={styles.cardText}><i className="bi bi-clock"></i> Servicio 11:20 hrs</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── INSTAGRAM ── */}
            <section className={styles.instagramSection}>
                <div className={styles.instagramContainer}>
                    <i className="bi bi-instagram" style={{ fontSize: '3rem', color: '#E4405F' }}></i>
                    <p className={styles.instagramText}>Síguenos en Instagram <strong>@iglesiatupahue</strong></p>
                    <a
                        href="https://www.instagram.com/iglesiatupahue"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.instagramButton}
                    >
                        Ver en Instagram
                    </a>
                </div>
            </section>

            <Footer />
        </div>
    );
}
