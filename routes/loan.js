const express = require("express");
const router = express.Router();

const {
  checkEligibility,
  createLoan,
  viewLoanDetails,
  makePayment,
} = require("../controllers/loanController");

router.route("/check-eligibility").get(checkEligibility);
router.route("/create-loan").post(createLoan);
router.route("/view-loan/:loan_id").get(viewLoanDetails);
router.route("/make-payment/:customer_id/:loan_id").post(makePayment);

module.exports = router;
