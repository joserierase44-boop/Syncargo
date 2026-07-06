const router = require('express').Router();
const ctrl = require('../controllers/dashboard.controller');
const { verificarToken, autorizar } = require('../middleware/auth.middleware');

router.use(verificarToken);
router.get('/admin',         autorizar('admin'),         ctrl.admin);
router.get('/local',         autorizar('local'),         ctrl.local);
router.get('/distribuidor',  autorizar('distribuidor'),  ctrl.distribuidor);
router.get('/transportista', autorizar('transportista'), ctrl.transportista);

module.exports = router;
