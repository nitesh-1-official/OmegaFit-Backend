const express = require("express");
const router = express.Router();

const memberController = require("../controllers/member.controller");

/* MEMBERS */

router.get("/", memberController.getMembers);

router.get("/active", memberController.getActiveMembers);

router.get("/expired", memberController.getExpiredMembers);

/* DASHBOARD */

router.get("/dashboard/stats", memberController.getDashboardStats);

router.get(
  "/dashboard/monthly-revenue",
  memberController.getMonthlyRevenue
);

/* PAYMENT HISTORY */

router.get(
  "/payments",
  memberController.getPayments
);

/* ADD MEMBER */

router.post("/add", memberController.addMember);

/* RENEW MEMBER */

router.post("/renew/:id", memberController.renewMember);

/* DELETE MEMBER */

router.delete("/:id", memberController.deleteMember);

module.exports = router;
