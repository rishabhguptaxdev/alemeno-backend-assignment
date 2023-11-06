const express = require("express");
const router = express.Router();

const {
  checkEligibility,
  createLoan,
} = require("../controllers/loanController");

router.route("/check-eligibility").get(checkEligibility);
router.route("/create-loan").post(createLoan);

module.exports = router;
