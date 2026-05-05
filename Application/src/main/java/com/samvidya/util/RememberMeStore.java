package com.samvidya.util;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;

public class RememberMeStore {
    private static final String STORE_FILE = System.getProperty("user.home") + "/.samvidya/remember_me.dat";
    private static final String KEY_FILE = System.getProperty("user.home") + "/.samvidya/key.dat";
    private static final String ALGORITHM = "AES";
    
    public static class SavedLogin {
        public String username;
        public String password; // encrypted
        public long lastUsed;
        
        public SavedLogin(String username, String password, long lastUsed) {
            this.username = username;
            this.password = password;
            this.lastUsed = lastUsed;
        }
    }
    
    private SecretKey getOrCreateKey() {
        try {
            Path keyPath = Paths.get(KEY_FILE);
            if (Files.exists(keyPath)) {
                byte[] keyBytes = Files.readAllBytes(keyPath);
                return new SecretKeySpec(keyBytes, ALGORITHM);
            } else {
                // Create new key
                KeyGenerator keyGen = KeyGenerator.getInstance(ALGORITHM);
                keyGen.init(128);
                SecretKey key = keyGen.generateKey();
                
                // Ensure directory exists
                Files.createDirectories(keyPath.getParent());
                Files.write(keyPath, key.getEncoded());
                return key;
            }
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
    
    public String encode(String plainText) {
        if (plainText == null || plainText.isEmpty()) return "";
        try {
            SecretKey key = getOrCreateKey();
            if (key == null) return plainText; // fallback to plain text
            
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, key);
            byte[] encrypted = cipher.doFinal(plainText.getBytes());
            return Base64.getEncoder().encodeToString(encrypted);
        } catch (Exception e) {
            e.printStackTrace();
            return plainText; // fallback to plain text
        }
    }
    
    public String decode(String encodedText) {
        if (encodedText == null || encodedText.isEmpty()) return "";
        try {
            SecretKey key = getOrCreateKey();
            if (key == null) return encodedText; // fallback to encoded text
            
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, key);
            byte[] decoded = Base64.getDecoder().decode(encodedText);
            byte[] decrypted = cipher.doFinal(decoded);
            return new String(decrypted);
        } catch (Exception e) {
            // If decryption fails, might be plain text
            return encodedText;
        }
    }
    
    public List<SavedLogin> load() {
        List<SavedLogin> logins = new ArrayList<>();
        try {
            Path storePath = Paths.get(STORE_FILE);
            if (!Files.exists(storePath)) {
                return logins;
            }
            
            List<String> lines = Files.readAllLines(storePath);
            for (String line : lines) {
                String[] parts = line.split("\\|", 3);
                if (parts.length == 3) {
                    String username = parts[0];
                    String password = parts[1];
                    long lastUsed = Long.parseLong(parts[2]);
                    logins.add(new SavedLogin(username, password, lastUsed));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return logins;
    }
    
    public void save(List<SavedLogin> logins) {
        try {
            Path storePath = Paths.get(STORE_FILE);
            Files.createDirectories(storePath.getParent());
            
            List<String> lines = logins.stream()
                .map(login -> login.username + "|" + login.password + "|" + login.lastUsed)
                .collect(Collectors.toList());
            
            Files.write(storePath, lines);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    public void upsert(List<SavedLogin> logins, String username, String password) {
        long now = System.currentTimeMillis() / 1000L;
        String encodedPassword = encode(password);
        
        // Find existing login
        SavedLogin existing = null;
        for (SavedLogin login : logins) {
            if (login.username != null && login.username.equalsIgnoreCase(username)) {
                existing = login;
                break;
            }
        }
        
        if (existing != null) {
            existing.password = encodedPassword;
            existing.lastUsed = now;
        } else {
            logins.add(new SavedLogin(username, encodedPassword, now));
        }
        
        // Keep only last 10 logins, sorted by lastUsed
        logins.sort((a, b) -> Long.compare(b.lastUsed, a.lastUsed));
        if (logins.size() > 10) {
            logins.subList(10, logins.size()).clear();
        }
    }
    
    public List<SavedLogin> suggest(List<SavedLogin> logins, String prefix, int maxResults) {
        return logins.stream()
            .filter(login -> login.username != null && 
                           login.username.toLowerCase().startsWith(prefix.toLowerCase()))
            .sorted((a, b) -> Long.compare(b.lastUsed, a.lastUsed))
            .limit(maxResults)
            .collect(Collectors.toList());
    }
}