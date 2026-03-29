package com.payments.alert.service;

import com.payments.alert.model.AlertLog;
import com.payments.alert.model.AlertRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * IMPS-specific alert service.
 *
 * Builds IMPS (Immediate Payment Service) notification messages.
 * IMPS transactions are real-time 24x7, so the message reflects that.
 *
 * Notification code mapping (mirrors production codes):
 *   PM_IMPS_DR_1  — Debit success
 *   PM_IMPS_PS_1  — Credit success
 *   PM_IMPS_PS_2  — Transaction failure / reversal
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ImpsAlertService {

    private static final DateTimeFormatter DTF =
            DateTimeFormatter.ofPattern("dd-MMM-yyyy HH:mm:ss");

    private final AlertService alertService;

    /**
     * Process a complete IMPS alert end-to-end.
     * Enriches the request with IMPS-specific notif code and message,
     * then delegates to the core AlertService for persistence + dispatch.
     */
    public AlertLog processImpsAlert(AlertRequest request) {
        log.info("Processing IMPS alert: txnRef={}, type={}", request.getTxnRefNo(), request.getAlertType());

        request.setPaymentType(AlertLog.PaymentType.IMPS);

        // IMPS notification code (mirrors real PM_IMPS_DR_1 / PM_IMPS_PS_1 / PM_IMPS_PS_2)
        String notifCode = switch (request.getAlertType()) {
            case DR      -> "PM_IMPS_DR_1";
            case CR      -> "PM_IMPS_PS_1";
            case FAILURE -> "PM_IMPS_PS_2";
        };
        request.setNotifCode(notifCode);

        // Build IMPS-specific message if not pre-supplied
        if (request.getMessage() == null || request.getMessage().isBlank()) {
            request.setMessage(buildImpsMessage(request));
        }

        return alertService.sendAlert(request);
    }

    // -------------------------------------------------------
    // Private message builder
    // -------------------------------------------------------

    private String buildImpsMessage(AlertRequest req) {
        String maskedDr = mask(req.getDrAcNo());
        String maskedCr = mask(req.getCrAcNo());
        String dateTime = LocalDateTime.now().format(DTF);
        String rrn      = req.getRrn() != null ? req.getRrn() : req.getTxnRefNo();

        return switch (req.getAlertType()) {
            case DR -> String.format(
                    "Dear Customer %s, Your a/c %s is debited for %s %s on %s " +
                    "and credited to a/c %s (IMPS Ref no %s). " +
                    "Not you? Call 1800-XXX-XXXX.",
                    req.getCustomerNo(), maskedDr,
                    req.getCurrency(), req.getAmount(),
                    dateTime,
                    maskedCr != null ? maskedCr : "N/A",
                    rrn);

            case CR -> String.format(
                    "Dear Customer %s, Your a/c %s has been credited with %s %s on %s " +
                    "via IMPS (RRN: %s). Sender a/c: %s.",
                    req.getCustomerNo(), maskedCr,
                    req.getCurrency(), req.getAmount(),
                    dateTime, rrn,
                    maskedDr != null ? maskedDr : "N/A");

            case FAILURE -> String.format(
                    "Dear Customer %s, Your IMPS transaction of %s %s (RRN: %s) on %s has FAILED. " +
                    "Reason: Unable to process. Amount will be reversed in 2-3 working days. " +
                    "Helpline: 1800-XXX-XXXX.",
                    req.getCustomerNo(),
                    req.getCurrency(), req.getAmount(),
                    rrn, dateTime);
        };
    }

    private String mask(String acNo) {
        if (acNo == null || acNo.isBlank()) return null;
        int len = acNo.length();
        if (len <= 4) return acNo;
        return "X".repeat(len - 4) + acNo.substring(len - 4);
    }
}
