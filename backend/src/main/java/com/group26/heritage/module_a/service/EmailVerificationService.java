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
    private final Map<String, Long> pendingCodeCreatedAt = new ConcurrentHashMap<>();
    private final Map<String, Long> resetCodeCreatedAt = new ConcurrentHashMap<>();
    private long codeTtlMillis = 5 * 60 * 1000;
    private long resendCooldownMillis = 60 * 1000;

    private final SecureRandom random = new SecureRandom();

    public EmailVerificationService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendCode(String email) {
        ensureCanSend(pendingCodeCreatedAt.get(email));
        String code = String.format("%06d", random.nextInt(1_000_000));
        pendingCodes.put(email, code);
        pendingCodeCreatedAt.put(email, System.currentTimeMillis());

        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(fromEmail);
        msg.setTo(email);
        msg.setSubject("Heritage Platform — Email Verification Code");
        msg.setText("Your verification code is: " + code
                + "\n\nEnter this code to complete your registration."
                + "\nThis code is valid for 5 minutes.");
        mailSender.send(msg);
    }

    public boolean verifyCode(String email, String code) {
        String stored = pendingCodes.get(email);
        Long createdAt = pendingCodeCreatedAt.get(email);
        if (isExpired(createdAt)) {
            pendingCodes.remove(email);
            pendingCodeCreatedAt.remove(email);
            return false;
        }
        if (stored != null && stored.equals(code)) {
            pendingCodes.remove(email);
            pendingCodeCreatedAt.remove(email);
            return true;
        }
        return false;
    }

    public void sendResetCode(String email) {
        ensureCanSend(resetCodeCreatedAt.get(email));
        String code = String.format("%06d", random.nextInt(1_000_000));
        resetCodes.put(email, code);
        resetCodeCreatedAt.put(email, System.currentTimeMillis());

        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(fromEmail);
        msg.setTo(email);
        msg.setSubject("Heritage Platform — Password Reset Code");
        msg.setText("Your password reset code is: " + code
                + "\n\nEnter this code to set a new password."
                + "\nThis code is valid for 5 minutes.");
        mailSender.send(msg);
    }

    public boolean verifyResetCode(String email, String code) {
        String stored = resetCodes.get(email);
        Long createdAt = resetCodeCreatedAt.get(email);
        if (isExpired(createdAt)) {
            resetCodes.remove(email);
            resetCodeCreatedAt.remove(email);
            return false;
        }
        if (stored != null && stored.equals(code)) {
            resetCodes.remove(email);
            resetCodeCreatedAt.remove(email);
            return true;
        }
        return false;
    }

    /** Check the reset code is correct without consuming it. */
    public boolean peekResetCode(String email, String code) {
        String stored = resetCodes.get(email);
        Long createdAt = resetCodeCreatedAt.get(email);
        if (isExpired(createdAt)) {
            resetCodes.remove(email);
            resetCodeCreatedAt.remove(email);
            return false;
        }
        return stored != null && stored.equals(code);
    }

    private boolean isExpired(Long createdAt) {
        return createdAt == null || System.currentTimeMillis() - createdAt > codeTtlMillis;
    }

    private void ensureCanSend(Long lastSentAt) {
        if (lastSentAt != null && System.currentTimeMillis() - lastSentAt < resendCooldownMillis) {
            throw new IllegalArgumentException("Please wait before requesting another code.");
        }
    }

    public void sendApplicationApprovedEmail(String email) {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(fromEmail);
        msg.setTo(email);
        msg.setSubject("Heritage Platform — Contributor Application Result");
        msg.setText("Congratulations! Your Contributor application has been approved.");
        mailSender.send(msg);
    }

    public void sendApplicationRejectedEmail(String email) {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(fromEmail);
        msg.setTo(email);
        msg.setSubject("Heritage Platform — Contributor Application Result");
        msg.setText("Your application has been reviewed and was not approved at this time.");
        mailSender.send(msg);
    }
}
