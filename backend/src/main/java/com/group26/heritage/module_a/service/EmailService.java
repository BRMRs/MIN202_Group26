package com.group26.heritage.module_a.service;

import com.group26.heritage.common.config.AppProperties;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final AppProperties appProperties;

    @Value("${spring.mail.username}")
    private String fromAddress;

    public EmailService(JavaMailSender mailSender, AppProperties appProperties) {
        this.mailSender = mailSender;
        this.appProperties = appProperties;
    }

    public void sendVerificationEmail(String toEmail, String token) {
        String link = appProperties.getBaseUrl() + "/api/auth/verify-email?token=" + token;
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(fromAddress);
        msg.setTo(toEmail);
        msg.setSubject("Heritage Platform - Verify Your Email");
        msg.setText("Welcome to Heritage Platform!\n\n"
                + "Please click the link below to verify your email address:\n"
                + link + "\n\n"
                + "This link will expire in 24 hours.\n\n"
                + "If you did not register, please ignore this email.");
        mailSender.send(msg);
    }

    public void sendApprovalEmail(String toEmail, String username) {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(fromAddress);
        msg.setTo(toEmail);
        msg.setSubject("Heritage Platform - Contributor Application Approved");
        msg.setText("Dear " + username + ",\n\n"
                + "Congratulations! Your application to become a Contributor has been approved.\n"
                + "You can now log in and start submitting heritage resources.\n\n"
                + "Heritage Platform Team");
        mailSender.send(msg);
    }

    public void sendRejectionEmail(String toEmail, String username) {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(fromAddress);
        msg.setTo(toEmail);
        msg.setSubject("Heritage Platform - Contributor Application Update");
        msg.setText("Dear " + username + ",\n\n"
                + "Thank you for your interest in becoming a Contributor.\n"
                + "Unfortunately, your application has not been approved at this time.\n"
                + "You are welcome to apply again in the future.\n\n"
                + "Heritage Platform Team");
        mailSender.send(msg);
    }
}
