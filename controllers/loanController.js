const BigPromise = require("../middlewares/bigPromise");
const prisma = require("../prisma/prismaClient");
const calculateCreditScore = require("../utils/calculateCreditScore");
const CustomError = require("../utils/customErrors");

const checkEligibility = BigPromise(async (req, res, next) => {
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
      correctedInterestRate = Math.max(12, interest_rate);
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

    // Assuming tenure is provided in months, interest_rate is an annual rate
    const monthlyRate = correctedInterestRate / (12 * 100);
    const compoundFactor = Math.pow(1 + monthlyRate, tenure);
    const monthlyInstallment =
      (loan_amount * compoundFactor * monthlyRate) / (compoundFactor - 1);

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
    if (!res) {
      return response;
    }
    res.status(200).json(response);
  } catch (error) {
    console.error("Error:", error);
    if (!res) {
      return {};
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

const createLoan = BigPromise(async (req, res, next) => {
  try {
    const { customer_id, loan_amount, interest_rate, tenure } = req.body;

    if (!customer_id || !loan_amount || !interest_rate || !tenure) {
      return next(new CustomError("All fields are required", 400));
    }

    // Fetch user and related loan data from the database
    const user = await prisma.user.findUnique({
      where: { customer_id },
    });

    // User is not found in the database
    if (!user) {
      return next(new CustomError("User not found", 400));
    }

    const checkEligibilityResponse = await checkEligibility({ body: req.body });

    let loanId = null;
    let loan_approved = false;
    let message = "";
    let monthly_installment = 0;
    let response = {};

    if (checkEligibilityResponse.approval) {
      // Save the new loan details in the database
      const start = new Date();
      const end = new Date(start);
      end.setMonth(end.getMonth() + tenure);

      const newLoan = await prisma.loan.create({
        data: {
          customer_id,
          loan_amount,
          interest_rate: checkEligibilityResponse.corrected_interest_rate,
          tenure,
          monthly_repayment: checkEligibilityResponse.monthly_installment,
          emis_paid_on_time: 0,
          start_date: new Date(),
          end_date: end,
        },
      });

      loanId = newLoan.loan_id;
      loan_approved = true;
      message = "Loan approved";
      monthly_installment = checkEligibilityResponse.monthly_installment;

      response = {
        loan_id: loanId,
        customer_id,
        loan_approved,
        message,
        monthly_installment,
      };
      res.status(201).json(response);
    } else {
      message = "Loan not approved due to low credit score or high EMIs";

      response = {
        customer_id,
        loan_approved,
        message,
      };
      res.status(200).json(response);
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = { checkEligibility, createLoan };
