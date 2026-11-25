package com.dscribe.patients;

import com.fasterxml.jackson.databind.exc.MismatchedInputException;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

/** Every error leaves the API as: { "message": "...", "errors": { "field": "reason" } } */
@RestControllerAdvice
public class ApiExceptionHandler {

    public static class FieldErrors extends RuntimeException {
        final Map<String, String> errors;
        public FieldErrors(Map<String, String> errors) { this.errors = errors; }
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<Map<String, Object>> invalid(MethodArgumentNotValidException ex) {
        Map<String, String> errors = ex.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(FieldError::getField, FieldError::getDefaultMessage, (a, b) -> a, LinkedHashMap::new));
        return body(HttpStatus.BAD_REQUEST, errors);
    }

    @ExceptionHandler(FieldErrors.class)
    ResponseEntity<Map<String, Object>> invalid(FieldErrors ex) {
        return body(HttpStatus.BAD_REQUEST, ex.errors);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<Map<String, Object>> unreadable(HttpMessageNotReadableException ex) {
        Map<String, String> errors = new LinkedHashMap<>();
        if (ex.getCause() instanceof MismatchedInputException m && !m.getPath().isEmpty()) {
            String field = m.getPath().get(m.getPath().size() - 1).getFieldName();
            errors.put(field, "Invalid value for '" + field + "'");
        } else {
            errors.put("body", "Request body is missing or not valid JSON");
        }
        return body(HttpStatus.BAD_REQUEST, errors);
    }

    @ExceptionHandler(ResponseStatusException.class)
    ResponseEntity<Map<String, Object>> status(ResponseStatusException ex) {
        return ResponseEntity.status(ex.getStatusCode()).body(Map.of("message", ex.getReason(), "errors", Map.of()));
    }

    private ResponseEntity<Map<String, Object>> body(HttpStatus status, Map<String, String> errors) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("message", String.join("; ", errors.values()));
        out.put("errors", errors);
        return ResponseEntity.status(status).body(out);
    }
}
