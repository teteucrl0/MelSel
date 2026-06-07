package com.mellsell.common.jackson;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;

import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.format.ResolverStyle;

public class LocalDateBrDeserializer extends JsonDeserializer<LocalDate> {

    private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_LOCAL_DATE.withResolverStyle(ResolverStyle.STRICT);

    @Override
    public LocalDate deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        String text = p.getValueAsString();
        if (text == null || text.isBlank()) {
            throw new IllegalArgumentException("Data de nascimento é obrigatória.");
        }
        try {
            return LocalDate.parse(text.trim(), ISO);
        } catch (DateTimeParseException ex) {
            throw new IllegalArgumentException("Data de nascimento inválida. Use o formato dd/mm/aaaa (envie como aaaa-mm-dd).");
        }
    }
}