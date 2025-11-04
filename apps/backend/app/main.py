from flask import Flask, jsonify, send_from_directory  
from app.instance.config import Config
from flask_migrate import Migrate
from datetime import timedelta
from flask_bcrypt import Bcrypt
from app.extensions import db, ma, jwt, bcrypt, migrate
from app.exceptions import AppError
from marshmallow import ValidationError as MarshmallowError 
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from sqlalchemy import text
import os

def create_app():
    #crea y configura la aplicación Flask:
    app= Flask(__name__, instance_relative_config=True)#Permite usar configuraciones desde la carpeta
   
    CORS(app, 
    origins=['*'], 
    methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allow_headers=['Content-Type', 'Authorization', 'Access-Control-Allow-Credentials'],
    supports_credentials=True,
    expose_headers=['Content-Type'])
    # 1) Config
    app.config.from_object(Config)
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    # ma.init_app(app)
    # migrate= Migrate(app,db,render_as_batch=False)
    bcrypt.init_app(app)
    # jwt = JWTManager(app)
    # app.config["SQLALCHEMY_DATABASE_URI"]= "postgresql://postgres:26964663@localhost:5432/proyecto_Sentya"
    # app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    #BLUEPRINTS 
    from app.routes.auth.auth import auth_bp
    from app.routes.auth.auth import auth_bp
    from app.routes.User.user import user_bp
    from app.routes.workshop.workshop import workshop_bp
    from app.routes.session.session import session_bp
    from app.routes.attendance.attendance import attendance_bp
    from app.routes.worshopUser.worshop_user import workshop_users_bp
    from app.routes.thematicArea.thematic_areas import thematic_areas_bp
    from app.routes.css.css import css_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(workshop_bp)
    app.register_blueprint(session_bp)
    app.register_blueprint(attendance_bp)
    app.register_blueprint(workshop_users_bp)
    app.register_blueprint(thematic_areas_bp)
    app.register_blueprint(css_bp)
    
    # 4) Error handler global
    # Manejador de AppError personalizados (400, 401, 403, 404, 409, 422 de negocio, etc.)
    @app.errorhandler(AppError) #Traducimos esos errores a respuestas HTTP.
    def handle_app_error(err: AppError): 
    # Se Convierte cualquier AppError en JSON + status code.
        return jsonify(err.to_dict()),err.status_code
    
    # @app.errorhandler(MarshmallowError)
    # def handle_marshmallow_error(err):
    # #err.messages es un dict { campo: [errores,…] }
    #     return jsonify(err.messages), 422
    @app.route('/uploads/avatars/<filename>')
    def uploaded_avatar(filename):
        upload_folder = os.path.join(os.path.dirname(__file__), 'uploads/avatars')
        return send_from_directory(upload_folder, filename)

    
    
    return app

app = create_app()
 
if __name__ == "__main__":
    app.run(debug=True, port=3001)