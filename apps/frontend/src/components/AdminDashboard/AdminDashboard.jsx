import React, { useState, useEffect, useCallback } from "react"
import { Link } from "react-router-dom"
import "./AdminDashboard.css"
import ExitToggle from "./ExitToggle"
import EditUserModal from "./EditUserModal"
import { useAdminUsers } from "../../hooks/useAdminUsers"

const AdminDashboard = () => {
    const [activeSection, setActiveSection] = useState('overview')
    const [showRegisterModal, setShowRegisterModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [selectedUser, setSelectedUser] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [roleFilter, setRoleFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')
    const [currentPage, setCurrentPage] = useState(1)
    const [currentStep, setCurrentStep] = useState(1)
    
    // Estado para responsive
    const [isMobile, setIsMobile] = useState(false)
    
    // Hook para manejo de usuarios
    const {
        users,
        filteredUsers,
        roles,
        loading,
        stats,
        createUser,
        updateUser,
        updateUserStatus,
        deleteUser,
        filterUsers
    } = useAdminUsers();
    
    const [newUser, setNewUser] = useState({
        name: '',
        last_name: '',
        email: '',
        dni: '',
        birth_date: '',
        age: '',
        phone: '',
        rol: 'client',
        password: ''
    })

    const usersPerPage = isMobile ? 5 : 10
    const totalSteps = 3

    // Detectar tamaño de pantalla
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768)
        }

        handleResize()
        window.addEventListener('resize', handleResize)
        
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // Función para calcular la edad automáticamente
    const calculateAge = useCallback((birthDate) => {
        if (!birthDate) return ''
        const today = new Date()
        const birth = new Date(birthDate)
        let age = today.getFullYear() - birth.getFullYear()
        const monthDiff = today.getMonth() - birth.getMonth()
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--
        }
        
        return age.toString()
    }, [])

    // Función para generar contraseña aleatoria
    const generateRandomPassword = useCallback(() => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
        let password = ''
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return password
    }, [])

    // Navegación entre pasos
    const nextStep = useCallback(() => {
        if (currentStep < totalSteps) {
            setCurrentStep(prev => prev + 1)
        }
    }, [currentStep, totalSteps])

    const prevStep = useCallback(() => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1)
        }
    }, [currentStep])

    // Validación por paso
    const validateStep = useCallback((step) => {
        switch (step) {
            case 1:
                return newUser.name && newUser.last_name && newUser.dni && newUser.birth_date
            case 2:
                return newUser.email && newUser.phone
            case 3:
                return newUser.rol && newUser.password
            default:
                return false
        }
    }, [newUser])

    // Reiniciar formulario
    const resetForm = useCallback(() => {
        setNewUser({ 
            name: '', 
            last_name: '', 
            email: '', 
            dni: '', 
            birth_date: '', 
            age: '', 
            phone: '', 
            rol: 'client',
            password: ''
        })
        setCurrentStep(1)
    }, [])

    // Función para obtener el nombre del rol en español
    const getRoleName = useCallback((role) => {
        const roleNames = {
            'administrator': 'Administrador',
            'coordinator': 'Coordinador', 
            'professional': 'Profesor',
            'css_technician': 'Trabajador CSS',
            'client': 'Usuario'
        }
        return roleNames[role] || role
    }, [])

    // Filtrar usuarios cuando cambian los filtros
    useEffect(() => {
        filterUsers(searchQuery, roleFilter, statusFilter)
        setCurrentPage(1)
    }, [searchQuery, roleFilter, statusFilter, filterUsers])

    // Limpiar búsqueda
    const clearSearch = useCallback(() => {
        setSearchQuery('')
    }, [])

    // Limpiar filtros
    const clearFilters = useCallback(() => {
        setSearchQuery('')
        setRoleFilter('all')
        setStatusFilter('all')
    }, [])

    // Manejar cambio en fecha de nacimiento y calcular edad automáticamente
    const handleBirthDateChange = useCallback((e) => {
        const birthDate = e.target.value
        const age = calculateAge(birthDate)
        setNewUser(prev => ({
            ...prev,
            birth_date: birthDate,
            age: age
        }))
    }, [calculateAge])

    // Generar contraseña automáticamente
    const handleGeneratePassword = useCallback(() => {
        const password = generateRandomPassword()
        setNewUser(prev => ({...prev, password}))
    }, [generateRandomPassword])

    // Manejar envío del formulario de registro
    const handleRegisterSubmit = useCallback(async (e) => {
        e.preventDefault()
        
        if (currentStep < totalSteps) {
            if (validateStep(currentStep)) {
                nextStep()
            }
            return
        }

        try {
            await createUser(newUser)
            resetForm()
            setShowRegisterModal(false)
        } catch (error) {
            // Los errores ya son manejados por el hook useAdminUsers
            console.error('Error creating user:', error)
        }
    }, [currentStep, totalSteps, validateStep, nextStep, newUser, createUser, resetForm])

    // Función para manejar la edición de usuarios
   const handleSaveUser = useCallback(async (userId, userData) => {
    try {
        // Una sola llamada - tu endpoint maneja todo
        await updateUser(userId, userData);
        
        setShowEditModal(false);
        setSelectedUser(null);
    } catch (error) {
        console.error('Error saving user:', error);
        throw error;
    }
}, [updateUser]); // ← Solo esta dependencia

    // Funciones para modales de edición
    const handleEditUser = useCallback((user) => {
        setSelectedUser(user)
        setShowEditModal(true)
    }, [])

    const handleDeleteUser = useCallback((user) => {
        setSelectedUser(user)
        setShowDeleteModal(true)
    }, [])

    // Confirmar eliminación
    const confirmDelete = useCallback(async (force = false) => {
        if (!selectedUser) return
        
        try {
            await deleteUser(selectedUser.id, force)
            setShowDeleteModal(false)
            setSelectedUser(null)
        } catch (error) {
            console.error('Error deleting user:', error)
        }
    }, [selectedUser, deleteUser])

    // Cambiar rol de usuario
    const handleRoleChange = useCallback(async (userId, newRole) => {
        try {
            await updateUser(userId, newRole)
        } catch (error) {
            console.error('Error updating role:', error)
        }
    }, [updateUser])

    // Cambiar estado de usuario
    const handleStatusChange = useCallback(async (userId, isActive) => {
        try {
            await updateUserStatus(userId, isActive)
        } catch (error) {
            console.error('Error updating status:', error)
        }
    }, [updateUserStatus])

    // Calcular paginación
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage)
    const startIndex = (currentPage - 1) * usersPerPage
    const currentUsers = filteredUsers.slice(startIndex, startIndex + usersPerPage)

    // Manejo de teclado para modal
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((showRegisterModal || showEditModal || showDeleteModal) && e.key === 'Escape') {
                setShowRegisterModal(false)
                setShowEditModal(false)
                setShowDeleteModal(false)
                resetForm()
                setSelectedUser(null)
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [showRegisterModal, showEditModal, showDeleteModal, resetForm])

    return (
        <div className="dashboard-container">
            <div className="dynamic-bg"></div>
            
            {/* Header */}
            <header className="dashboard-header">
                <div className="header-content">
                    <div className="logo-section">
                        <div className="logo-container">
                            <div className="main-logo">SENTYA</div>
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
                            <span>Resumen</span>
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
                            <span>Usuarios</span>
                        </button>
                    </nav>

                    <div className="header-actions">
                        <ExitToggle />
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
                                    <div className="stat-icon coord-icon">
                                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2"/>
                                            <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2"/>
                                        </svg>
                                    </div>
                                    <div className="stat-info">
                                        <span className="stat-number">{stats.coordinadores}</span>
                                        <span className="stat-label">Coordinadores</span>
                                    </div>
                                </div>

                                <div className="stat-card">
                                    <div className="stat-icon prof-icon">
                                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M22 10V6C22 5.46957 21.7893 4.96086 21.4142 4.58579C21.0391 4.21071 20.5304 4 20 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V10" stroke="currentColor" strokeWidth="2"/>
                                            <path d="M7 16H6C4.89543 16 4 15.1046 4 14V11H20V14C20 15.1046 19.1046 16 18 16H17" stroke="currentColor" strokeWidth="2"/>
                                            <path d="M12 10L8 21L10.5 17.5L12 10Z" stroke="currentColor" strokeWidth="2"/>
                                            <path d="M12 10L16 21L13.5 17.5L12 10Z" stroke="currentColor" strokeWidth="2"/>
                                        </svg>
                                    </div>
                                    <div className="stat-info">
                                        <span className="stat-number">{stats.profesores}</span>
                                        <span className="stat-label">Profesores</span>
                                    </div>
                                </div>

                                <div className="stat-card">
                                    <div className="stat-icon css-icon">
                                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="2"/>
                                            <path d="M9 9H15" stroke="currentColor" strokeWidth="2"/>
                                            <path d="M9 13H15" stroke="currentColor" strokeWidth="2"/>
                                            <path d="M9 17H13" stroke="currentColor" strokeWidth="2"/>
                                        </svg>
                                    </div>
                                    <div className="stat-info">
                                        <span className="stat-number">{stats.trabajadoresCSS}</span>
                                        <span className="stat-label">Trabajadores CSS</span>
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
                                        disabled={loading}
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
                                    disabled={loading}
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
                                        placeholder="Buscar por nombre, apellidos, email, teléfono o DNI..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="search-input"
                                        disabled={loading}
                                    />
                                    {searchQuery && (
                                        <button 
                                            className="clear-search"
                                            onClick={clearSearch}
                                            disabled={loading}
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2"/>
                                                <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2"/>
                                            </svg>
                                        </button>
                                    )}
                                </div>

                                <div className="filters-container">
                                    <div className="filter-group">
                                        <label htmlFor="roleFilter">Filtrar por rol:</label>
                                        <select
                                            id="roleFilter"
                                            value={roleFilter}
                                            onChange={(e) => setRoleFilter(e.target.value)}
                                            className="filter-select"
                                            disabled={loading}
                                        >
                                            <option value="all">Todos los roles</option>
                                            <option value="administrator">Administrador</option>
                                            <option value="coordinator">Coordinador</option>
                                            <option value="professional">Profesor</option>
                                            <option value="css_technician">Trabajador CSS</option>
                                            <option value="client">Usuario</option>
                                        </select>
                                    </div>

                                    <div className="filter-group">
                                        <label htmlFor="statusFilter">Estado:</label>
                                        <select
                                            id="statusFilter"
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className="filter-select"
                                            disabled={loading}
                                        >
                                            <option value="all">Todos</option>
                                            <option value="active">Activos</option>
                                            <option value="inactive">Inactivos</option>
                                        </select>
                                    </div>

                                    {(roleFilter !== 'all' || statusFilter !== 'all' || searchQuery) && (
                                        <button 
                                            className="clear-filters"
                                            onClick={clearFilters}
                                            disabled={loading}
                                        >
                                            Limpiar filtros
                                        </button>
                                    )}
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
                                                    <th>Teléfono</th>
                                                    <th>DNI/NIE</th>
                                                    <th>Edad</th>
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
                                                                {user.name?.charAt(0)?.toUpperCase()}{user.last_name?.charAt(0)?.toUpperCase()}
                                                            </div>
                                                            <div className="user-details">
                                                                <span className="user-name">{user.name} {user.last_name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="user-email">{user.email}</td>
                                                        <td className="user-phone">{user.phone}</td>
                                                        <td className="user-dni">{user.dni}</td>
                                                        <td className="user-age">{user.age}</td>
                                                        <td className="user-role">
                                                            <div className={`role-badge ${user.rol}`}>
                                                                <select
                                                                    value={user.rol}
                                                                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                                    disabled={loading}
                                                                    className="role-select"
                                                                >
                                                                    <option value="administrator">Administrador</option>
                                                                    <option value="coordinator">Coordinador</option>
                                                                    <option value="professional">Profesor</option>
                                                                    <option value="css_technician">Trabajador CSS</option>
                                                                    <option value="client">Usuario</option>
                                                                </select>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="status-indicator">
                                                                <button
                                                                    onClick={() => handleStatusChange(user.id, !user.is_active)}
                                                                    disabled={loading}
                                                                    style={{
                                                                        background: 'none',
                                                                        border: 'none',
                                                                        cursor: 'pointer',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '8px'
                                                                    }}
                                                                >
                                                                    <div className={`status-dot ${user.is_active ? 'online' : 'offline'}`}></div>
                                                                    <span className="status-text">
                                                                        {user.is_active ? 'Activo' : 'Inactivo'}
                                                                    </span>
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td className="join-date">
                                                            {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                                                        </td>
                                                        <td className="user-actions">
                                                            <button 
                                                                className="action-btn edit"
                                                                onClick={() => handleEditUser(user)}
                                                                disabled={loading}
                                                                title="Editar usuario"
                                                            >
                                                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                    <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2"/>
                                                                    <path d="M18.5 2.49998C18.8978 2.10216 19.4374 1.87866 20 1.87866C20.5626 1.87866 21.1022 2.10216 21.5 2.49998C21.8978 2.89781 22.1213 3.43737 22.1213 3.99998C22.1213 4.56259 21.8978 5.10216 21.5 5.49998L12 15L8 16L9 12L18.5 2.49998Z" stroke="currentColor" strokeWidth="2"/>
                                                                </svg>
                                                            </button>
                                                            <button 
                                                                className="action-btn delete"
                                                                onClick={() => handleDeleteUser(user)}
                                                                disabled={loading}
                                                                title="Eliminar usuario"
                                                            >
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
                                                disabled={currentPage === 1 || loading}
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <polyline points="15,18 9,12 15,6" stroke="currentColor" strokeWidth="2"/>
                                                </svg>
                                            </button>
                                            
                                            {Array.from({ length: Math.min(totalPages, isMobile ? 3 : 5) }, (_, i) => {
                                                let pageNum;
                                                if (totalPages <= (isMobile ? 3 : 5)) {
                                                    pageNum = i + 1;
                                                } else if (currentPage <= (isMobile ? 2 : 3)) {
                                                    pageNum = i + 1;
                                                } else if (currentPage >= totalPages - (isMobile ? 1 : 2)) {
                                                    pageNum = totalPages - (isMobile ? 2 : 4) + i;
                                                } else {
                                                    pageNum = currentPage - (isMobile ? 1 : 2) + i;
                                                }
                                                
                                                return (
                                                    <button
                                                        key={pageNum}
                                                        className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                                                        onClick={() => setCurrentPage(pageNum)}
                                                        disabled={loading}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                            
                                            <button 
                                                className="pagination-btn"
                                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                disabled={currentPage === totalPages || loading}
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
                            <div className="modal-title-section">
                                <h2>Registrar Nuevo Usuario</h2>
                                <span className="step-indicator">Paso {currentStep} de {totalSteps}</span>
                            </div>
                            <button 
                                className="close-button"
                                onClick={() => {
                                    setShowRegisterModal(false)
                                    resetForm()
                                }}
                                disabled={loading}
                            >
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2"/>
                                    <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2"/>
                                </svg>
                            </button>
                        </div>

                        {/* Indicador de progreso */}
                        <div className="progress-indicator">
                            {[1, 2, 3].map((step) => (
                                <div key={step} className="progress-step-container">
                                    <div className={`progress-step ${currentStep >= step ? 'active' : ''} ${currentStep > step ? 'completed' : ''}`}>
                                        {currentStep > step ? (
                                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2"/>
                                            </svg>
                                        ) : (
                                            <span>{step}</span>
                                        )}
                                    </div>
                                    <span className="progress-label">
                                        {step === 1 && 'Datos Personales'}
                                        {step === 2 && 'Contacto'}
                                        {step === 3 && 'Cuenta'}
                                    </span>
                                    {step < totalSteps && <div className={`progress-line ${currentStep > step ? 'completed' : ''}`}></div>}
                                </div>
                            ))}
                        </div>
                        
                        <form onSubmit={handleRegisterSubmit} className="register-form">
                            {/* Paso 1: Datos Personales */}
                            {currentStep === 1 && (
                                <div className="form-step">
                                    <div className="step-header">
                                        <h3>Información Personal</h3>
                                        <p>Ingresa los datos personales del usuario</p>
                                    </div>
                                    
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="name">Nombre *</label>
                                            <input
                                                type="text"
                                                id="name"
                                                required
                                                value={newUser.name}
                                                onChange={(e) => setNewUser(prev => ({...prev, name: e.target.value}))}
                                                placeholder="Nombre"
                                                disabled={loading}
                                            />
                                        </div>
                                        
                                        <div className="form-group">
                                            <label htmlFor="last_name">Apellidos *</label>
                                            <input
                                                type="text"
                                                id="last_name"
                                                required
                                                value={newUser.last_name}
                                                onChange={(e) => setNewUser(prev => ({...prev, last_name: e.target.value}))}
                                                placeholder="Apellidos"
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="dni">DNI/NIE *</label>
                                            <input
                                                type="text"
                                                id="dni"
                                                required
                                                value={newUser.dni}
                                                onChange={(e) => setNewUser(prev => ({...prev, dni: e.target.value}))}
                                                placeholder="12345678A"
                                                maxLength="9"
                                                disabled={loading}
                                            />
                                        </div>
                                        
                                        <div className="form-group">
                                            <label htmlFor="birth_date">Fecha de Nacimiento *</label>
                                            <input
                                                type="date"
                                                id="birth_date"
                                                required
                                                value={newUser.birth_date}
                                                onChange={handleBirthDateChange}
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="age">Edad</label>
                                        <input
                                            type="number"
                                            id="age"
                                            value={newUser.age}
                                            readOnly
                                            placeholder="Se calcula automáticamente"
                                            className="readonly-input"
                                        />
                                        <small className="form-note">La edad se calcula automáticamente</small>
                                    </div>
                                </div>
                            )}

                            {/* Paso 2: Datos de Contacto */}
                            {currentStep === 2 && (
                                <div className="form-step">
                                    <div className="step-header">
                                        <h3>Información de Contacto</h3>
                                        <p>Proporciona los datos de contacto del usuario</p>
                                    </div>
                                    
                                    <div className="form-group">
                                        <label htmlFor="email">Correo Electrónico *</label>
                                        <input
                                            type="email"
                                            id="email"
                                            required
                                            value={newUser.email}
                                            onChange={(e) => setNewUser(prev => ({...prev, email: e.target.value}))}
                                            placeholder="email@ejemplo.com"
                                            disabled={loading}
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label htmlFor="phone">Número de Teléfono *</label>
                                        <input
                                            type="tel"
                                            id="phone"
                                            required
                                            value={newUser.phone}
                                            onChange={(e) => setNewUser(prev => ({...prev, phone: e.target.value}))}
                                            placeholder="666123456"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Paso 3: Configuración de Cuenta */}
                            {currentStep === 3 && (
                                <div className="form-step">
                                    <div className="step-header">
                                        <h3>Configuración de Cuenta</h3>
                                        <p>Define el rol y contraseña del usuario</p>
                                    </div>
                                    
                                    <div className="form-group">
                                        <label htmlFor="rol">Rol del Usuario *</label>
                                        <select
                                            id="rol"
                                            value={newUser.rol}
                                            onChange={(e) => setNewUser(prev => ({...prev, rol: e.target.value}))}
                                            disabled={loading}
                                        >
                                            <option value="client">Usuario</option>
                                            <option value="css_technician">Trabajador CSS</option>
                                            <option value="professional">Profesor</option>
                                            <option value="coordinator">Coordinador</option>
                                            <option value="administrator">Administrador</option>
                                        </select>
                                    </div>

                                    <div className="form-group password-group">
                                        <label htmlFor="password">Contraseña Temporal *</label>
                                        <div className="password-input-container">
                                            <input
                                                type="text"
                                                id="password"
                                                required
                                                value={newUser.password}
                                                onChange={(e) => setNewUser(prev => ({...prev, password: e.target.value}))}
                                                placeholder="Contraseña generada automáticamente"
                                                disabled={loading}
                                            />
                                            <button 
                                                type="button" 
                                                className="generate-password-btn"
                                                onClick={handleGeneratePassword}
                                                disabled={loading}
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M1 4V10H7" stroke="currentColor" strokeWidth="2"/>
                                                    <path d="M23 20V14H17" stroke="currentColor" strokeWidth="2"/>
                                                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14L18.36 18.36A9 9 0 0 1 3.51 15" stroke="currentColor" strokeWidth="2"/>
                                                </svg>
                                                Generar
                                            </button>
                                        </div>
                                        <small className="password-note">
                                            El usuario deberá cambiar esta contraseña en su primer inicio de sesión
                                        </small>
                                    </div>

                                    {/* Resumen de datos */}
                                    <div className="user-summary">
                                        <h4>Resumen del Usuario</h4>
                                        <div className="summary-grid">
                                            <div className="summary-item">
                                                <span className="summary-label">Nombre:</span>
                                                <span className="summary-value">{newUser.name} {newUser.last_name}</span>
                                            </div>
                                            <div className="summary-item">
                                                <span className="summary-label">Email:</span>
                                                <span className="summary-value">{newUser.email}</span>
                                            </div>
                                            <div className="summary-item">
                                                <span className="summary-label">Teléfono:</span>
                                                <span className="summary-value">{newUser.phone}</span>
                                            </div>
                                            <div className="summary-item">
                                                <span className="summary-label">DNI:</span>
                                                <span className="summary-value">{newUser.dni}</span>
                                            </div>
                                            <div className="summary-item">
                                                <span className="summary-label">Edad:</span>
                                                <span className="summary-value">{newUser.age} años</span>
                                            </div>
                                            <div className="summary-item">
                                                <span className="summary-label">Rol:</span>
                                                <span className="summary-value">{getRoleName(newUser.rol)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {/* Navegación del formulario */}
                            <div className="form-navigation">
                                <div className="nav-buttons">
                                    {currentStep > 1 && (
                                        <button 
                                            type="button" 
                                            className="nav-button prev-button"
                                            onClick={prevStep}
                                            disabled={loading}
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <polyline points="15,18 9,12 15,6" stroke="currentColor" strokeWidth="2"/>
                                            </svg>
                                            Anterior
                                        </button>
                                    )}
                                    
                                    <div className="nav-spacer"></div>
                                    
                                    <button 
                                        type="button" 
                                        className="nav-button cancel-button"
                                        onClick={() => {
                                            setShowRegisterModal(false)
                                            resetForm()
                                        }}
                                        disabled={loading}
                                    >
                                        Cancelar
                                    </button>
                                    
                                    <button 
                                        type="submit" 
                                        className="nav-button next-button"
                                        disabled={loading || !validateStep(currentStep)}
                                    >
                                        {loading ? (
                                            <div className="spinner"></div>
                                        ) : currentStep === totalSteps ? (
                                            <>
                                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2"/>
                                                </svg>
                                                Crear Usuario
                                            </>
                                        ) : (
                                            <>
                                                Siguiente
                                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <polyline points="9,18 15,12 9,6" stroke="currentColor" strokeWidth="2"/>
                                                </svg>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de confirmación de eliminación */}
            {showDeleteModal && selectedUser && (
                <div className="modal-overlay">
                    <div className="modal-container" style={{ maxWidth: '480px' }}>
                        <div className="modal-header">
                            <div className="modal-title-section">
                                <h2>Eliminar Usuario</h2>
                            </div>
                            <button 
                                className="close-button"
                                onClick={() => {
                                    setShowDeleteModal(false)
                                    setSelectedUser(null)
                                }}
                                disabled={loading}
                            >
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2"/>
                                    <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2"/>
                                </svg>
                            </button>
                        </div>

                        <div style={{ padding: '0 0 32px 0' }}>
                            <div style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                borderRadius: '16px',
                                padding: '20px',
                                marginBottom: '24px',
                                textAlign: 'center'
                            }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    background: 'rgba(239, 68, 68, 0.2)',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 16px',
                                    color: '#ef4444'
                                }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                                        <line x1="10" y1="11" x2="10" y2="17"/>
                                        <line x1="14" y1="11" x2="14" y2="17"/>
                                    </svg>
                                </div>
                                <h3 style={{
                                    color: 'rgba(248, 250, 252, 0.95)',
                                    margin: '0 0 8px 0',
                                    fontSize: '1.25rem',
                                    fontWeight: '700'
                                }}>
                                    ¿Eliminar usuario?
                                </h3>
                                <p style={{
                                    color: 'rgba(248, 250, 252, 0.7)',
                                    margin: '0',
                                    lineHeight: '1.5'
                                }}>
                                    Estás a punto de eliminar a <strong style={{ color: 'rgba(248, 250, 252, 0.9)' }}>
                                    {selectedUser.name} {selectedUser.last_name}
                                    </strong>
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                                <button 
                                    onClick={() => confirmDelete(false)}
                                    disabled={loading}
                                    style={{
                                        padding: '12px 24px',
                                        background: 'rgba(248, 250, 252, 0.1)',
                                        border: '1px solid rgba(248, 250, 252, 0.2)',
                                        borderRadius: '12px',
                                        color: 'rgba(248, 250, 252, 0.8)',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    {loading ? 'Desactivando...' : 'Solo Desactivar'}
                                </button>
                                
                                <button 
                                    onClick={() => confirmDelete(true)}
                                    disabled={loading}
                                    style={{
                                        padding: '12px 24px',
                                        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                        border: 'none',
                                        borderRadius: '12px',
                                        color: 'white',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    {loading ? 'Eliminando...' : 'Eliminar Definitivamente'}
                                </button>
                                
                                <button 
                                    onClick={() => {
                                        setShowDeleteModal(false)
                                        setSelectedUser(null)
                                    }}
                                    disabled={loading}
                                    style={{
                                        padding: '12px 24px',
                                        background: 'rgba(100, 116, 139, 0.1)',
                                        border: '1px solid rgba(100, 116, 139, 0.2)',
                                        borderRadius: '12px',
                                        color: 'rgba(100, 116, 139, 0.8)',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de edición de usuario */}
            <EditUserModal
                user={selectedUser}
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false)
                    setSelectedUser(null)
                }}
                onSave={handleSaveUser}
                loading={loading}
            />
        </div>
    )
}

export default AdminDashboard;