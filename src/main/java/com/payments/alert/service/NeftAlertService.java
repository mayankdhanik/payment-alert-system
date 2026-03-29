package com.payments.alert.service;

import com.payments.alert.model.AlertLog;
import com.payments.alert.model.AlertRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * NEFT-specific alert service.
 *
 * Builds NEFT-flavoured notification messages matching the real-world
 * format used in NEFT (National Electronic Funds Transfer) flows.
 *
 * Message templates:
 *   DR  : "Dear Cust XXXX, Your A/c XXXXXXXXXX1234 debited Rs.1000 on 01-Jan-2024
 *           NEFT UTR: SBIN00012345. If not done by you call 1800-XXX-XXXX."
 *   CR  : "Dear Cust XXXX, Your A/c XXXXXXXXXX1234 credited Rs.1000 on 01-Jan-2024
 *           NEFT UTR: SBIN00012345 from A/c XXXXXXXXXX5678."
 *   FAIL: "Dear Cust XXXX, Your NEFT of Rs.1000 (UTR: SBIN00012345) FAILED.
 *           Amount will reverse in 2-3 working days."
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NeftAlertService {

    private static final DateTimeFormatter DTF =
            DateTimeFormatter.ofPattern("dd-MMM-yyyy HH:mm");

    private final AlertService alertService;

    /**
     * Process a complete NEFT alert.
     * Enriches the request with NEFT-specific notif code and message,
     * then delegates to the core AlertService for persistence + dispatch.
     */
    public AlertLog processNeftAlert(AlertRequest request) {
        log.info("Processing NEFT alert: txnRef={}, type={}", request.getTxnRefNo(), request.getAlertType());

        // Stamp payment type
        request.setPaymentType(AlertLog.PaymentType.NEFT);

        // Set NEFT-specific notification code (mirrors real PM_NEFT_DR_1 / PM_NEFT_CR_1)
        String notifCode = switch (request.getAlertType()) {
            case DR      -> "PM_NEFT_DR_1";
            case CR      -> "PM_NEFT_CR_1";
            case FAILURE -> "PM_NEFT_FAIL";
        };
        request.setNotifCode(notifCode);

        // Build NEFT-specific message (only if caller didn't supply one)
        if (request.getMessage() == null || request.getMessage().isBlank()) {
            request.setMessage(buildNeftMessage(request));
        }

        return alertService.sendAlert(request);
    }

    // -------------------------------------------------------
    // Private message builder
    // -------------------------------------------------------

    private String buildNeftMessage(AlertRequest req) {
        String maskedDr = mask(req.getDrAcNo());
        String maskedCr = mask(req.getCrAcNo());
        String dateStr  = LocalDateTime.now().format(DTF);
        String utr      = req.getRrn() != null ? req.getRrn() : req.getTxnRefNo();

        return switch (req.getAlertType()) {
            case DR -> String.format(
                    "Dear Customer %s, Your A/c %s has been debited with %s %s on %s. " +
                    "NEFT UTR No: %s. If not initiated by you, call 1800-XXX-XXXX immediately.",
                    req.getCustomerNo(), maskedDr,
                    req.getCurrency(), req.getAmount(),
                    dateStr, utr);

            case CR -> String.format(
                    "Dear Customer %s, Your A/c %s has been credited with %s %s on %s. " +
                    "NEFT UTR No: %s. Sender A/c: %s.",
                    req.getCustomerNo(), maskedCr,
                    req.getCurrency(), req.getAmount(),
                    dateStr, utr,
                    maskedDr != null ? maskedDr : "N/A");

            case FAILURE -> String.format(
                    "Dear Customer %s, Your NEFT of %s %s (UTR: %s) on %s has FAILED. " +
                    "Amount will be reversed in 2-3 working days. Helpline: 1800-XXX-XXXX.",
                    req.getCustomerNo(),
                    req.getCurrency(), req.getAmount(),
                    utr, dateStr);
        };
    }

    private String mask(String acNo) {
        if (acNo == null || acNo.isBlank()) return null;
        int len = acNo.length();
        if (len <= 4) return acNo;
        return "X".repeat(len - 4) + acNo.substring(len - 4);
    }
}
