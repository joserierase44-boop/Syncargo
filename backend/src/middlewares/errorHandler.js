// Middleware centralizado de manejo de errores.
// Cualquier error pasado con next(error) o lanzado dentro de un controlador async-catch termina aquí.
function manejadorErrores(error, req, res, next) {
  console.error('Error no controlado:', error);

  // Errores conocidos de MySQL
  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ exito: false, mensaje: 'El registro ya existe (valor duplicado)' });
  }
  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({ exito: false, mensaje: 'Referencia inválida a un registro relacionado' });
  }

  const status = error.status || 500;
  res.status(status).json({
    exito: false,
    mensaje: error.mensaje || error.message || 'Error interno del servidor'
  });
}

// Envuelve un controlador async para capturar errores automáticamente sin try-catch repetido
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { manejadorErrores, asyncHandler };
