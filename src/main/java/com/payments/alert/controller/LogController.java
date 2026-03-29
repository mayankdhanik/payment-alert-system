package com.payments.alert.controller;

import com.payments.alert.model.AlertLog;
import com.payments.alert.repository.AlertLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for managing alert log records.
 * Used by the React AlertHistory page.
 *
 * Base URL: /api/logs
 */
@Slf4j
@RestController
@RequestMapping("/api/logs")
@RequiredArgsConstructor
public class LogController {

    private final AlertLogRepository alertLogRepository;

    // GET /api/logs  — all logs newest first
    @GetMapping
    public ResponseEntity<List<AlertLog>> getAllLogs() {
        List<AlertLog> logs = alertLogRepository.findAll()
                .stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .toList();
        return ResponseEntity.ok(logs);
    }

    // GET /api/logs/{id}  — single log entry
    @GetMapping("/{id}")
    public ResponseEntity<AlertLog> getLogById(@PathVariable Long id) {
        return alertLogRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // GET /api/logs/status/{status}  — filter by PENDING / SENT / FAILED
    @GetMapping("/status/{status}")
    public ResponseEntity<List<AlertLog>> getByStatus(@PathVariable String status) {
        try {
            AlertLog.AlertStatus alertStatus = AlertLog.AlertStatus.valueOf(status.toUpperCase());
            return ResponseEntity.ok(alertLogRepository.findByAlertStatus(alertStatus));
        } catch (IllegalArgumentException e) {
            log.warn("Invalid status filter: {}", status);
            return ResponseEntity.badRequest().build();
        }
    }

    // DELETE /api/logs/{id}  — remove a single log entry
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteLog(@PathVariable Long id) {
        if (!alertLogRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        alertLogRepository.deleteById(id);
        log.info("Deleted alert log id={}", id);
        return ResponseEntity.ok(Map.of("message", "Log deleted successfully"));
    }
}
