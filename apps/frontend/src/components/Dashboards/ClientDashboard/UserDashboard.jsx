// src/components/Dashboards/UserDashboard/UserDashboard.jsx
import React from 'react';
import { BookOpen, Calendar, Award, TrendingUp } from 'lucide-react';
import './UserDashboard.css';

const UserDashboard = () => {
  return (
    <div className="client-dashboard">
      <div className="dashboard-header">
        <h1>Bienvenido a tu Dashboard</h1>
        <p>Aquí podrás gestionar tus talleres e inscripciones</p>
      </div>

      {/* Cards de estadísticas */}
      <div className="stats-grid">
        <div className="stat-card">
          <BookOpen className="stat-icon" />
          <div className="stat-content">
            <h3>Talleres Activos</h3>
            <p className="stat-number">5</p>
          </div>
        </div>

        <div className="stat-card">
          <Calendar className="stat-icon" />
          <div className="stat-content">
            <h3>Próximas Sesiones</h3>
            <p className="stat-number">12</p>
          </div>
        </div>

        <div className="stat-card">
          <Award className="stat-icon" />
          <div className="stat-content">
            <h3>Completados</h3>
            <p className="stat-number">3</p>
          </div>
        </div>

        <div className="stat-card">
          <TrendingUp className="stat-icon" />
          <div className="stat-content">
            <h3>Asistencia</h3>
            <p className="stat-number">85%</p>
          </div>
        </div>
      </div>

      {/* Contenido Lorem Ipsum */}
      <div className="content-section">
        <h2>Talleres Disponibles</h2>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
        
        <div className="workshop-card">
          <h3>Taller de Fisioterapia</h3>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec vel mauris quam. Proin nec lacus et massa tincidunt facilisis. Sed euismod, nisl nec ultricies lacinia, nisl nisl aliquam nisl, nec aliquam nisl nisl nec nisl.</p>
        </div>

        <div className="workshop-card">
          <h3>Taller de Arte y Creatividad</h3>
          <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
        </div>

        <div className="workshop-card">
          <h3>Taller de Mindfulness</h3>
          <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.</p>
        </div>
      </div>

      <div className="content-section">
        <h2>Mis Talleres Inscritos</h2>
        <p>Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.</p>
        
        <div className="workshop-card">
          <h3>Gimnasia Adaptada</h3>
          <p>Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.</p>
        </div>

        <div className="workshop-card">
          <h3>Musicoterapia</h3>
          <p>Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur.</p>
        </div>
      </div>

      <div className="content-section">
        <h2>Próximas Actividades</h2>
        <p>At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.</p>
        
        <div className="workshop-card">
          <h3>Sesión Especial: Yoga al Aire Libre</h3>
          <p>Similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus.</p>
        </div>

        <div className="workshop-card">
          <h3>Charla Motivacional</h3>
          <p>Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus.</p>
        </div>

        <div className="workshop-card">
          <h3>Taller de Cocina Saludable</h3>
          <p>Ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
        </div>
      </div>

      <div className="content-section">
        <h2>Recursos y Material de Apoyo</h2>
        <p>Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?</p>
        
        <div className="workshop-card">
          <h3>Guía de Ejercicios en Casa</h3>
          <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.</p>
        </div>

        <div className="workshop-card">
          <h3>Videos Tutoriales</h3>
          <p>Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet.</p>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;