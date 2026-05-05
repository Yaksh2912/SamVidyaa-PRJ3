package com.samvidya.util;

import org.mindrot.jbcrypt.BCrypt;

public class BCryptUtil {
    private static final int ROUNDS = 12;

    /**
     * Hash a password using BCrypt
     */
    public static String hashPassword(String plainPassword) {
        return BCrypt.hashpw(plainPassword, BCrypt.gensalt(ROUNDS));
    }

    /**
     * Verify a password against its hash
     */
    public static boolean verifyPassword(String plainPassword, String hashedPassword) {
        try {
            return BCrypt.checkpw(plainPassword, hashedPassword);
        } catch (Exception e) {
            return false;
        }
    }
}