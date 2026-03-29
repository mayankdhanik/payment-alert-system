package com.payments.alert.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * JPA Entity representing a persisted alert log record.
 * Each record tracks the full lifecycle of a payment notification.
 */
@Entity
@Table(name = "alert_logs", indexes = {
        @Index(name = "idx_customer_no", columnList = "customerNo"),
        @Index(name = "idx_payment_type", columnList = "paymentType"),
        @Index(name = "idx_alert_status", columnList = "alertStatus"),
        @Index(name = "idx_txn_ref_no", columnList = "txnRefNo")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlertLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // -----------------------------------------------
    // Customer Identification
    // -----------------------------------------------
    @Column(nullable = false, length = 20)
    private String customerNo;

    @Column(length = 15)
    private String mobileNo;

    @Column(length = 100)
    private String emailId;

    // -----------------------------------------------
    // Payment Details
    // -----------------------------------------------
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private PaymentType paymentType;

    @Column(nullable = false, length = 50, unique = true)
    private String txnRefNo;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(length = 5)
    @Builder.Default
    private String currency = "INR";

    // -----------------------------------------------
    // Account Numbers (stored masked)
    // -----------------------------------------------
    @Column(length = 25)
    private String drAcNo;

    @Column(length = 25)
    private String crAcNo;

    @Column(length = 25)
    private String rrn;

    // -----------------------------------------------
    // Alert Classification
    // -----------------------------------------------
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private AlertType alertType;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    @Builder.Default
    private AlertStatus alertStatus = AlertStatus.PENDING;

    @Column(length = 500)
    private String failureReason;

    // -----------------------------------------------
    // Timestamps
    // -----------------------------------------------
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime sentAt;

    // -----------------------------------------------
    // Enumerations
    // -----------------------------------------------
    public enum PaymentType {
        NEFT, IMPS, RTGS
    }

    public enum AlertType {
        DR, CR, FAILURE
    }

    public enum AlertStatus {
        PENDING, SENT, FAILED
    }
}
