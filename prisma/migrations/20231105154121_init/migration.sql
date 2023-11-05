-- CreateTable
CREATE TABLE `User` (
    `customer_id` INTEGER NOT NULL AUTO_INCREMENT,
    `first_name` VARCHAR(191) NOT NULL,
    `last_name` VARCHAR(191) NOT NULL,
    `age` INTEGER NOT NULL,
    `phone_number` BIGINT NOT NULL,
    `monthly_salary` INTEGER NOT NULL,
    `approved_limit` INTEGER NOT NULL,
    `current_debt` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`customer_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Loan` (
    `customer_id` INTEGER NOT NULL,
    `loan_id` INTEGER NOT NULL,
    `loan_amount` INTEGER NOT NULL,
    `tenure` INTEGER NOT NULL,
    `interest_rate` DOUBLE NOT NULL,
    `monthly_repayment` INTEGER NOT NULL,
    `emis_paid_on_time` INTEGER NOT NULL,
    `start_date` DATETIME(3) NOT NULL,
    `end_date` DATETIME(3) NOT NULL,

    PRIMARY KEY (`loan_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Loan` ADD CONSTRAINT `Loan_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `User`(`customer_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
