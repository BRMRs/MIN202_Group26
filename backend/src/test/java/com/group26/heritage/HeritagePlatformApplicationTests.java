package com.group26.heritage;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import com.group26.heritage.config.DefaultCategoryBootstrap;

/**
 * Smoke test: verifies the Spring context loads against H2.
 * DefaultCategoryBootstrap is mocked out to avoid startup queries on empty schema.
 */
@SpringBootTest
@ActiveProfiles("test")
class HeritagePlatformApplicationTests {

    // Mock the bootstrap runner so it doesn't query categories on startup
    @MockBean
    DefaultCategoryBootstrap defaultCategoryBootstrap;

    @Test
    void contextLoads() {
    }
}
