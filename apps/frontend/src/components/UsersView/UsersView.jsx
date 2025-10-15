import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, Mail, Shield, Building2, Check, X } from 'lucide-react';
import { useUsers } from '../../hooks/useUsers';
import { useCSSCenters } from '../../hooks/useCSSCenters';
import './UsersView.css';

const UsersView = () => {
    const { users, loading, stats, fetchUsers } = useUsers();
    const { centers, fetchCenters } = useCSSCenters();

    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [cssFilter, setCssFilter] = useState('all');

    useEffect(() => {
        fetchUsers();
        fetchCenters();
    }, [fetchUsers, fetchCenters]);

    const getRoleLabel = (role) => {
        const labels = {
            'administrator': 'Administrador',
            'coordinator': 'Coordinador',
            'professional': 'Profesional',
            'client': 'Cliente',
            'css_technician': 'Técnico CSS'
        };
        return labels[role] || role;
    };

    const getRoleBadgeColor = (role) => {
        const colors = {
            'administrator': 'role-admin',
            'coordinator': 'role-coordinator',
            'professional': 'role-professional',
            'client': 'role-client',
            'css_technician': 'role-technician'
        };
        return colors[role] || 'role-client';
    };

    if (loading) {
        return (
            <div className="users-loading">
                <div className="loading-spinner"></div>
                <p>Cargando usuarios...</p>
            </div>
        );
    }

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesRole = roleFilter === 'all' || user.rol === roleFilter;
        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'active' ? user.is_active : !user.is_active);
        const matchesCSS = cssFilter === 'all' ||
            (user.css_info && user.css_info.id === parseInt(cssFilter));

        return matchesSearch && matchesRole && matchesStatus && matchesCSS;
    });

    return (
        <div className="users-view">
            {/* Header */}
            <div className="users-header">
                <div className="header-title">
                    <h1>Gestión de Usuarios</h1>
                    <p className="subtitle">Administra los usuarios del sistema</p>
                </div>
            </div>

            {/* Filtros */}
            <div className="users-filters">
                <div className="search-box">
                    <Search size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, apellido o email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="filter-group">
                    <Filter size={18} />
                    <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                        <option value="all">Todos los roles</option>
                        <option value="administrator">Administradores</option>
                        <option value="coordinator">Coordinadores</option>
                        <option value="professional">Profesionales</option>
                        <option value="client">Clientes</option>
                        <option value="css_technician">Técnicos CSS</option>
                    </select>
                </div>

                <div className="filter-group">
                    <Shield size={18} />
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="all">Todos los estados</option>
                        <option value="active">Activos</option>
                        <option value="inactive">Inactivos</option>
                    </select>
                </div>

                <div className="filter-group">
                    <Building2 size={18} />
                    <select value={cssFilter} onChange={(e) => setCssFilter(e.target.value)}>
                        <option value="all">Todos los centros</option>
                        {centers.map(center => (
                            <option key={center.id} value={center.id}>
                                {center.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Stats */}
            <div className="users-stats">
                <div className="stat-card">
                    <div className="stat-icon total">
                        <Users size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.total_users || users.length}</span>
                        <span className="stat-label">Total Usuarios</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon active">
                        <Check size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.active_users || 0}</span>
                        <span className="stat-label">Activos</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon inactive">
                        <X size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.inactive_users || 0}</span>
                        <span className="stat-label">Inactivos</span>
                    </div>
                </div>
            </div>

            {/* Vista de Tabla (Desktop) */}
            <div className="users-table-container">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>Usuario</th>
                            <th>Email</th>
                            <th>Rol</th>
                            <th>Centro</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="no-users">
                                    <Users size={48} />
                                    <p>No se encontraron usuarios</p>
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map(user => (
                                <tr key={user.id}>
                                    <td>
                                        <div className="user-info">
                                            <div className="user-avatar">
                                                {user.name?.charAt(0)}{user.last_name?.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="user-name">
                                                    {user.name} {user.last_name}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="user-email">
                                            <Mail size={14} />
                                            {user.email}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`role-badge ${getRoleBadgeColor(user.rol)}`}>
                                            {getRoleLabel(user.rol)}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="css-info">
                                            {user.css_info ? (
                                                <>
                                                    <Building2 size={14} />
                                                    {user.css_info.name}
                                                </>
                                            ) : (
                                                <span className="no-css">Sin asignar</span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                                            {user.is_active ? (
                                                <>
                                                    <Check size={14} />
                                                    Activo
                                                </>
                                            ) : (
                                                <>
                                                    <X size={14} />
                                                    Inactivo
                                                </>
                                            )}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Vista de Cards (Móvil) */}
            <div className="users-cards">
                {filteredUsers.length === 0 ? (
                    <div className="no-users">
                        <Users size={48} />
                        <p>No se encontraron usuarios</p>
                    </div>
                ) : (
                    filteredUsers.map(user => (
                        <div key={user.id} className="user-card">
                            <div className="user-card-header">
                                <div className="user-card-avatar">
                                    {user.name?.charAt(0)}{user.last_name?.charAt(0)}
                                </div>
                                <div className="user-card-info">
                                    <div className="user-card-name">
                                        {user.name} {user.last_name}
                                    </div>
                                    <div className="user-card-email">
                                        <Mail size={14} />
                                        {user.email}
                                    </div>
                                </div>
                            </div>

                            <div className="user-card-details">
                                <div className="user-card-row">
                                    <span className="user-card-label">Rol</span>
                                    <div className="user-card-value">
                                        <span className={`role-badge ${getRoleBadgeColor(user.rol)}`}>
                                            {getRoleLabel(user.rol)}
                                        </span>
                                    </div>
                                </div>

                                <div className="user-card-row">
                                    <span className="user-card-label">Centro</span>
                                    <div className="user-card-value">
                                        {user.css_info ? (
                                            <div className="css-info">
                                                <Building2 size={14} />
                                                {user.css_info.name}
                                            </div>
                                        ) : (
                                            <span className="no-css">Sin asignar</span>
                                        )}
                                    </div>
                                </div>

                                <div className="user-card-row">
                                    <span className="user-card-label">Estado</span>
                                    <div className="user-card-value">
                                        <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                                            {user.is_active ? (
                                                <>
                                                    <Check size={14} />
                                                    Activo
                                                </>
                                            ) : (
                                                <>
                                                    <X size={14} />
                                                    Inactivo
                                                </>
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default UsersView;