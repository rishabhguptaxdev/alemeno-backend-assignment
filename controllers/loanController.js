const BigPromise = require("../middlewares/bigPromise");
const prisma = require("../prisma/prismaClient");
const calculateCreditScore = require("../utils/calculateCreditScore");
const CustomError = require("../utils/customErrors");

exports.checkEligibility = BigPromise(async (req, res, next) => {
  try {
    const { customer_id, loan_amount, interest_rate, tenure } = req.body;

    // Check if all fields are given in body or not
    if (!customer_id || !loan_amount || !interest_rate || !tenure) {
      return next(new CustomError("All fields are required", 400));
    }

    // Fetch user and related loan data from the database
    const user = await prisma.user.findUnique({
      where: { customer_id },
      include: { loans: true },
    });

    // User is not found in the database
    if (!user) {
      return next(new CustomError("User not found", 400));
    }

    // Calculate credit score
    let creditScore = calculateCreditScore(user);
    let approval = false;
    let correctedInterestRate = interest_rate;

    // If credit score > 50, approve loan
    if (creditScore >= 50) {
      approval = true;
    }
    // If 50 > credit score > 30, approve loans with interest rate> 12%
    else if (50 > creditScore && creditScore >= 30) {
      correctedInterestRate = Math.max(12, interest_rate);
      approval = interest_rate > 12;
    }
    // If 30> credit score > 10, approve loans with interest rate>16%
    else if (30 > creditScore && creditScore >= 10) {
      correctedInterestRate = Math.max(16, interest_rate);
      approval = interest_rate > 16;
    }
    // If 10> credit score, don’t approve any loans
    else if (10 > creditScore) {
      approval = false;
    }

    // If sum of all current EMIs > 50% of monthly salary,don’t approve any loans
    const monthly_salary = user.monthly_salary;
    const currentEMI = user.loans.reduce((total, loan) => {
      const currentDate = new Date();
      if (loan.end_date > currentDate) {
        return total + loan.monthly_repayment;
      }
      return total;
    }, 0);

    if (currentEMI > 0.5 * monthly_salary) {
      approval = false;
    }

    // Assuming tenure is provided in months
    const monthlyRate = correctedInterestRate / (12 * 100);
    const compoundFactor = Math.pow(1 + monthlyRate, tenure);
    const monthlyInstallment = loan_amount * compoundFactor - loan_amount;

    // Response object
    const response = {
      customer_id,
      approval,
      interest_rate,
      corrected_interest_rate: correctedInterestRate,
      tenure,
      monthly_installment: monthlyInstallment,
    };

    // Send the response
    res.status(200).json(response);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
