'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { 
    signOut, 
    eliminarReserva,
    getLibros,
    crearLibro,
    actualizarLibro,
    eliminarLibro,
    getArticulos,
    crearArticulo,
    actualizarArticulo,
    eliminarArticulo,
    getMinisterios,
    crearMinisterio,
    actualizarMinisterio,
    eliminarMinisterio,
    getUsuarios,
    eliminarUsuario
} from '../../lib/supabase';
import { supabase, uploadMinisterioImagen } from '@/lib/supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import styles from './admin.module.css';

export default function AdminClient({ user }) {
    const [reservas, setReservas] = useState([]);
    const [articulos, setArticulos] = useState([]);
    const [libros, setLibros] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('inicio');
    
    // Estados para Dashboard
    const [stats, setStats] = useState({ totalReservas: 0, activos: 0, usuarios: 0 });

    // Estados para Usuarios
    const [usuarios, setUsuarios] = useState([]);
    const [busquedaUsuario, setBusquedaUsuario] = useState('');
    const [actualizandoRol, setActualizandoRol] = useState(null);
    
    // Estados para Configuración
    const [config, setConfig] = useState({});
    const [guardandoConfig, setGuardandoConfig] = useState(false);
    
    // Estados para Ministerios
    const [ministerios, setMinisterios] = useState([]);
    const [newMinisterio, setNewMinisterio] = useState({ nombre: '', descripcion: '', encargado: '', categoria: 'general', imagen: '' });
    const [subiendoImagen, setSubiendoImagen] = useState(false);
    const [archivoImagen, setArchivoImagen] = useState(null);
    const [guardandoMinisterio, setGuardandoMinisterio] = useState(false);
    const [editingMinisterioId, setEditingMinisterioId] = useState(null);

    // Estados para Libros
    const [newLibro, setNewLibro] = useState({ 
        titulo: '', 
        autor: '', 
        paginas: '', 
        cantidad: 1, 
        imagen_url: '', 
        disponible: true 
    });
    const [guardandoLibro, setGuardandoLibro] = useState(false);
    const [editingLibroId, setEditingLibroId] = useState(null);
    const [busquedaLibro, setBusquedaLibro] = useState('');

    // Estados para Artículos
    const [newArticulo, setNewArticulo] = useState({ titulo: '', contenido: '', autor: user?.user_metadata?.nombre || '' });
    const [publicando, setPublicando] = useState(false);
    const [editingArticuloId, setEditingArticuloId] = useState(null);

    const router = useRouter();

    useEffect(() => {
        if (activeTab === 'inicio') fetchDashboardStats();
        else if (activeTab === 'reservas') fetchReservas();
        else if (activeTab === 'articulos') fetchArticulos();
        else if (activeTab === 'libros') fetchLibros();
        else if (activeTab === 'configuracion') fetchConfig();
        else if (activeTab === 'ministerios') fetchMinisterios();
        else if (activeTab === 'usuarios') fetchUsuarios();
        else if (activeTab === 'reportes') { fetchLibros(); fetchReservas(); fetchUsuarios(); }
    }, [activeTab]);

    async function fetchDashboardStats() {
        setLoading(true);
        try {
            // Usamos queries separadas y manejamos errores individualmente
            const { count: totalReservas } = await supabase.from('reservas').select('*', { count: 'exact', head: true });
            const { count: activos } = await supabase.from('reservas').select('*', { count: 'exact', head: true }).eq('estado', 'activa');
            const { count: usuariosCount } = await supabase.from('usuarios').select('*', { count: 'exact', head: true });
            
            setStats({
                totalReservas: totalReservas || 0,
                activos: activos || 0,
                usuarios: usuariosCount || 0
            });
        } catch (error) { 
            console.error('Error fetching dashboard stats:', error); 
        } finally { 
            setLoading(false); 
        }
    }

    async function fetchUsuarios() {
        setLoading(true);
        try {
            const { data } = await getUsuarios();
            setUsuarios(data || []);
        } catch (error) { console.error(error); } finally { setLoading(false); }
    }

    async function fetchMinisterios() {
        setLoading(true);
        try {
            const { data } = await getMinisterios();
            setMinisterios(data || []);
        } catch (error) { console.error(error); } finally { setLoading(false); }
    }

    async function fetchConfig() {
        setLoading(true);
        try {
            const { data } = await supabase.from('configuracion').select('*');
            const configMap = {};
            data?.forEach(item => { configMap[item.clave] = item.valor; });
            setConfig(configMap);
        } catch (error) { console.error(error); } finally { setLoading(false); }
    }

    async function fetchReservas() {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch('/api/admin/reservas', {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });
            const { data } = await response.json();
            setReservas(data || []);
        } catch (error) { console.error(error); } finally { setLoading(false); }
    }

    async function fetchArticulos() {
        setLoading(true);
        try {
            const { data } = await getArticulos();
            setArticulos(data || []);
        } catch (error) { console.error(error); } finally { setLoading(false); }
    }

    async function fetchLibros() {
        setLoading(true);
        try {
            const { data } = await getLibros();
            setLibros(data || []);
        } catch (error) { console.error(error); } finally { setLoading(false); }
    }

    const handleLogout = async () => {
        await signOut();
        router.push('/');
    };

    // Handlers para libros y artículos
    const handleCrearArticulo = async (e) => {
        e.preventDefault();
        setPublicando(true);
        try {
            if (editingArticuloId) {
                await actualizarArticulo(editingArticuloId, newArticulo);
                alert(' Reflexión actualizada');
                setEditingArticuloId(null);
            } else {
                await crearArticulo(newArticulo);
                alert(' Reflexión publicada');
            }
            setNewArticulo({ titulo: '', contenido: '', autor: user?.user_metadata?.nombre || '' });
            fetchArticulos();
        } catch (error) { alert(error.message); } finally { setPublicando(false); }
    };

    const prepareEditArticulo = (art) => {
        setNewArticulo({ titulo: art.titulo, contenido: art.contenido, autor: art.autor || '' });
        setEditingArticuloId(art.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCrearLibro = async (e) => {
        e.preventDefault();
        setGuardandoLibro(true);
        try {
            const payload = {
                ...newLibro,
                paginas: parseInt(newLibro.paginas) || 0,
                cantidad: parseInt(newLibro.cantidad) || 0,
                disponible: parseInt(newLibro.cantidad) > 0
            };
            if (editingLibroId) {
                const res = await actualizarLibro(editingLibroId, payload);
                if (res.error) throw res.error;
                alert(' Actualizado');
            } else {
                const res = await crearLibro(payload);
                if (res.error) throw res.error;
                alert(' Guardado');
            }
            setNewLibro({ titulo: '', autor: '', paginas: '', cantidad: 1, imagen_url: '', disponible: true });
            setEditingLibroId(null);
            fetchLibros();
        } catch (error) { alert(error.message); } finally { setGuardandoLibro(false); }
    };

    const prepareEditLibro = (libro) => {
        setNewLibro({ titulo: libro.titulo, autor: libro.autor, paginas: libro.paginas || '', cantidad: libro.cantidad, imagen_url: libro.imagen_url || '', disponible: libro.disponible });
        setEditingLibroId(libro.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSaveConfig = async (clave, valor) => {
        setGuardandoConfig(true);
        try {
            const { error } = await supabase.from('configuracion').upsert({ clave, valor }, { onConflict: 'clave' });
            if (error) throw error;
            setConfig(prev => ({ ...prev, [clave]: valor }));
        } catch (error) {
            alert('Error al guardar: ' + error.message);
        } finally {
            setGuardandoConfig(false);
        }
    };

    const compressImage = async (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new window.Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 1200; // Reducimos el ancho máximo para ahorrar espacio
                    const MAX_HEIGHT = 1200;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    canvas.toBlob((blob) => {
                        const compressedFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now(),
                        });
                        resolve(compressedFile);
                    }, 'image/jpeg', 0.7); // 0.7 calidad (buena relación peso/calidad)
                };
            };
        });
    };

    const handleCrearMinisterio = async (e) => {
        e.preventDefault();
        setGuardandoMinisterio(true);
        let imagenUrl = newMinisterio.imagen;

        if (archivoImagen) {
            setSubiendoImagen(true);
            console.log("Comprimiendo imagen...");
            const imagenAceptable = await compressImage(archivoImagen);
            console.log("Imagen comprimida. Tamaño original:", (archivoImagen.size/1024/1024).toFixed(2), "MB. Nuevo tamaño:", (imagenAceptable.size/1024/1024).toFixed(2), "MB");

            console.log("Llamando a uploadMinisterioImagen vía API...");
            const { data, error } = await uploadMinisterioImagen(imagenAceptable);
            
            if (error) {
                console.error("Error devuelto por uploadMinisterioImagen:", error);
                alert('Error al subir imagen: ' + (error.message || 'Error desconocido'));
                setSubiendoImagen(false);
                setGuardandoMinisterio(false);
                return;
            }
            
            if (!data?.publicUrl) {
                alert('No se pudo obtener la URL de la imagen subida');
                setSubiendoImagen(false);
                setGuardandoMinisterio(false);
                return;
            }

            imagenUrl = data.publicUrl;
            console.log("Imagen subida con éxito, URL:", imagenUrl);
        }

        try {
            if (editingMinisterioId) {
                await actualizarMinisterio(editingMinisterioId, { ...newMinisterio, imagen: imagenUrl });
                alert(' Ministerio actualizado');
                setEditingMinisterioId(null);
            } else {
                await crearMinisterio({ ...newMinisterio, imagen: imagenUrl });
                alert(' Ministerio creado');
            }
            setNewMinisterio({ nombre: '', descripcion: '', encargado: '', categoria: 'general', imagen: '' });
            setArchivoImagen(null);
            // Limpiar el input de tipo file manualmente
            const fileInput = document.getElementById('ministerioImagen');
            if (fileInput) fileInput.value = '';
            
            fetchMinisterios();
        } catch (error) { alert(error.message); } finally { 
            setGuardandoMinisterio(false); 
            setSubiendoImagen(false);
        }
    };

    const prepareEditMinisterio = (m) => {
        setNewMinisterio({ 
            nombre: m.nombre, 
            descripcion: m.descripcion, 
            encargado: m.encargado || '', 
            categoria: m.categoria || 'general', 
            imagen: m.imagen || ''
        });
        setEditingMinisterioId(m.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSendReminder = async (reservaId) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch('/api/admin/send-reminder', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reservaId })
            });
            const result = await response.json();
            if (result.success) alert(' Recordatorio enviado con éxito');
            else throw new Error(result.error);
        } catch (error) {
            alert(' Error: ' + error.message);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!confirm('¿Estás seguro de que quieres eliminar a este usuario de la base de datos? Esto no se puede deshacer.')) return;
        setActualizandoRol(userId);
        try {
            const { error } = await eliminarUsuario(userId);
            if (error) throw error;
            fetchUsuarios();
            alert('Usuario eliminado correctamente.');
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            setActualizandoRol(null);
        }
    };

    const generatePDF = (title, headers, data, filename) => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text('Iglesia Tupahue', 14, 20);
        doc.setFontSize(12);
        doc.text(title, 14, 30);
        doc.text(`Fecha: ${new Date().toLocaleDateString('es-CL')}`, 14, 38);
        
        autoTable(doc, {
            startY: 45,
            head: [headers],
            body: data,
            theme: 'striped',
            headStyles: { fillColor: [60, 77, 107] }
        });
        
        doc.save(`${filename}_${new Date().getTime()}.pdf`);
    };

    const handleReportInventario = () => {
        if (libros.length === 0) {
            alert('No hay libros en el inventario para generar el reporte.');
            return;
        }
        const data = libros.map(l => [l.titulo, l.autor, l.cantidad]);
        generatePDF('Reporte de Inventario de Libros', ['Título', 'Autor', 'Stock'], data, 'inventario_libros');
    };

    const handleReportPrestamos = () => {
        if (reservas.length === 0) {
            alert('No hay préstamos registrados para generar el reporte.');
            return;
        }
        const data = reservas.map(r => [r.usuario?.nombre || 'N/A', r.libros?.titulo || 'N/A', r.estado, new Date(r.created_at).toLocaleDateString('es-CL')]);
        generatePDF('Reporte de Préstamos de Biblioteca', ['Usuario', 'Libro', 'Estado', 'Fecha'], data, 'prestamos_biblioteca');
    };

    const handleGenerateReport = async () => {
        try {
            const secret = process.env.NEXT_PUBLIC_CRON_SECRET || 'test';
            const response = await fetch('/api/monthly-report', {
                headers: { 'Authorization': `Bearer ${secret}` }
            });
            const result = await response.json();
            if (result.success) {
                alert(` Reporte Generado:\n- Mes: ${result.stats.mes}\n- Reservas: ${result.stats.totalReservas}\n- Usuarios: ${result.stats.usuariosUnicos}`);
            }
        } catch (error) {
            alert('Error al generar reporte');
        }
    };

    return (
        <div className={styles.pageContainer}>
            <Navbar user={user} onLogout={handleLogout} />
            <div className={styles.container}>
                <div className={styles.adminHeader}>
                    <div>
                        <h1 className={styles.title}>Panel de Control</h1>
                        <p className={styles.subtitle}>Gestiona la biblioteca de la iglesia</p>
                    </div>
                </div>

                <div className={styles.tabs}>
                    <button className={`${styles.tabBtn} ${activeTab === 'inicio' ? styles.active : ''}`} onClick={() => setActiveTab('inicio')}> Inicio</button>
                    <button className={`${styles.tabBtn} ${activeTab === 'reservas' ? styles.active : ''}`} onClick={() => setActiveTab('reservas')}> Préstamos</button>
                    <button className={`${styles.tabBtn} ${activeTab === 'libros' ? styles.active : ''}`} onClick={() => setActiveTab('libros')}> Inventario</button>
                    <button className={`${styles.tabBtn} ${activeTab === 'usuarios' ? styles.active : ''}`} onClick={() => setActiveTab('usuarios')}> Usuarios</button>
                    <button className={`${styles.tabBtn} ${activeTab === 'reportes' ? styles.active : ''}`} onClick={() => setActiveTab('reportes')}> Reportes</button>
                </div>

                {loading ? <div className={styles.loading}>Cargando...</div> : (
                    <>
                        {activeTab === 'inicio' && (
                            <div className={styles.dashboardGrid}>
                                <div className={styles.configCard}>
                                    <i className="bi bi-book" style={{ fontSize: '2rem', color: '#3c4d6b' }}></i>
                                    <h3>{stats.totalReservas}</h3>
                                    <p>Total de Préstamos</p>
                                </div>
                                <div className={styles.configCard}>
                                    <i className="bi bi-bookmark-check" style={{ fontSize: '2rem', color: '#28a745' }}></i>
                                    <h3>{stats.activos}</h3>
                                    <p>Préstamos Activos</p>
                                </div>
                                <div className={styles.configCard}>
                                    <i className="bi bi-people" style={{ fontSize: '2rem', color: '#17a2b8' }}></i>
                                    <h3>{stats.usuarios}</h3>
                                    <p>Usuarios Registrados</p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'reservas' && (
                            <div className={styles.tableSection}>
                                <div className={styles.tableContainer}>
                                    <table className={styles.table}>
                                        <thead><tr><th>Usuario</th><th>Libro</th><th>Estado</th><th>Acciones</th></tr></thead>
                                        <tbody>
                                            {reservas.map(res => (
                                                <tr key={res.id}>
                                                    <td>{res.usuario?.nombre}</td>
                                                    <td>{res.libros?.titulo}</td>
                                                    <td>{res.estado}</td>
                                                    <td>
                                                        <div className={styles.actionButtons}>
                                                            <button 
                                                                onClick={() => handleSendReminder(res.id)}
                                                                className={styles.btnReminder}
                                                                title="Enviar recordatorio por email"
                                                            >
                                                                <i className="bi bi-envelope"></i>
                                                            </button>
                                                            <button 
                                                                onClick={() => { 
                                                                    if(confirm('¿Eliminar esta reserva?')) {
                                                                        eliminarReserva(res.id, res.libro_id).then(({error}) => {
                                                                            if (error) alert('Error: ' + error.message);
                                                                            else fetchReservas();
                                                                        });
                                                                    }
                                                                }} 
                                                                className={styles.btnDelete}
                                                            >
                                                                <i className="bi bi-trash"></i>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'articulos' && (
                            <div className={styles.articlesSection}>
                                <div className={styles.formSection}>
                                    <h2>{editingArticuloId ? ' Editar Reflexión' : ' Nueva Reflexión'}</h2>
                                    <form onSubmit={handleCrearArticulo}>
                                        <input className={styles.input} value={newArticulo.titulo} onChange={e => setNewArticulo({...newArticulo, titulo: e.target.value})} placeholder="Título" required />
                                        <textarea className={styles.textarea} value={newArticulo.contenido} onChange={e => setNewArticulo({...newArticulo, contenido: e.target.value})} placeholder="Contenido" required />
                                        <input className={styles.input} value={newArticulo.autor} onChange={e => setNewArticulo({...newArticulo, autor: e.target.value})} placeholder="Autor" />
                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            <button type="submit" className={styles.submitBtn}>{publicando ? '...' : editingArticuloId ? 'Actualizar' : 'Publicar'}</button>
                                            {editingArticuloId && <button type="button" onClick={() => {setEditingArticuloId(null); setNewArticulo({titulo:'',contenido:'',autor: user?.user_metadata?.nombre || ''})}} className={styles.submitBtn} style={{backgroundColor:'#6c757d'}}>Cancelar</button>}
                                        </div>
                                    </form>
                                </div>
                                <div className={styles.listSection}>
                                    <h2> Reflexiones Publicadas</h2>
                                    <div className={styles.tableContainer}>
                                        <table className={styles.table}>
                                            <thead><tr><th>Fecha</th><th>Título</th><th>Autor</th><th>Acciones</th></tr></thead>
                                            <tbody>
                                                {articulos.map(art => (
                                                    <tr key={art.id}>
                                                        <td>{new Date(art.created_at).toLocaleDateString('es-CL')}</td>
                                                        <td>{art.titulo}</td>
                                                        <td>{art.autor || 'La Iglesia'}</td>
                                                        <td>
                                                            <div className={styles.actionButtons}>
                                                                <button onClick={() => prepareEditArticulo(art)} className={styles.btnReminder} style={{backgroundColor:'#ffc107', color:'#000'}}><i className="bi bi-pencil"></i></button>
                                                                <button 
                                                                    onClick={() => { 
                                                                        if(confirm('¿Eliminar esta reflexión?')) {
                                                                            eliminarArticulo(art.id).then(({error}) => {
                                                                                if (error) alert('Error: ' + error.message);
                                                                                else fetchArticulos();
                                                                            });
                                                                        }
                                                                    }} 
                                                                    className={styles.btnDelete}
                                                                >
                                                                    <i className="bi bi-trash"></i>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'libros' && (
                            <div className={styles.articlesSection}>
                                <div className={styles.formSection}>
                                    <h2>{editingLibroId ? ' Editar' : ' Nuevo Libro'}</h2>
                                    <form onSubmit={handleCrearLibro}>
                                        <div className={styles.formRow}>
                                            <input className={styles.input} value={newLibro.titulo} onChange={e => setNewLibro({...newLibro, titulo: e.target.value})} placeholder="Título" required />
                                            <input className={styles.input} value={newLibro.autor} onChange={e => setNewLibro({...newLibro, autor: e.target.value})} placeholder="Autor" required />
                                        </div>
                                        <div className={styles.formRow}>
                                            <input type="number" className={styles.input} value={newLibro.paginas} onChange={e => setNewLibro({...newLibro, paginas: e.target.value})} placeholder="Páginas" />
                                            <input type="number" className={styles.input} value={newLibro.cantidad} onChange={e => setNewLibro({...newLibro, cantidad: e.target.value})} placeholder="Stock" min="0" />
                                        </div>
                                        <input className={styles.input} value={newLibro.imagen_url} onChange={e => setNewLibro({...newLibro, imagen_url: e.target.value})} placeholder="URL Imagen Portada" />
                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            <button type="submit" className={styles.submitBtn} disabled={guardandoLibro}>{editingLibroId ? 'Actualizar' : 'Guardar'}</button>
                                            {editingLibroId && <button type="button" onClick={() => {setEditingLibroId(null); setNewLibro({titulo:'',autor:'',paginas:'',cantidad:1,imagen_url:'',disponible:true})}} className={styles.submitBtn} style={{backgroundColor:'#6c757d'}}>Cancelar</button>}
                                        </div>
                                    </form>
                                </div>
                                <div className={styles.listSection}>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <input 
                                            type="text" 
                                            placeholder="Buscar libro por nombre o autor..." 
                                            className={styles.input} 
                                            value={busquedaLibro} 
                                            onChange={(e) => setBusquedaLibro(e.target.value)} 
                                        />
                                    </div>
                                    <div className={styles.tableContainer}>
                                        <table className={styles.table}>
                                            <thead><tr><th>Portada</th><th>Libro</th><th>Stock</th><th>Acciones</th></tr></thead>
                                            <tbody>
                                                {libros.filter(libro => {
                                                    const normalize = (str) => (str || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                                                    const search = normalize(busquedaLibro);
                                                    const titulo = normalize(libro.titulo);
                                                    const autor = normalize(libro.autor);
                                                    return titulo.includes(search) || autor.includes(search);
                                                }).map(libro => (
                                                    <tr key={libro.id}>
                                                        <td>{libro.imagen_url ? <img src={libro.imagen_url} alt="P" style={{ width: '40px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} /> : 'Sin foto'}</td>
                                                        <td>
                                                            <div style={{ fontWeight: '500' }}>{libro.titulo}</div>
                                                            <div style={{ fontSize: '0.85rem', color: '#6c757d' }}>{libro.autor}</div>
                                                        </td>
                                                        <td>{libro.cantidad}</td>
                                                        <td>
                                                            <div className={styles.actionButtons}>
                                                                <button onClick={() => prepareEditLibro(libro)} className={styles.btnReminder} style={{backgroundColor:'#ffc107', color:'#000'}}><i className="bi bi-pencil"></i></button>
                                                                <button 
                                                                    onClick={() => {
                                                                        if(confirm('¿Eliminar este libro?')) {
                                                                            eliminarLibro(libro.id).then(({error}) => {
                                                                                if (error) alert('No se pudo eliminar el libro: ' + error.message);
                                                                                else fetchLibros();
                                                                            });
                                                                        }
                                                                    }} 
                                                                    className={styles.btnDelete}
                                                                >
                                                                    <i className="bi bi-trash"></i>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'configuracion' && (
                            <div className={styles.configSection}>
                                <div className={styles.sitioGrid}>
                                    <div className={styles.configCard}>
                                        <h3> Inicio - Hero</h3>
                                        <p>Título Principal (Hero)</p>
                                        <textarea 
                                            className={styles.textarea} 
                                            value={config.inicio_hero_titulo || ''} 
                                            onChange={e => setConfig({...config, inicio_hero_titulo: e.target.value})}
                                            onBlur={e => handleSaveConfig('inicio_hero_titulo', e.target.value)}
                                            placeholder="BIENVENIDOS..."
                                        />
                                        <p>Resumen Misión</p>
                                        <textarea 
                                            className={styles.textarea} 
                                            value={config.inicio_mision_resumen || ''} 
                                            onChange={e => setConfig({...config, inicio_mision_resumen: e.target.value})}
                                            onBlur={e => handleSaveConfig('inicio_mision_resumen', e.target.value)}
                                            placeholder="Somos una iglesia..."
                                        />
                                    </div>

                                    <div className={styles.configCard}>
                                        <h3> Videos (YouTube)</h3>
                                        <div className={styles.configField}>
                                            <label>Servicio Dominical</label>
                                            <div className={styles.inputGroup}>
                                                <input 
                                                    className={styles.input} 
                                                    value={config.video_dominical || ''} 
                                                    onChange={e => setConfig({...config, video_dominical: e.target.value})}
                                                    placeholder="Enlace de YouTube o Lista"
                                                />
                                                <button onClick={() => handleSaveConfig('video_dominical', config.video_dominical)} className={styles.btnSave}>Guardar</button>
                                            </div>
                                        </div>

                                        <div className={styles.configField}>
                                            <label>El Credo</label>
                                            <div className={styles.inputGroup}>
                                                <input 
                                                    className={styles.input} 
                                                    value={config.video_credo || ''} 
                                                    onChange={e => setConfig({...config, video_credo: e.target.value})}
                                                />
                                                <button onClick={() => handleSaveConfig('video_credo', config.video_credo)} className={styles.btnSave}>Guardar</button>
                                            </div>
                                        </div>

                                        <div className={styles.configField}>
                                            <label>Estudio Bíblico</label>
                                            <div className={styles.inputGroup}>
                                                <input 
                                                    className={styles.input} 
                                                    value={config.video_estudio || ''} 
                                                    onChange={e => setConfig({...config, video_estudio: e.target.value})}
                                                />
                                                <button onClick={() => handleSaveConfig('video_estudio', config.video_estudio)} className={styles.btnSave}>Guardar</button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles.configCard}>
                                        <h3> Horarios y Encuentros</h3>
                                        <p>Miércoles (Oración)</p>
                                        <input 
                                            className={styles.input} 
                                            value={config.horario_miercoles || ''} 
                                            onChange={e => setConfig({...config, horario_miercoles: e.target.value})}
                                            onBlur={e => handleSaveConfig('horario_miercoles', e.target.value)}
                                        />
                                        <p>Domingo (Servicio)</p>
                                        <input 
                                            className={styles.input} 
                                            value={config.horario_domingo || ''} 
                                            onChange={e => setConfig({...config, horario_domingo: e.target.value})}
                                            onBlur={e => handleSaveConfig('horario_domingo', e.target.value)}
                                        />
                                    </div>

                                    <div className={styles.configCard}>
                                        <h3> Nosotros</h3>
                                        <p>Quiénes Somos</p>
                                        <textarea 
                                            className={styles.textarea} 
                                            value={config.nosotros_quienes_somos || ''} 
                                            onChange={e => setConfig({...config, nosotros_quienes_somos: e.target.value})}
                                            onBlur={e => handleSaveConfig('nosotros_quienes_somos', e.target.value)}
                                        />
                                        <p>Visión</p>
                                        <textarea 
                                            className={styles.textarea} 
                                            value={config.nosotros_vision || ''} 
                                            onChange={e => setConfig({...config, nosotros_vision: e.target.value})}
                                            onBlur={e => handleSaveConfig('nosotros_vision', e.target.value)}
                                        />
                                        <p>Misión</p>
                                        <textarea 
                                            className={styles.textarea} 
                                            value={config.nosotros_mision || ''} 
                                            onChange={e => setConfig({...config, nosotros_mision: e.target.value})}
                                            onBlur={e => handleSaveConfig('nosotros_mision', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div style={{ marginTop: '2rem', textAlign: 'center', color: '#666', fontSize: '0.9rem' }}>
                                    {guardandoConfig ? ' Guardando cambios...' : ' Los cambios se guardan automáticamente al salir del campo'}
                                </div>
                            </div>
                        )}

                        {activeTab === 'ministerios' && (
                            <div className={styles.articlesSection}>
                                <div className={styles.formSection}>
                                    <h2>{editingMinisterioId ? ' Editar Ministerio' : ' Nuevo Ministerio'}</h2>
                                    <form onSubmit={handleCrearMinisterio}>
                                        <div className={styles.formRow}>
                                            <input className={styles.input} value={newMinisterio.nombre} onChange={e => setNewMinisterio({...newMinisterio, nombre: e.target.value})} placeholder="Nombre del Ministerio" required />
                                            <input className={styles.input} value={newMinisterio.encargado} onChange={e => setNewMinisterio({...newMinisterio, encargado: e.target.value})} placeholder="Encargado" required />
                                        </div>
                                        <textarea className={styles.textarea} value={newMinisterio.descripcion} onChange={e => setNewMinisterio({...newMinisterio, descripcion: e.target.value})} placeholder="Descripción" required />
                                        <div className={styles.formRow}>
                                            <select className={styles.input} value={newMinisterio.categoria} onChange={e => setNewMinisterio({...newMinisterio, categoria: e.target.value})}>
                                                <option value="pastoral">Pastoral</option>
                                                <option value="general">General</option>
                                                <option value="mision">Misión</option>
                                            </select>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ fontSize: '0.8rem', color: '#666', display: 'block', marginBottom: '0.2rem' }}>Imagen del Ministerio:</label>
                                                <label htmlFor="ministerioImagen" className={styles.fileUploadLabel}>
                                                    <i className="bi bi-image"></i>
                                                    {archivoImagen ? archivoImagen.name : (editingMinisterioId ? 'Cambiar Imagen' : 'Seleccionar Imagen')}
                                                </label>
                                                <input 
                                                    id="ministerioImagen"
                                                    type="file" 
                                                    accept="image/*"
                                                    className={styles.fileInputHidden} 
                                                    onChange={e => setArchivoImagen(e.target.files[0])} 
                                                />
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            <button type="submit" className={styles.submitBtn} disabled={guardandoMinisterio || subiendoImagen}>
                                                {subiendoImagen ? 'Subiendo...' : (editingMinisterioId ? 'Actualizar' : 'Crear')}
                                            </button>
                                            {editingMinisterioId && <button type="button" onClick={() => {setEditingMinisterioId(null); setNewMinisterio({nombre:'',descripcion:'',encargado:'',categoria:'general',icono:'bi-star'})}} className={styles.submitBtn} style={{backgroundColor:'#6c757d'}}>Cancelar</button>}
                                        </div>
                                    </form>
                                </div>
                                <div className={styles.listSection}>
                                    <h2> Ministerios Registrados</h2>
                                    <div className={styles.tableContainer}>
                                        <table className={styles.table}>
                                            <thead><tr><th>Nombre</th><th>Encargado</th><th>Categoría</th><th>Acciones</th></tr></thead>
                                            <tbody>
                                                {ministerios.map(m => (
                                                    <tr key={m.id}>
                                                        <td>{m.nombre}</td>
                                                        <td>{m.encargado}</td>
                                                        <td>{m.categoria}</td>
                                                        <td>
                                                            <div className={styles.actionButtons}>
                                                                <button onClick={() => prepareEditMinisterio(m)} className={styles.btnReminder} style={{backgroundColor:'#ffc107', color:'#000'}}><i className="bi bi-pencil"></i></button>
                                                                <button 
                                                                    onClick={() => { 
                                                                        if(confirm('¿Eliminar este ministerio?')) {
                                                                            eliminarMinisterio(m.id).then(({error}) => {
                                                                                if (error) alert('Error: ' + error.message);
                                                                                else fetchMinisterios();
                                                                            });
                                                                        }
                                                                    }} 
                                                                    className={styles.btnDelete}
                                                                >
                                                                    <i className="bi bi-trash"></i>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'usuarios' && (
                            <div className={styles.articlesSection}>
                                <div className={styles.listSection}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h2> Gestión de Usuarios</h2>
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                            <i className="bi bi-search" style={{ color: '#666' }}></i>
                                            <input 
                                                type="text" 
                                                placeholder="Buscar usuario por nombre o email..." 
                                                className={styles.input} 
                                                style={{ maxWidth: '300px', margin: 0 }}
                                                value={busquedaUsuario} 
                                                onChange={(e) => setBusquedaUsuario(e.target.value)} 
                                            />
                                        </div>
                                    </div>
                                    <div className={styles.tableContainer}>
                                        <table className={styles.table}>
                                            <thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Acciones</th></tr></thead>
                                            <tbody>
                                                {usuarios.filter(u => {
                                                    const search = busquedaUsuario.toLowerCase();
                                                    return u.nombre.toLowerCase().includes(search) || u.email.toLowerCase().includes(search);
                                                }).map(u => (
                                                    <tr key={u.id}>
                                                        <td>{u.nombre}</td>
                                                        <td>{u.email}</td>
                                                        <td>
                                                            <span style={{ 
                                                                padding: '4px 12px', 
                                                                borderRadius: '20px', 
                                                                fontSize: '0.8rem',
                                                                fontWeight: 'bold',
                                                                backgroundColor: u.rol === 'admin' ? '#3c4d6b' : '#e9ecef',
                                                                color: u.rol === 'admin' ? 'white' : '#495057'
                                                            }}>
                                                                {u.rol === 'admin' ? ' ADMIN' : ' USUARIO'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <button 
                                                                className={styles.btnDanger}
                                                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                                                                disabled={actualizandoRol === u.id || u.id === user.id}
                                                                onClick={() => handleDeleteUser(u.id)}
                                                            >
                                                                <i className="bi bi-trash"></i> Eliminar
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'reportes' && (
                            <div className={styles.dashboardGrid}>
                                <div className={styles.configCard} style={{ cursor: 'pointer' }} onClick={handleReportInventario}>
                                    <i className="bi bi-file-pdf" style={{ fontSize: '2.5rem', color: '#dc3545' }}></i>
                                    <h3>Inventario</h3>
                                    <p>Descargar lista de libros</p>
                                </div>
                                <div className={styles.configCard} style={{ cursor: 'pointer' }} onClick={handleReportPrestamos}>
                                    <i className="bi bi-file-pdf" style={{ fontSize: '2.5rem', color: '#dc3545' }}></i>
                                    <h3>Préstamos</h3>
                                    <p>Descargar historial de reservas</p>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
            <Footer />
        </div>
    );
}
