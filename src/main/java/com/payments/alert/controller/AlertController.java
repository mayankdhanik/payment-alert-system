package com.payments.alert.controller;

import com.payments.alert.model.AlertLog;
import com.payments.alert.model.AlertRequest;
import com.payments.alert.service.AlertService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST controller exposing all alert-related endpoints.
 * React frontend calls these via Axios.
 *
 * Base URL: /api/alerts
 */
@Slf4j
@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
public class AlertController {

    private final AlertService alertService;

    // -------------------------------------------------------
    // POST /api/alerts/send
    // Send a new payment alert (NEFT / IMPS / RTGS)
    // -------------------------------------------------------
    @PostMapping("/send")
    public ResponseEntity<Map<String, Object>> sendAlert(@Valid @RequestBody AlertRequest request) {
        log.info("Received alert request: type={}, customer={}, txnRef={}",
                request.getPaymentType(), request.getCustomerNo(), request.getTxnRefNo());

        AlertLog result = alertService.sendAlert(request);

        Map<String, Object> response = new HashMap<>();
        response.put("success", result.getAlertStatus() == AlertLog.AlertStatus.SENT);
        response.put("alertId", result.getId());
        response.put("status", result.getAlertStatus());
        response.put("message", result.getMessage());
        response.put("txnRefNo", result.getTxnRefNo());
        response.put("sentAt", result.getSentAt());

        if (result.getAlertStatus() == AlertLog.AlertStatus.FAILED) {
            response.put("error", result.getFailureReason());
        }

        return ResponseEntity.ok(response);
    }

    // -------------------------------------------------------
    // GET /api/alerts/history
    // Fetch all alert logs, newest first
    // -------------------------------------------------------
    @GetMapping("/history")
    public ResponseEntity<List<AlertLog>> getHistory() {
        return ResponseEntity.ok(alertService.getAlertHistory());
    }

    // -------------------------------------------------------
    // GET /api/alerts/customer/{customerNo}
    // Fetch alerts for a specific customer
    // -------------------------------------------------------
    @GetMapping("/customer/{customerNo}")
    public ResponseEntity<List<AlertLog>> getByCustomer(@PathVariable String customerNo) {
        return ResponseEntity.ok(alertService.getAlertsByCustomer(customerNo));
    }

    // -------------------------------------------------------
    // GET /api/alerts/type/{paymentType}
    // Fetch alerts filtered by NEFT / IMPS / RTGS
    // -------------------------------------------------------
    @GetMapping("/type/{paymentType}")
    public ResponseEntity<List<AlertLog>> getByPaymentType(@PathVariable String paymentType) {
        return ResponseEntity.ok(alertService.getAlertsByPaymentType(paymentType));
    }

    // -------------------------------------------------------
    // GET /api/alerts/stats
    // Summary counts for the dashboard cards
    // -------------------------------------------------------
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        List<AlertLog> all = alertService.getAlertHistory();

        long total  = all.size();
        long neft   = all.stream().filter(a -> a.getPaymentType() == AlertLog.PaymentType.NEFT).count();
        long imps   = all.stream().filter(a -> a.getPaymentType() == AlertLog.PaymentType.IMPS).count();
        long rtgs   = all.stream().filter(a -> a.getPaymentType() == AlertLog.PaymentType.RTGS).count();
        long sent   = all.stream().filter(a -> a.getAlertStatus() == AlertLog.AlertStatus.SENT).count();
        long failed = all.stream().filter(a -> a.getAlertStatus() == AlertLog.AlertStatus.FAILED).count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("total",  total);
        stats.put("neft",   neft);
        stats.put("imps",   imps);
        stats.put("rtgs",   rtgs);
        stats.put("sent",   sent);
        stats.put("failed", failed);

        return ResponseEntity.ok(stats);
    }
}
