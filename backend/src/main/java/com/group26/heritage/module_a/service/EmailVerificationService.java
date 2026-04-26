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

    private final Map<String, String> pendingCodes = new ConcurrentHashMap<>();
    private final Map<String, String> resetCodes = new ConcurrentHashMap<>();

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

    public void sendResetCode(String email) {
        String code = String.format("%06d", random.nextInt(1_000_000));
        resetCodes.put(email, code);

        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(fromEmail);
        msg.setTo(email);
        msg.setSubject("Heritage Platform — Password Reset Code");
        msg.setText("Your password reset code is: " + code + "\n\nEnter this code to set a new password.");
        mailSender.send(msg);
    }

    public boolean verifyResetCode(String email, String code) {
        String stored = resetCodes.get(email);
        if (stored != null && stored.equals(code)) {
            resetCodes.remove(email);
            return true;
        }
        return false;
    }

    /** Check the reset code is correct without consuming it. */
    public boolean peekResetCode(String email, String code) {
        String stored = resetCodes.get(email);
        return stored != null && stored.equals(code);
    }
}
