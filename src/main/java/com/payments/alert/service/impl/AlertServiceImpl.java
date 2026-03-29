package com.payments.alert.service.impl;

import com.payments.alert.model.AlertLog;
import com.payments.alert.model.AlertRequest;
import com.payments.alert.repository.AlertLogRepository;
import com.payments.alert.service.AlertService;
import com.payments.alert.service.SmsService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AlertServiceImpl implements AlertService {

    private final AlertLogRepository alertLogRepository;
    private final JavaMailSender mailSender;
    private final SmsService smsService;

    @Value("${alert.system.mock-email:true}")
    private boolean mockEmail;

    @Value("${alert.system.from-address:alerts@paymentbank.com}")
    private String fromAddress;

    @Value("${alert.system.from-name:Payment Alert System}")
    private String fromName;

    private static final DateTimeFormatter DTF = DateTimeFormatter.ofPattern("dd-MMM-yyyy HH:mm:ss");

    // -------------------------------------------------------
    // Public API
    // -------------------------------------------------------

    @Override
    @Transactional
    public AlertLog sendAlert(AlertRequest request) {
        log.info("Processing alert for customer: {}, txnRefNo: {}", request.getCustomerNo(), request.getTxnRefNo());

        // 1. Build message text
        String message = buildMessage(request);

        // 2. Persist the log record with PENDING status
        AlertLog alertLog = AlertLog.builder()
                .customerNo(request.getCustomerNo())
                .mobileNo(request.getMobileNo())
                .emailId(request.getEmailId())
                .paymentType(request.getPaymentType())
                .txnRefNo(request.getTxnRefNo())
                .amount(request.getAmount())
                .currency(request.getCurrency() != null ? request.getCurrency() : "INR")
                .drAcNo(maskAccountNumber(request.getDrAcNo()))
                .crAcNo(maskAccountNumber(request.getCrAcNo()))
                .rrn(request.getRrn())
                .alertType(request.getAlertType())
                .message(message)
                .alertStatus(AlertLog.AlertStatus.PENDING)
                .build();

        alertLog = alertLogRepository.save(alertLog);

        // 3. Attempt to send email + SMS notification
        try {
            // Email
            if (mockEmail) {
                log.info("[MOCK EMAIL] To: {} | Subject: Payment Alert | Body: {}", request.getEmailId(), message);
            } else {
                sendEmailNotification(request.getEmailId(), buildEmailSubject(request), buildEmailBody(request, message));
            }

            // SMS
            if (request.getMobileNo() != null && !request.getMobileNo().isBlank()) {
                String smsText = buildSmsText(request, message);
                boolean smsSent = smsService.sendSms(request.getMobileNo(), smsText);
                if (!smsSent) {
                    log.warn("SMS failed for txnRefNo: {} but email succeeded", request.getTxnRefNo());
                }
            }

            alertLog.setAlertStatus(AlertLog.AlertStatus.SENT);
            alertLog.setSentAt(LocalDateTime.now());
            log.info("Alert sent successfully for txnRefNo: {}", request.getTxnRefNo());
        } catch (Exception e) {
            log.error("Failed to send alert for txnRefNo: {} - {}", request.getTxnRefNo(), e.getMessage(), e);
            alertLog.setAlertStatus(AlertLog.AlertStatus.FAILED);
            alertLog.setFailureReason(e.getMessage());
        }

        // 4. Persist final status
        return alertLogRepository.save(alertLog);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AlertLog> getAlertHistory() {
        return alertLogRepository.findAll()
                .stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AlertLog> getAlertsByCustomer(String customerNo) {
        return alertLogRepository.findByCustomerNo(customerNo);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AlertLog> getAlertsByPaymentType(String paymentType) {
        try {
            AlertLog.PaymentType type = AlertLog.PaymentType.valueOf(paymentType.toUpperCase());
            return alertLogRepository.findByPaymentType(type);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid payment type requested: {}", paymentType);
            return List.of();
        }
    }

    // -------------------------------------------------------
    // Message Builders
    // -------------------------------------------------------

    private String buildMessage(AlertRequest req) {
        if (req.getMessage() != null && !req.getMessage().isBlank()) {
            return req.getMessage();
        }

        String maskedDr = maskAccountNumber(req.getDrAcNo());
        String maskedCr = maskAccountNumber(req.getCrAcNo());
        String dateTime = LocalDateTime.now().format(DTF);

        return switch (req.getAlertType()) {
            case DR -> String.format(
                    "Dear Customer %s, Your %s %s account %s has been debited with %s %s on %s. " +
                    "TXN Ref: %s. If not done by you, call 1800-XXX-XXXX immediately.",
                    req.getCustomerNo(), req.getPaymentType().name(),
                    (maskedDr != null ? "A/c " + maskedDr : ""),
                    (maskedDr != null ? maskedDr : ""),
                    req.getCurrency(), req.getAmount(), dateTime,
                    req.getTxnRefNo());

            case CR -> String.format(
                    "Dear Customer %s, Your %s %s account %s has been credited with %s %s on %s. " +
                    "TXN Ref: %s. Sender A/c: %s.",
                    req.getCustomerNo(), req.getPaymentType().name(),
                    (maskedCr != null ? "A/c " + maskedCr : ""),
                    (maskedCr != null ? maskedCr : ""),
                    req.getCurrency(), req.getAmount(), dateTime,
                    req.getTxnRefNo(),
                    (maskedDr != null ? maskedDr : "N/A"));

            case FAILURE -> String.format(
                    "Dear Customer %s, Your %s transaction of %s %s (TXN Ref: %s) on %s has FAILED. " +
                    "Amount will be reversed within 2-3 working days. " +
                    "For queries contact 1800-XXX-XXXX.",
                    req.getCustomerNo(), req.getPaymentType().name(),
                    req.getCurrency(), req.getAmount(),
                    req.getTxnRefNo(), dateTime);
        };
    }

    private String buildSmsText(AlertRequest req, String fullMessage) {
        String type = req.getPaymentType().name();
        String txn = req.getTxnRefNo();
        String maskedAc = maskAccountNumber(req.getDrAcNo());
        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd-MMM-yy"));

        return switch (req.getAlertType()) {
            case DR -> String.format(
                    "INR %s debited from A/c %s on %s via %s. TXN Ref: %s.",
                    req.getAmount(), maskedAc != null ? maskedAc : "XXXXXX", date, type, txn);
            case CR -> String.format(
                    "INR %s credited to A/c %s on %s via %s. TXN Ref: %s.",
                    req.getAmount(), maskAccountNumber(req.getCrAcNo()) != null ? maskAccountNumber(req.getCrAcNo()) : "XXXXXX", date, type, txn);
            case FAILURE -> String.format(
                    "INR %s %s txn (Ref: %s) FAILED on %s. Reversal in 2-3 working days.",
                    req.getAmount(), type, txn, date);
        };
    }

    private String buildEmailSubject(AlertRequest req) {
        return switch (req.getAlertType()) {
            case DR -> String.format("[%s DEBIT ALERT] TXN %s | %s %s",
                    req.getPaymentType(), req.getTxnRefNo(), req.getCurrency(), req.getAmount());
            case CR -> String.format("[%s CREDIT ALERT] TXN %s | %s %s",
                    req.getPaymentType(), req.getTxnRefNo(), req.getCurrency(), req.getAmount());
            case FAILURE -> String.format("[%s FAILURE ALERT] TXN %s | %s %s",
                    req.getPaymentType(), req.getTxnRefNo(), req.getCurrency(), req.getAmount());
        };
    }

    private String buildEmailBody(AlertRequest req, String message) {
        String alertColor = switch (req.getAlertType()) {
            case DR      -> "#dc3545";
            case CR      -> "#198754";
            case FAILURE -> "#fd7e14";
        };

        return """
                <html>
                <body style="font-family: Arial, sans-serif; background: #f4f6f9; margin: 0; padding: 0;">
                  <table width="100%%" cellpadding="0" cellspacing="0" style="max-width:600px; margin:30px auto; background:#fff; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                    <tr>
                      <td style="background:#0d6efd; padding:24px; border-radius:8px 8px 0 0; text-align:center;">
                        <h2 style="color:#fff; margin:0;">Payment Alert System</h2>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:30px;">
                        <div style="border-left:4px solid %s; padding:12px 16px; background:#f8f9fa; border-radius:4px; margin-bottom:20px;">
                          <strong style="color:%s; font-size:16px;">%s %s ALERT</strong>
                        </div>
                        <p style="font-size:15px; color:#333; line-height:1.7;">%s</p>
                        <table width="100%%" style="border-collapse:collapse; margin-top:20px;">
                          <tr style="background:#0d6efd; color:#fff;">
                            <th style="padding:10px; text-align:left;">Field</th>
                            <th style="padding:10px; text-align:left;">Details</th>
                          </tr>
                          <tr style="background:#f8f9fa;"><td style="padding:8px 10px; border:1px solid #dee2e6;"><strong>Customer No</strong></td><td style="padding:8px 10px; border:1px solid #dee2e6;">%s</td></tr>
                          <tr><td style="padding:8px 10px; border:1px solid #dee2e6;"><strong>Payment Type</strong></td><td style="padding:8px 10px; border:1px solid #dee2e6;">%s</td></tr>
                          <tr style="background:#f8f9fa;"><td style="padding:8px 10px; border:1px solid #dee2e6;"><strong>TXN Ref No</strong></td><td style="padding:8px 10px; border:1px solid #dee2e6;">%s</td></tr>
                          <tr><td style="padding:8px 10px; border:1px solid #dee2e6;"><strong>Amount</strong></td><td style="padding:8px 10px; border:1px solid #dee2e6;">%s %s</td></tr>
                        </table>
                        <p style="margin-top:24px; font-size:12px; color:#888;">This is an automated alert. Do not reply to this email.</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="background:#f4f6f9; padding:16px; text-align:center; border-radius:0 0 8px 8px; font-size:12px; color:#aaa;">
                        &copy; 2024 Payment Alert System. All rights reserved.
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(
                alertColor, alertColor,
                req.getPaymentType(), req.getAlertType(),
                message,
                req.getCustomerNo(),
                req.getPaymentType(),
                req.getTxnRefNo(),
                req.getCurrency(), req.getAmount()
        );
    }

    // -------------------------------------------------------
    // Email Dispatch
    // -------------------------------------------------------

private void sendEmailNotification(String toEmail, String subject, String htmlBody) throws MessagingException, java.io.UnsupportedEncodingException {        MimeMessage mimeMessage = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
        helper.setFrom(fromAddress, fromName);
        helper.setTo(toEmail);
        helper.setSubject(subject);
        helper.setText(htmlBody, true);
        mailSender.send(mimeMessage);
        log.debug("Email dispatched to: {}", toEmail);
    }

    // -------------------------------------------------------
    // Utility
    // -------------------------------------------------------

    /**
     * Masks all but the last 4 digits of an account number.
     * e.g. "1234567890123456" -> "XXXXXXXXXXXX3456"
     */
    private String maskAccountNumber(String accountNumber) {
        if (accountNumber == null || accountNumber.isBlank()) {
            return null;
        }
        int len = accountNumber.length();
        if (len <= 4) {
            return accountNumber;
        }
        return "X".repeat(len - 4) + accountNumber.substring(len - 4);
    }
}
