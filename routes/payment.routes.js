const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");

router.get("/", paymentController.getPayments);
router.get("/monthly-revenue", paymentController.getMonthlyRevenue);

module.exports = router;