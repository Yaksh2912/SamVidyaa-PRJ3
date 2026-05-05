package com.samvidya.util;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;

import java.io.IOException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

/**
 * A lenient deserializer for LocalDateTime that handles various formats,
 * including ISO with milliseconds and UTC "Z" suffixes, which are common
 * in Javascript and other systems.
 */
public class LenientLocalDateTimeDeserializer extends JsonDeserializer<LocalDateTime> {

    @Override
    public LocalDateTime deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        String dateStr = p.getText();
        if (dateStr == null || dateStr.trim().isEmpty()) {
            return null;
        }
        
        dateStr = dateStr.trim();
        
        try {
            // First try standard ISO Instant (e.g. 2026-05-03T12:44:35.791Z)
            if (dateStr.endsWith("Z")) {
                Instant instant = Instant.parse(dateStr);
                return LocalDateTime.ofInstant(instant, ZoneId.systemDefault());
            }
            
            // Try specific pattern from earlier format
            if (dateStr.length() == 19 && !dateStr.contains("T")) {
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
                return LocalDateTime.parse(dateStr, formatter);
            }
            
            // Try ISO local date time (e.g. 2026-05-03T12:44:35 or 2026-05-03T12:44:35.791)
            return LocalDateTime.parse(dateStr, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
            
        } catch (DateTimeParseException e) {
            try {
                // Try fallback formats
                DateTimeFormatter fallbackFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");
                return LocalDateTime.parse(dateStr, fallbackFormatter);
            } catch (DateTimeParseException e2) {
                // If all else fails, let Jackson throw the standard IOException
                throw new IOException("Cannot parse date: " + dateStr + ". Expected format like yyyy-MM-dd'T'HH:mm:ss or ISO-8601.", e2);
            }
        }
    }
}
