package com.samvidya.util;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class BCryptUtilTest {

    @Test
    public void testPasswordHashing() {
        String plainPassword = "testPassword123";
        String hashedPassword = BCryptUtil.hashPassword(plainPassword);
        
        assertNotNull(hashedPassword, "Hashed password should not be null");
        assertNotEquals(plainPassword, hashedPassword, "Hashed password should be different from plain password");
        assertTrue(hashedPassword.startsWith("$2a$"), "BCrypt hash should start with $2a$");
    }

    @Test
    public void testPasswordVerification() {
        String plainPassword = "mySecretPassword";
        String hashedPassword = BCryptUtil.hashPassword(plainPassword);
        
        assertTrue(BCryptUtil.verifyPassword(plainPassword, hashedPassword), 
                   "Correct password should verify successfully");
        
        assertFalse(BCryptUtil.verifyPassword("wrongPassword", hashedPassword), 
                    "Wrong password should not verify");
        
        assertFalse(BCryptUtil.verifyPassword("", hashedPassword), 
                    "Empty password should not verify");
    }

    @Test
    public void testDifferentHashesForSamePassword() {
        String plainPassword = "samePassword";
        String hash1 = BCryptUtil.hashPassword(plainPassword);
        String hash2 = BCryptUtil.hashPassword(plainPassword);
        
        assertNotEquals(hash1, hash2, "Different hashes should be generated for same password (salt)");
        
        assertTrue(BCryptUtil.verifyPassword(plainPassword, hash1), "First hash should verify");
        assertTrue(BCryptUtil.verifyPassword(plainPassword, hash2), "Second hash should verify");
    }
}