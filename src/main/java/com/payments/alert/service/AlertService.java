package com.payments.alert.service;

import com.payments.alert.model.AlertLog;
import com.payments.alert.model.AlertRequest;

import java.util.List;

/**
 * Service contract for the Payment Alert System.
 * Implementations are responsible for persisting alert logs,
 * dispatching email notifications, and retrieving historical data.
 */
public interface AlertService {

    /**
     * Process an inbound alert request:
     * 1. Build and persist an AlertLog record.
     * 2. Format the notification message based on payment type and alert type.
     * 3. Dispatch an email to the customer's email address.
     * 4. Update the log status (SENT / FAILED) and return it.
     *
     * @param request validated alert request DTO
     * @return the persisted AlertLog with final status
     */
    AlertLog sendAlert(AlertRequest request);

    /**
     * Retrieve the complete history of all alert logs,
     * ordered by creation date descending.
     *
     * @return list of all AlertLog records
     */
    List<AlertLog> getAlertHistory();

    /**
     * Retrieve all alert logs for a specific customer.
     *
     * @param customerNo the customer identifier
     * @return list of AlertLog records for that customer
     */
    List<AlertLog> getAlertsByCustomer(String customerNo);

    /**
     * Retrieve all alert logs for a specific payment type (NEFT / IMPS / RTGS).
     *
     * @param paymentType string representation of PaymentType enum value
     * @return list of AlertLog records matching the payment type
     */
    List<AlertLog> getAlertsByPaymentType(String paymentType);
}
