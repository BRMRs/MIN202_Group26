package com.group26.heritage.module_a.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("EmailVerificationService Unit Tests")
class EmailVerificationServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @InjectMocks
    private EmailVerificationService emailVerificationService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(emailVerificationService, "fromEmail", "noreply@heritage-test.com");
    }

    @Test
    @DisplayName("sendCode - should send email with a 6-digit verification code")
    void sendCode_ShouldSendEmail_WithSixDigitCode() {
        emailVerificationService.sendCode("user@example.com");

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());
        SimpleMailMessage sent = captor.getValue();
        assertThat(sent.getTo()).containsExactly("user@example.com");
        assertThat(sent.getText()).matches("(?s).*\\d{6}.*");
    }

    @Test
    @DisplayName("sendCode - should reject repeated requests within cooldown")
    void sendCode_ShouldThrow_WhenRequestedTooSoon() {
        emailVerificationService.sendCode("user@example.com");

        assertThatThrownBy(() -> emailVerificationService.sendCode("user@example.com"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Please wait");
    }

    @Test
    @DisplayName("verifyCode - should return true when code is correct")
    void verifyCode_ShouldReturnTrue_WhenCodeIsCorrect() {
        emailVerificationService.sendCode("user@example.com");
        String code = captureLastSentCode();

        assertThat(emailVerificationService.verifyCode("user@example.com", code)).isTrue();
    }

    @Test
    @DisplayName("verifyCode - should return false when code is wrong")
    void verifyCode_ShouldReturnFalse_WhenCodeIsWrong() {
        emailVerificationService.sendCode("user@example.com");

        assertThat(emailVerificationService.verifyCode("user@example.com", "000000")).isFalse();
    }

    @Test
    @DisplayName("verifyCode - should return false when email has no pending code")
    void verifyCode_ShouldReturnFalse_WhenNoPendingCode() {
        assertThat(emailVerificationService.verifyCode("nobody@example.com", "123456")).isFalse();
    }

    @Test
    @DisplayName("verifyCode - should consume code so it cannot be reused")
    void verifyCode_ShouldConsumeCode_SoItCannotBeReused() {
        emailVerificationService.sendCode("user@example.com");
        String code = captureLastSentCode();

        boolean first = emailVerificationService.verifyCode("user@example.com", code);
        boolean second = emailVerificationService.verifyCode("user@example.com", code);

        assertThat(first).isTrue();
        assertThat(second).isFalse();
    }

    @Test
    @DisplayName("verifyCode - should reject expired verification code")
    void verifyCode_ShouldReturnFalse_WhenCodeIsExpired() throws InterruptedException {
        ReflectionTestUtils.setField(emailVerificationService, "codeTtlMillis", 1L);
        emailVerificationService.sendCode("user@example.com");
        String code = captureLastSentCode();

        Thread.sleep(5);

        assertThat(emailVerificationService.verifyCode("user@example.com", code)).isFalse();
    }

    @Test
    @DisplayName("sendResetCode - should send email with 6-digit reset code")
    void sendResetCode_ShouldSendEmail_WithSixDigitCode() {
        emailVerificationService.sendResetCode("user@example.com");

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());
        SimpleMailMessage sent = captor.getValue();
        assertThat(sent.getTo()).containsExactly("user@example.com");
        assertThat(sent.getSubject()).contains("Reset");
        assertThat(sent.getText()).matches("(?s).*\\d{6}.*");
    }

    @Test
    @DisplayName("sendResetCode - should reject repeated requests within cooldown")
    void sendResetCode_ShouldThrow_WhenRequestedTooSoon() {
        emailVerificationService.sendResetCode("user@example.com");

        assertThatThrownBy(() -> emailVerificationService.sendResetCode("user@example.com"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Please wait");
    }

    @Test
    @DisplayName("verifyResetCode - should return true and consume code when correct")
    void verifyResetCode_ShouldReturnTrueAndConsumeCode_WhenCorrect() {
        emailVerificationService.sendResetCode("user@example.com");
        String code = captureLastSentCode();

        boolean result = emailVerificationService.verifyResetCode("user@example.com", code);

        assertThat(result).isTrue();
        assertThat(emailVerificationService.verifyResetCode("user@example.com", code)).isFalse();
    }

    @Test
    @DisplayName("verifyResetCode - should return false when code is wrong")
    void verifyResetCode_ShouldReturnFalse_WhenCodeIsWrong() {
        emailVerificationService.sendResetCode("user@example.com");
        assertThat(emailVerificationService.verifyResetCode("user@example.com", "000000")).isFalse();
    }

    @Test
    @DisplayName("peekResetCode - should return true without consuming the code")
    void peekResetCode_ShouldReturnTrue_WithoutConsumingCode() {
        emailVerificationService.sendResetCode("user@example.com");
        String code = captureLastSentCode();

        boolean first = emailVerificationService.peekResetCode("user@example.com", code);
        boolean second = emailVerificationService.peekResetCode("user@example.com", code);

        assertThat(first).isTrue();
        assertThat(second).isTrue();
    }

    @Test
    @DisplayName("sendApplicationApprovedEmail - should send approval notification email")
    void sendApplicationApprovedEmail_ShouldSendEmail_WithApprovalMessage() {
        emailVerificationService.sendApplicationApprovedEmail("applicant@example.com");

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());
        SimpleMailMessage sent = captor.getValue();
        assertThat(sent.getTo()).containsExactly("applicant@example.com");
        assertThat(sent.getSubject()).contains("Contributor Application Result");
        assertThat(sent.getText()).containsIgnoringCase("approved");
    }

    @Test
    @DisplayName("sendApplicationRejectedEmail - should send rejection notification email")
    void sendApplicationRejectedEmail_ShouldSendEmail_WithRejectionMessage() {
        emailVerificationService.sendApplicationRejectedEmail("applicant@example.com");

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());
        SimpleMailMessage sent = captor.getValue();
        assertThat(sent.getTo()).containsExactly("applicant@example.com");
        assertThat(sent.getSubject()).contains("Contributor Application Result");
        assertThat(sent.getText()).containsIgnoringCase("not approved");
    }

    private String captureLastSentCode() {
        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender, atLeastOnce()).send(captor.capture());
        String body = captor.getValue().getText();
        return extractCode(body);
    }

    private String extractCode(String text) {
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("\\b(\\d{6})\\b").matcher(text);
        assertThat(m.find()).as("Email body should contain a 6-digit code").isTrue();
        return m.group(1);
    }
}
