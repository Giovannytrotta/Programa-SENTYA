from flask import Flask, jsonify
from flask_migrate import Migrate
from datetime import timedelta
# from flask_bcrypt import Bcrypt
# from flask_jwt_extended import JWTManager
from extensions import db, migrate
# from flask_cors import CORS
from instance.config import Config


def create_app():
    #crea y configura la aplicación Flask:
    app= Flask(__name__, instance_relative_config=True)#Permite usar configuraciones desde la carpeta
    
    # 1) Config
    app.config.from_object(Config)
    db.init_app(app)
    # ma.init_app(app)
    migrate= Migrate(app,db,render_as_batch=False)
    migrate.init_app(app,db)
    #bcrypt.init_app(app)
    #jwt = JWTManager(app)
    # app.config["SQLALCHEMY_DATABASE_URI"]= "postgresql://postgres:26964663@localhost:5432/proyecto_Sentya"
    # app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    #BLUEPRINTS 
    # from app.routes import 
    
    # db= SQLAlchemy(app)
    # class User(db.Model):
    #     id = db.Column(db.Integer,primary_key=True)
    #     name= db.Column(db.String(80))

    # @app.route("/")
    # def auth():
    #     return "Todo esta funcionando"

# @app.route("/test-db")
# def test_db():
#     try:
#         test_user = User(name="Prueba de usuario")
#         db.session.add(test_user)
#         db.session.commit()
        
#         users = User.query.all()
#         return f"Funcionoo: {len(users)}"
#     except Exception as e:
#         return f"Fallo :() : {str(e)}"
    
    return app

app= create_app()
 
if __name__ == "__main__":
    app.run(debug=True, port=3001)