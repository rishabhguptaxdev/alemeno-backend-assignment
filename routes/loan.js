const express = require("express");
const router = express.Router();

const {
  checkEligibility,
  createLoan,
  viewLoanDetails,
} = require("../controllers/loanController");

router.route("/check-eligibility").get(checkEligibility);
router.route("/create-loan").post(createLoan);
router.route("/view-loan/:loan_id").get(viewLoanDetails);

module.exports = router;
