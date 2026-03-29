package com.payments.alert.repository;

import com.payments.alert.model.AlertLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlertLogRepository extends JpaRepository<AlertLog, Long> {

    List<AlertLog> findByCustomerNo(String customerNo);

    List<AlertLog> findByPaymentType(AlertLog.PaymentType paymentType);

    List<AlertLog> findByAlertStatus(AlertLog.AlertStatus alertStatus);
}
