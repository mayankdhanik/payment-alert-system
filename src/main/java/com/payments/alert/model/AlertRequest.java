package com.payments.alert.model;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * DTO used to carry the inbound alert request from form/API.
 * Validated at the controller layer before being processed by the service.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlertRequest {

    // -----------------------------------------------
    // Customer Identification
    // -----------------------------------------------
    @NotBlank(message = "Customer number is required")
    @Size(min = 5, max = 20, message = "Customer number must be between 5 and 20 characters")
    private String customerNo;

    @Pattern(regexp = "^[6-9]\\d{9}$", message = "Mobile number must be a valid 10-digit Indian mobile number")
    private String mobileNo;

    @Email(message = "Please provide a valid email address")
    @NotBlank(message = "Email ID is required")
    private String emailId;

    // -----------------------------------------------
    // Notification / Internal Code
    // -----------------------------------------------
    @Size(max = 20, message = "Notification code must not exceed 20 characters")
    private String notifCode;

    // -----------------------------------------------
    // Payment Details
    // -----------------------------------------------
    @NotNull(message = "Payment type is required")
    private AlertLog.PaymentType paymentType;

    @NotBlank(message = "Transaction reference number is required")
    @Size(min = 6, max = 50, message = "TXN Ref No must be between 6 and 50 characters")
    private String txnRefNo;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
    @Digits(integer = 13, fraction = 2, message = "Amount must have at most 13 integer digits and 2 decimal places")
    private BigDecimal amount;

    @NotBlank(message = "Currency is required")
    @Size(min = 3, max = 5, message = "Currency code must be 3-5 characters")
    @Builder.Default
    private String currency = "INR";

    // -----------------------------------------------
    // Account Numbers
    // -----------------------------------------------
    @Size(max = 25, message = "Debit account number must not exceed 25 characters")
    private String drAcNo;

    @Size(max = 25, message = "Credit account number must not exceed 25 characters")
    private String crAcNo;

    @Size(max = 25, message = "RRN must not exceed 25 characters")
    private String rrn;

    // -----------------------------------------------
    // Alert Classification
    // -----------------------------------------------
    @NotNull(message = "Alert type is required")
    private AlertLog.AlertType alertType;

    // Optional: caller may pre-supply a custom message; if blank the service generates one
    private String message;
}
