package com.group26.heritage.common.util;

/**
 * Centralized validation constants — use these in all modules for consistency.
 * Source: Summary.pdf field constraints
 */
public final class ValidationConstants {

    private ValidationConstants() {
    } // Utility class — no instantiation

    /** Maximum bio length (Summary A-PBI 1.4: "50-character limit on bio field") */
    public static final int MAX_BIO_LENGTH = 50;

    /** Maximum comment length (Summary D-PBI 5: "enforce 500-character limit") */
    public static final int MAX_COMMENT_LENGTH = 500;

    /** Maximum feedback words (Summary C-PBI 3: "max 500 words") */
    public static final int MAX_FEEDBACK_WORDS = 500;

    /** Maximum file upload size in MB (application.properties: 10MB) */
    public static final int MAX_FILE_SIZE_MB = 10;
}
