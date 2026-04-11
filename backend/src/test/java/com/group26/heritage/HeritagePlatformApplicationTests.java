package com.group26.heritage;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * Main application context load test.
 * Verifies that the Spring Boot application context loads successfully.
 * Run: ./mvnw test
 */
@SpringBootTest
class HeritagePlatformApplicationTests {

    @Test
    void contextLoads() {
        // TODO: Add integration tests for cross-module flows:
        // - User registration → login → get JWT
        // - Contributor submits resource → reviewer approves → viewer discovers
    }
}
