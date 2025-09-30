// src/components/Layout/Footer.jsx
import React from 'react';
import { Heart } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <p className="footer-text">
            © {currentYear} SENTYA - Sistema de Gestión de Talleres
          </p>
          <p className="footer-love">
            Hecho con <Heart size={14} className="heart-icon" /> por AOSSA GLOBAL S.A.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;