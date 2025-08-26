from flask import Flask, jsonify
from flask_migrate import Migrate
from datetime import timedelta
# from flask_bcrypt import Bcrypt
# from flask_jwt_extended import JWTManager
from extensions import db
# from flask_cors import CORS
from instance.config import Config
from models import user

def create_app():
    #crea y configura la aplicación Flask:
    app= Flask(__name__, instance_relative_config=True)#Permite usar configuraciones desde la carpeta
    
    # 1) Config
    app.config.from_object(Config)
    db.init_app(app)
    # ma.init_app(app)
    migrate= Migrate(app,db,render_as_batch=False)
    #bcrypt.init_app(app)
    #jwt = JWTManager(app)
    # app.config["SQLALCHEMY_DATABASE_URI"]= "postgresql://postgres:26964663@localhost:5432/proyecto_Sentya"
    # app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    #BLUEPRINTS 
    # from app.routes import 
    
    
    return app

app= create_app()
 
if __name__ == "__main__":
    app.run(debug=True, port=3001)