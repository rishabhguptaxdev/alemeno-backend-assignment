const express = require("express");
const router = express.Router();

const { checkEligibility } = require("../controllers/loanController");

router.route("/check-eligibility").get(checkEligibility);

module.exports = router;
