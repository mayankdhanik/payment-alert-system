package com.payments.alert.service;

import com.payments.alert.model.AlertLog;
import com.payments.alert.model.AlertRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * RTGS-specific alert service.
 *
 * Builds RTGS (Real Time Gross Settlement) notification messages.
 * RTGS is used for high-value transactions (typically ≥ ₹2,00,000).
 * Messages include the formatted lakh/crore representation of amounts.
 *
 * Notification code mapping (mirrors production codes):
 *   PM_RTGS_DR_1  — Debit success
 *   PM_RTGS_OUT   — Credit / outward success
 *   PM_RTGS_FAIL  — Transaction failure
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RtgsAlertService {

    private static final DateTimeFormatter DTF =
            DateTimeFormatter.ofPattern("dd-MMM-yyyy HH:mm");

    private final AlertService alertService;

    /**
     * Process a complete RTGS alert end-to-end.
     * Enriches the request with RTGS-specific notif code and formatted message,
     * then delegates to the core AlertService for persistence + dispatch.
     */
    public AlertLog processRtgsAlert(AlertRequest request) {
        log.info("Processing RTGS alert: txnRef={}, amount={}", request.getTxnRefNo(), request.getAmount());

        request.setPaymentType(AlertLog.PaymentType.RTGS);

        String notifCode = switch (request.getAlertType()) {
            case DR      -> "PM_RTGS_DR_1";
            case CR      -> "PM_RTGS_OUT";
            case FAILURE -> "PM_RTGS_FAIL";
        };
        request.setNotifCode(notifCode);

        if (request.getMessage() == null || request.getMessage().isBlank()) {
            request.setMessage(buildRtgsMessage(request));
        }

        return alertService.sendAlert(request);
    }

    // -------------------------------------------------------
    // Private message builder
    // -------------------------------------------------------

    private String buildRtgsMessage(AlertRequest req) {
        String maskedDr  = mask(req.getDrAcNo());
        String maskedCr  = mask(req.getCrAcNo());
        String dateStr   = LocalDateTime.now().format(DTF);
        String utr       = req.getRrn() != null ? req.getRrn() : req.getTxnRefNo();
        // Format amount in Indian lakh notation e.g. 2,00,000.00
        String formatted = formatIndian(req.getAmount());

        return switch (req.getAlertType()) {
            case DR -> String.format(
                    "Dear Customer %s, Your A/c %s has been debited with %s %s on %s. " +
                    "RTGS UTR: %s. Beneficiary A/c: %s. " +
                    "If not initiated by you, call 1800-XXX-XXXX immediately.",
                    req.getCustomerNo(), maskedDr,
                    req.getCurrency(), formatted,
                    dateStr, utr,
                    maskedCr != null ? maskedCr : "N/A");

            case CR -> String.format(
                    "Dear Customer %s, Your A/c %s has been credited with %s %s on %s. " +
                    "RTGS UTR: %s. Sender A/c: %s.",
                    req.getCustomerNo(), maskedCr,
                    req.getCurrency(), formatted,
                    dateStr, utr,
                    maskedDr != null ? maskedDr : "N/A");

            case FAILURE -> String.format(
                    "Dear Customer %s, Your RTGS transaction of %s %s (UTR: %s) on %s has FAILED. " +
                    "Amount will be reversed in 2 working days. Helpline: 1800-XXX-XXXX.",
                    req.getCustomerNo(),
                    req.getCurrency(), formatted,
                    utr, dateStr);
        };
    }

    /**
     * Formats amount in Indian lakh notation.
     * e.g. 200000.50 → "2,00,000.50"
     */
    private String formatIndian(BigDecimal amount) {
        if (amount == null) return "0.00";
        DecimalFormatSymbols symbols = new DecimalFormatSymbols(Locale.US);
        DecimalFormat df = new DecimalFormat("##,##,##0.00", symbols);
        return df.format(amount);
    }

    private String mask(String acNo) {
        if (acNo == null || acNo.isBlank()) return null;
        int len = acNo.length();
        if (len <= 4) return acNo;
        return "X".repeat(len - 4) + acNo.substring(len - 4);
    }
}
