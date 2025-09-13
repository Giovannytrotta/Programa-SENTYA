#CREAMOS NUEVO ARCHIVO DE EXCEPCIONES PARA MANEJAR ESTADOS DE ERRORES O CREAR ESTADOS DE ERRORES PARA 
#FACILITAR LA DEPURACION Y LECTURA DE POSIBLES ERRORES LO MANEJAMOS COMO UN HANDLE GLOBAL

#CREAMOS LA CLASE APP ERROR COMO CLASE BASE CON UN STATUS_CODE POR DEFECTO 400 Y UN MENSAJE GENERICO CON EL METODO
#Método to_dict() para serializar el JSON de error.

#Codigos de error general de la aplicacion

#AppError(Exception): 400
#Error base de la aplicación que incluye código HTTP y mensaje.
# 400 → BadRequestError
# 401 → UnauthorizedError
# 403 → ForbiddenError
# 404 → NotFoundError
# 409 → ConflictError
# 422 → ValidationError

class AppError(Exception):
#Error base de la aplicación que incluye código HTTP y mensaje.
    status_code = 400
    message = "Unexpected application error."
    
    def __init__(self,message: str= None):
        super().__init__(message or self.message)
        if message:
            self.message = message
            
    def to_dict(self):
        return {"error": self.message}
    
   #SUBCLASES DE LA CLASE ERROR PARA MANEJO DE ERRORES 
class ValidationError(AppError):
#   Datos de entrada inválidos.     
    status_code= 422
    message =   "Invalid data."
    
class NotFoundError(AppError):
#     Recurso no encontrado.
    status_code = 404 
    message = "Resource not found."
    
class UnauthorizedError(AppError):
# Acceso denegado (falta autenticación).
    status_code= 401
    message = "User Not unauthenticated."
    
class ForbiddenError(AppError):
#   Acceso prohibido (no tienes permiso).
    status_code= 403
    message = "You do not have permission to perform this action."
    
class ConflictError(AppError):
    status_code = 409
    message = "Conflicting resource."
    #  Conflicto como usuario ya existente
    
class BadRequestError(AppError):
    status_code = 400
    message  = "Bad request."
# Solicitud inválida.