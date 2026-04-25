package com.group26.heritage.module_a.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class EmailVerificationService {

    private final JavaMailSender mailSender;

    @Value("${app.email.from}")
    private String fromEmail;

    // email -> code (no expiry as per requirement)
    private final Map<String, String> pendingCodes = new ConcurrentHashMap<>();

    private final SecureRandom random = new SecureRandom();

    public EmailVerificationService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendCode(String email) {
        String code = String.format("%06d", random.nextInt(1_000_000));
        pendingCodes.put(email, code);

        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(fromEmail);
        msg.setTo(email);
        msg.setSubject("Heritage Platform — Email Verification Code");
        msg.setText("Your verification code is: " + code + "\n\nEnter this code to complete your registration.");
        mailSender.send(msg);
    }

    public boolean verifyCode(String email, String code) {
        String stored = pendingCodes.get(email);
        if (stored != null && stored.equals(code)) {
            pendingCodes.remove(email);
            return true;
        }
        return false;
    }
}
