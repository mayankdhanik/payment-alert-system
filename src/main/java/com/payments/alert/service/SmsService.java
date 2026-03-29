package com.payments.alert.service;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class SmsService {

    @Value("${alert.system.mock-sms:true}")
    private boolean mockSms;

    @Value("${alert.system.twilio.account-sid:}")
    private String accountSid;

    @Value("${alert.system.twilio.auth-token:}")
    private String authToken;

    @Value("${alert.system.twilio.from-number:}")
    private String fromNumber;

    @PostConstruct
    public void init() {
        if (!mockSms && !accountSid.isBlank() && !authToken.isBlank()) {
            Twilio.init(accountSid, authToken);
            log.info("Twilio SMS service initialized. From number: {}", fromNumber);
        }
    }

    public boolean sendSms(String mobileNo, String message) {
        if (mockSms) {
            log.info("[MOCK SMS] To: {} | Message: {}", mobileNo, message);
            return true;
        }

        try {
            String formattedNumber = formatIndianNumber(mobileNo);
            log.info("Sending SMS via Twilio to: {}", formattedNumber);

            Message twilioMessage = Message.creator(
                    new PhoneNumber(formattedNumber),
                    new PhoneNumber(fromNumber),
                    message
            ).create();

            log.info("SMS sent | SID: {} | Status: {} | To: {}",
                    twilioMessage.getSid(), twilioMessage.getStatus(), formattedNumber);
            return true;

        } catch (Exception e) {
            log.error("Twilio SMS failed for {}: {}", mobileNo, e.getMessage());
            return false;
        }
    }

    private String formatIndianNumber(String mobileNo) {
        String digits = mobileNo.replaceAll("[^0-9]", "");
        if (digits.startsWith("91") && digits.length() == 12) {
            return "+" + digits;
        }
        if (digits.length() == 10) {
            return "+91" + digits;
        }
        return "+" + digits;
    }
}
