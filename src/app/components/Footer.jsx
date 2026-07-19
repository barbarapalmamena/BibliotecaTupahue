import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.footerContainer}>
                <div className={styles.footerSection}>
                    <h4 className={styles.footerTitle}>Iglesia Tupahue</h4>
                    <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', maxWidth: '250px' }}>
                        Iglesia Reformada comprometida con la Palabra de Dios y el servicio a la comunidad.
                    </p>
                </div>

                <div className={styles.footerSection}>
                    <h4 className={styles.footerTitle}>Navegación</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <Link href="/" className={styles.footerLink}>Biblioteca (Inicio)</Link>
                        <Link href="/login" className={styles.footerLink}>Iniciar Sesión</Link>
                    </div>
                </div>

                <div className={styles.footerSection}>
                    <h4 className={styles.footerTitle}>Síguenos</h4>
                    <div className={styles.socialLinks}>
                        <a
                            href="https://www.instagram.com/iglesiatupahue"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.footerLink}
                            aria-label="Instagram"
                        >
                            <i className="bi bi-instagram" style={{ fontSize: '1.5rem' }}></i>
                        </a>
                        <a
                            href="https://www.youtube.com/@iglesiatupahue"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.footerLink}
                            aria-label="YouTube"
                        >
                            <i className="bi bi-youtube" style={{ fontSize: '1.5rem' }}></i>
                        </a>
                        <a
                            href="https://www.facebook.com/iglesiatupahue"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.footerLink}
                            aria-label="Facebook"
                        >
                            <i className="bi bi-facebook" style={{ fontSize: '1.5rem' }}></i>
                        </a>
                    </div>
                </div>
            </div>

            <hr className={styles.footerDivider} />

            <div className={styles.footerCopyright}>
                <p>&copy; {new Date().getFullYear()} Iglesia Tupahue. Todos los derechos reservados.</p>
            </div>
        </footer>
    );
}
