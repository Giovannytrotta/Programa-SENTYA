import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, User, Settings, Camera, Lock, CheckCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import "./SentyaTutorial.css";

const SentyaTutorial = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const handleClose = () => {
    navigate('/');
    if (onClose) onClose();
  };

  const steps = [
    {
      id: 'welcome',
      title: '¡Hola! Somos Sergio y Giovanny',
      subtitle: 'Te vamos a enseñar a usar SENTYA paso a paso',
      content: 'Somos los desarrolladores que han desarrollado esta aplicación pensando especialmente en ti. Vamos a aprender juntos cómo sacar el máximo provecho de SENTYA. No te preocupes, iremos muy despacio y te explicaremos todo con detalle.',
      icon: <User size={80} />,
      action: 'Empezar tutorial'
    },
    {
      id: 'login',
      title: 'Paso 1: Acceder a la aplicación',
      subtitle: 'Busca el botón "Iniciar sesión" o "Explorar SENTYA"',
      content: 'En la pantalla principal de SENTYA verás botones naranjas. Puedes hacer clic en "Iniciar sesión" (arriba a la derecha) o en "Explorar SENTYA" (botón grande naranja). Cualquiera de los dos te llevará a la pantalla de acceso.',
      icon: <ArrowRight size={80} />,
      action: 'Siguiente paso',
      tip: 'Los botones naranjas son los que puedes tocar'
    },
    {
      id: 'profile',
      title: 'Paso 2: Ir a tu perfil',
      subtitle: 'Una vez dentro, busca tu perfil personal',
      content: 'Después de iniciar sesión correctamente, busca un icono con forma de persona o que diga "Mi perfil". Normalmente está en la parte superior de la pantalla o en un menú lateral. Ahí es donde podrás personalizar tu cuenta.',
      icon: <User size={80} />,
      action: 'Continuar',
      tip: 'Tu perfil es tu espacio personal en SENTYA'
    },
    {
      id: 'password',
      title: 'Paso 3: Cambiar tu contraseña',
      subtitle: 'Pon una contraseña que recuerdes fácilmente',
      content: 'En tu perfil, busca una opción que diga "Cambiar contraseña" o un icono de candado. Te pedirá tu contraseña actual y luego podrás poner una nueva. Elige algo que recuerdes bien, como el nombre de tu nieto y el año que nació.',
      icon: <Lock size={80} />,
      action: 'Siguiente',
      tip: 'Apunta tu nueva contraseña en un lugar seguro'
    },
    {
      id: 'photo',
      title: 'Paso 4: Añadir tu foto',
      subtitle: 'Pon una foto bonita para que te reconozcan',
      content: 'Busca donde dice "Cambiar foto" o un icono de cámara. Puedes subir una foto desde tu teléfono o tablet. Si necesitas ayuda, pide a algún familiar que te eche una mano. Una foto tuya hará que SENTYA sea más personal.',
      icon: <Camera size={80} />,
      action: 'Casi terminamos',
      tip: 'La foto aparecerá cada vez que uses SENTYA'
    },
    {
      id: 'congratulations',
      title: '¡Enhorabuena!',
      subtitle: 'Ya sabes los primeros pasos en SENTYA',
      content: 'Has aprendido lo básico para empezar. Recuerda: siempre puedes volver a ver este tutorial si necesitas repasar algo. Ahora ya puedes explorar talleres, ver tu progreso y conectar con otras personas. ¡Disfruta de tu experiencia en SENTYA!',
      icon: <CheckCircle size={80} />,
      action: 'Empezar a usar SENTYA'
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep];

  return (
    <div className="tutorial-overlay">
      <div className="tutorial-container">
        <div className="tutorial-header">
          <div className="tutorial-progress">
            <span className="progress-text">
              Paso {currentStep + 1} de {steps.length}
            </span>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>
          <button className="tutorial-close" onClick={handleClose}>
            ✕
          </button>
        </div>

        <div className="tutorial-content">
          <div className="tutorial-icon">
            {currentStepData.icon}
          </div>
          
          <h1 className="tutorial-title">
            {currentStepData.title}
          </h1>
          
          <h2 className="tutorial-subtitle">
            {currentStepData.subtitle}
          </h2>
          
          <p className="tutorial-text">
            {currentStepData.content}
          </p>
          
          {currentStepData.tip && (
            <div className="tutorial-tip">
              <span className="tip-label">💡 Consejo:</span>
              <span className="tip-text">{currentStepData.tip}</span>
            </div>
          )}
        </div>

        <div className="tutorial-navigation">
          <button 
            className="nav-button nav-back"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            <ChevronLeft size={20} />
            Anterior
          </button>
          
          <button 
            className="nav-button nav-next"
            onClick={nextStep}
          >
            {currentStepData.action}
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SentyaTutorial;

 