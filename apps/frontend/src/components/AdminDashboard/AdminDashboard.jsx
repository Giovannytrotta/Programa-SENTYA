import React, { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import "./AdminDashboard.css"

const AdminDashboard = () => {
    const [activeSection, setActiveSection] = useState('overview')
    const [showRegisterModal, setShowRegisterModal] = useState(false)
    const [users, setUsers] = useState([])
    const [filteredUsers, setFilteredUsers] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [loading, setLoading] = useState(false)
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        role: 'user'
    })

    const usersPerPage = 10

    // Mock data - Reemplazar con datos reales del backend
    const mockUsers = [
        { id: 1, name: 'Carlos Mendoza', email: 'carlos@example.com', role: 'admin', isOnline: true, joinDate: '2024-01-15' },
        { id: 2, name: 'Ana García', email: 'ana@example.com', role: 'user', isOnline: false, joinDate: '2024-01-20' },
        { id: 3, name: 'Miguel Torres', email: 'miguel@example.com', role: 'moderator', isOnline: true, joinDate: '2024-02-01' },
        { id: 4, name: 'Laura Ruiz', email: 'laura@example.com', role: 'user', isOnline: true, joinDate: '2024-02-05' },
        { id: 5, name: 'David López', email: 'david@example.com', role: 'user', isOnline: false, joinDate: '2024-02-10' },
        { id: 6, name: 'Sofia Martinez', email: 'sofia@example.com', role: 'admin', isOnline: true, joinDate: '2024-02-15' },
        { id: 7, name: 'Roberto Silva', email: 'roberto@example.com', role: 'user', isOnline: false, joinDate: '2024-02-20' },
        { id: 8, name: 'Isabel Morales', email: 'isabel@example.com', role: 'moderator', isOnline: true, joinDate: '2024-02-25' },
        { id: 9, name: 'Carlos Mendiola', email: 'carlos1@example.com', role: 'admin', isOnline: true, joinDate: '2024-01-15' },
        { id: 10, name: 'Ana Garca', email: 'ana1@example.com', role: 'user', isOnline: false, joinDate: '2024-01-20' },
        { id: 11, name: 'Miguel Tobex', email: 'miguel1@example.com', role: 'moderator', isOnline: true, joinDate: '2024-02-01' },
        { id: 12, name: 'Laura Rucos', email: 'laura1@example.com', role: 'user', isOnline: true, joinDate: '2024-02-05' },
        { id: 13, name: 'David chopo', email: 'david1@example.com', role: 'user', isOnline: false, joinDate: '2024-02-10' },
        { id: 14, name: 'Sofia Manguesa', email: 'sofia1@example.com', role: 'admin', isOnline: true, joinDate: '2024-02-15' },
        { id: 15, name: 'Roberto Silvias', email: 'robert1o@example.com', role: 'user', isOnline: false, joinDate: '2024-02-20' },
        { id: 16, name: 'Isabel Moragres', email: 'isabel1@example.com', role: 'moderator', isOnline: true, joinDate: '2024-02-25' },
    ]

    useEffect(() => {
        // Simular carga de datos
        setLoading(true)
        setTimeout(() => {
            setUsers(mockUsers)
            setFilteredUsers(mockUsers)
            setLoading(false)
        }, 1000)
    }, [])

    useEffect(() => {
        const filtered = users.filter(user =>
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.role.toLowerCase().includes(searchQuery.toLowerCase())
        )
        setFilteredUsers(filtered)
        setCurrentPage(1)
    }, [searchQuery, users])

    const handleRegisterSubmit = (e) => {
        e.preventDefault()
        setLoading(true)
        
        // Simular registro - Reemplazar con llamada al backend
        setTimeout(() => {
            const newUserData = {
                id: users.length + 1,
                ...newUser,
                isOnline: false,
                joinDate: new Date().toISOString().split('T')[0]
            }
            
            setUsers(prev => [...prev, newUserData])
            setNewUser({ name: '', email: '', role: 'user' })
            setShowRegisterModal(false)
            setLoading(false)
        }, 1500)
    }

    const totalPages = Math.ceil(filteredUsers.length / usersPerPage)
    const startIndex = (currentPage - 1) * usersPerPage
    const currentUsers = filteredUsers.slice(startIndex, startIndex + usersPerPage)

    const stats = {
        totalUsers: users.length,
        onlineUsers: users.filter(u => u.isOnline).length,
        admins: users.filter(u => u.role === 'admin').length,
        moderators: users.filter(u => u.role === 'moderator').length
    }

    return (
        <div className="dashboard-container">
            <div className="dynamic-bg"></div>
            
            {/* Header */}
            <header className="dashboard-header">
                <div className="header-content">
                    <div className="logo-section">
                        <div className="logo-container">
                            <div className="main-logo">AOSSA</div>
                            <div className="logo-accent"></div>
                        </div>
                        <span className="admin-label">Panel de Administración</span>
                    </div>
                    
                    <nav className="header-nav">
                        <button 
                            className={`nav-button ${activeSection === 'overview' ? 'active' : ''}`}
                            onClick={() => setActiveSection('overview')}
                        >
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.5523 5.44772 21 6 21H9M19 10L21 12M19 10V20C19 20.5523 18.5523 21 18 21H15M9 21C9.55228 21 10 20.5523 10 20V16C10 15.4477 10.4477 15 11 15H13C13.5523 15 14 15.4477 14 16V20C14 20.5523 14.4477 21 15 21M9 21H15" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                            Resumen
                        </button>
                        <button 
                            className={`nav-button ${activeSection === 'users' ? 'active' : ''}`}
                            onClick={() => setActiveSection('users')}
                        >
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2"/>
                                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                                <path d="M23 21V19C23 18.1645 22.7155 17.3541 22.2094 16.7138C21.7033 16.0736 20.9983 15.6434 20.2 15.5" stroke="currentColor" strokeWidth="2"/>
                                <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 18.9018 6.11683 18.6947 6.9353C18.4875 7.75377 17.9965 8.45677 17.3103 8.91398C16.6241 9.3712 15.7909 9.55117 14.99 9.42" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                            Usuarios
                        </button>
                    </nav>

                    <div className="header-actions">
                        <Link to="/aossadmin/auth2fa" className="settings-button">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                                <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                        </Link>
                        <button className="logout-button">Salir</button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="dashboard-main">
                <div className="main-content">
                    {activeSection === 'overview' && (
                        <div className="overview-section">
                            <div className="section-header">
                                <h1 className="section-title">Panel de Control</h1>
                                <p className="section-subtitle">Gestiona tu aplicación desde aquí</p>
                            </div>

                            <div className="stats-grid">
                                <div className="stat-card">
                                    <div className="stat-icon users-icon">
                                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2"/>
                                            <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                                            <path d="M23 21V19C23 18.1645 22.7155 17.3541 22.2094 16.7138C21.7033 16.0736 20.9983 15.6434 20.2 15.5" stroke="currentColor" strokeWidth="2"/>
                                        </svg>
                                    </div>
                                    <div className="stat-info">
                                        <span className="stat-number">{stats.totalUsers}</span>
                                        <span className="stat-label">Total Usuarios</span>
                                    </div>
                                </div>

                                <div className="stat-card">
                                    <div className="stat-icon online-icon">
                                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                                            <path d="M8 14S9.5 16 12 16 16 14 16 14" stroke="currentColor" strokeWidth="2"/>
                                            <circle cx="9" cy="9" r="1" fill="currentColor"/>
                                            <circle cx="15" cy="9" r="1" fill="currentColor"/>
                                        </svg>
                                    </div>
                                    <div className="stat-info">
                                        <span className="stat-number">{stats.onlineUsers}</span>
                                        <span className="stat-label">En Línea</span>
                                    </div>
                                </div>

                                <div className="stat-card">
                                    <div className="stat-icon admin-icon">
                                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z" stroke="currentColor" strokeWidth="2"/>
                                        </svg>
                                    </div>
                                    <div className="stat-info">
                                        <span className="stat-number">{stats.admins}</span>
                                        <span className="stat-label">Administradores</span>
                                    </div>
                                </div>

                                <div className="stat-card">
                                    <div className="stat-icon mod-icon">
                                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2"/>
                                            <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2"/>
                                        </svg>
                                    </div>
                                    <div className="stat-info">
                                        <span className="stat-number">{stats.moderators}</span>
                                        <span className="stat-label">Moderadores</span>
                                    </div>
                                </div>
                            </div>

                            <div className="action-cards">
                                <div className="action-card primary">
                                    <div className="action-content">
                                        <div className="action-icon">
                                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2"/>
                                                <circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                                                <line x1="20" y1="8" x2="20" y2="14" stroke="currentColor" strokeWidth="2"/>
                                                <line x1="23" y1="11" x2="17" y2="11" stroke="currentColor" strokeWidth="2"/>
                                            </svg>
                                        </div>
                                        <h3>Registrar Usuario</h3>
                                        <p>Añade nuevos usuarios al sistema con diferentes roles y permisos</p>
                                    </div>
                                    <button 
                                        className="action-button"
                                        onClick={() => setShowRegisterModal(true)}
                                    >
                                        Nuevo Usuario
                                    </button>
                                </div>

                                <div className="action-card secondary">
                                    <div className="action-content">
                                        <div className="action-icon">
                                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M8 6H21" stroke="currentColor" strokeWidth="2"/>
                                                <path d="M8 12H21" stroke="currentColor" strokeWidth="2"/>
                                                <path d="M8 18H21" stroke="currentColor" strokeWidth="2"/>
                                                <path d="M3 6H3.01" stroke="currentColor" strokeWidth="2"/>
                                                <path d="M3 12H3.01" stroke="currentColor" strokeWidth="2"/>
                                                <path d="M3 18H3.01" stroke="currentColor" strokeWidth="2"/>
                                            </svg>
                                        </div>
                                        <h3>Gestionar Usuarios</h3>
                                        <p>Ve, edita y administra todos los usuarios registrados en la plataforma</p>
                                    </div>
                                    <button 
                                        className="action-button"
                                        onClick={() => setActiveSection('users')}
                                    >
                                        Ver Lista
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'users' && (
                        <div className="users-section">
                            <div className="section-header">
                                <div className="header-left">
                                    <h1 className="section-title">Gestión de Usuarios</h1>
                                    <p className="section-subtitle">Administra y supervisa todos los usuarios</p>
                                </div>
                                <button 
                                    className="add-user-button"
                                    onClick={() => setShowRegisterModal(true)}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2"/>
                                        <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2"/>
                                    </svg>
                                    Añadir Usuario
                                </button>
                            </div>

                            <div className="users-controls">
                                <div className="search-container">
                                    <svg className="search-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                                        <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2"/>
                                    </svg>
                                    <input
                                        type="text"
                                        placeholder="Buscar por nombre, email o rol..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="search-input"
                                    />
                                </div>

                                <div className="results-info">
                                    <span>{filteredUsers.length} usuario{filteredUsers.length !== 1 ? 's' : ''} encontrado{filteredUsers.length !== 1 ? 's' : ''}</span>
                                </div>
                            </div>

                            {loading ? (
                                <div className="loading-container">
                                    <div className="spinner-large"></div>
                                    <span>Cargando usuarios...</span>
                                </div>
                            ) : (
                                <>
                                    <div className="users-table-container">
                                        <table className="users-table">
                                            <thead>
                                                <tr>
                                                    <th>Usuario</th>
                                                    <th>Email</th>
                                                    <th>Rol</th>
                                                    <th>Estado</th>
                                                    <th>Registro</th>
                                                    <th>Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {currentUsers.map(user => (
                                                    <tr key={user.id} className="user-row">
                                                        <td className="user-info">
                                                            <div className="user-avatar">
                                                                {user.name.split(' ').map(n => n[0]).join('')}
                                                            </div>
                                                            <span className="user-name">{user.name}</span>
                                                        </td>
                                                        <td className="user-email">{user.email}</td>
                                                        <td>
                                                            <span className={`role-badge ${user.role}`}>
                                                                {user.role === 'admin' ? 'Admin' : 
                                                                 user.role === 'moderator' ? 'Moderador' : 'Usuario'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div className="status-indicator">
                                                                <div className={`status-dot ${user.isOnline ? 'online' : 'offline'}`}></div>
                                                                <span className="status-text">
                                                                    {user.isOnline ? 'En línea' : 'Desconectado'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="join-date">{user.joinDate}</td>
                                                        <td className="user-actions">
                                                            <button className="action-btn edit">
                                                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                    <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2"/>
                                                                    <path d="M18.5 2.49998C18.8978 2.10216 19.4374 1.87866 20 1.87866C20.5626 1.87866 21.1022 2.10216 21.5 2.49998C21.8978 2.89781 22.1213 3.43737 22.1213 3.99998C22.1213 4.56259 21.8978 5.10216 21.5 5.49998L12 15L8 16L9 12L18.5 2.49998Z" stroke="currentColor" strokeWidth="2"/>
                                                                </svg>
                                                            </button>
                                                            <button className="action-btn delete">
                                                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                    <polyline points="3,6 5,6 21,6" stroke="currentColor" strokeWidth="2"/>
                                                                    <path d="M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6" stroke="currentColor" strokeWidth="2"/>
                                                                </svg>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {totalPages > 1 && (
                                        <div className="pagination">
                                            <button 
                                                className="pagination-btn"
                                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                disabled={currentPage === 1}
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <polyline points="15,18 9,12 15,6" stroke="currentColor" strokeWidth="2"/>
                                                </svg>
                                            </button>
                                            
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                                <button
                                                    key={page}
                                                    className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                                                    onClick={() => setCurrentPage(page)}
                                                >
                                                    {page}
                                                </button>
                                            ))}
                                            
                                            <button 
                                                className="pagination-btn"
                                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                disabled={currentPage === totalPages}
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <polyline points="9,18 15,12 9,6" stroke="currentColor" strokeWidth="2"/>
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* Modal de registro de usuario */}
            {showRegisterModal && (
                <div className="modal-overlay">
                    <div className="modal-container">
                        <div className="modal-header">
                            <h2>Registrar Nuevo Usuario</h2>
                            <button 
                                className="close-button"
                                onClick={() => setShowRegisterModal(false)}
                            >
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2"/>
                                    <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2"/>
                                </svg>
                            </button>
                        </div>
                        
                        <form onSubmit={handleRegisterSubmit} className="register-form">
                            <div className="form-group">
                                <label htmlFor="name">Nombre completo</label>
                                <input
                                    type="text"
                                    id="name"
                                    required
                                    value={newUser.name}
                                    onChange={(e) => setNewUser(prev => ({...prev, name: e.target.value}))}
                                    placeholder="Nombre del usuario"
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="email">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    required
                                    value={newUser.email}
                                    onChange={(e) => setNewUser(prev => ({...prev, email: e.target.value}))}
                                    placeholder="email@ejemplo.com"
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="role">Rol</label>
                                <select
                                    id="role"
                                    value={newUser.role}
                                    onChange={(e) => setNewUser(prev => ({...prev, role: e.target.value}))}
                                >
                                    <option value="user">Usuario</option>
                                    <option value="moderator">Moderador</option>
                                    <option value="admin">Administrador</option>
                                </select>
                            </div>
                            
                            <div className="modal-actions">
                                <button 
                                    type="button" 
                                    className="cancel-button"
                                    onClick={() => setShowRegisterModal(false)}
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    className="submit-button"
                                    disabled={loading}
                                >
                                    {loading ? <div className="spinner"></div> : 'Crear Usuario'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminDashboard;