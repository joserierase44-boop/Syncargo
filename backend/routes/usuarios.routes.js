const router = require('express').Router();
const ctrl = require('../controllers/usuarios.controller');
const { verificarToken, autorizar } = require('../middleware/auth.middleware');

router.use(verificarToken);
router.get('/',         autorizar('admin'), ctrl.listar);
router.get('/:id',      autorizar('admin'), ctrl.obtener);
router.post('/',        autorizar('admin'), ctrl.crear);
router.put('/:id',      autorizar('admin'), ctrl.actualizar);
router.delete('/:id',   autorizar('admin'), ctrl.eliminar);

module.exports = router;
