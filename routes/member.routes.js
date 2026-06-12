const express = require("express");
const router = express.Router();

const memberController = require("../controllers/member.controller");

/* MEMBERS */

router.get("/", memberController.getMembers);

router.get("/active", memberController.getActiveMembers);

router.get("/expired", memberController.getExpiredMembers);

/* DASHBOARD */

router.get("/dashboard/stats", memberController.getDashboardStats);
 
router.get("/dashboard/monthly-revenue", memberController.getMonthlyRevenue);

/* ADD MEMBER */

router.post("/add", memberController.addMember);

/* DELETE MEMBER */

router.delete("/:id", memberController.deleteMember);

/* RENEW MEMBER */

router.post("/renew/:id", memberController.renewMember);

module.exports = router;