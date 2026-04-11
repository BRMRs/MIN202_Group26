package com.group26.heritage.common.util;

// Shared validation limits — keeps frontend and backend in sync.
// Update both this file and constants.js if any value changes.
public final class ValidationConstants {

    private ValidationConstants() {} // not meant to be instantiated

    /** min password length — PBI 1.1 password strength requirement */
    public static final int MIN_PASSWORD_LENGTH = 8;

    /** bio field cap — PBI 1.4 */
    public static final int MAX_BIO_LENGTH = 50;

    /** comment body cap — PBI D-5 */
    public static final int MAX_COMMENT_LENGTH = 500;

    /** review feedback word limit — PBI C-3 */
    public static final int MAX_FEEDBACK_WORDS = 500;

    /** file upload limit in MB */
    public static final int MAX_FILE_SIZE_MB = 10;
}
