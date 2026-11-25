package com.dscribe.patients;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

/** Incoming payload for create / update. Format rules live here; list + date rules in Options.check(). */
public record PatientRequest(
        @NotBlank(message = "Name is required")
        @Size(max = 100, message = "Name must be at most 100 characters")
        @Pattern(regexp = "^(\\p{L}+(?: \\p{L}+)*)?$", message = "Name must contain letters only")
        String name,

        @NotNull(message = "Age is required")
        @Min(value = 0, message = "Age must be between 0 and 120")
        @Max(value = 120, message = "Age must be between 0 and 120")
        Integer age,

        @NotBlank(message = "Gender is required") String gender,
        @NotBlank(message = "Ward is required") String ward,
        @NotBlank(message = "Department is required") String department,
        @NotBlank(message = "Doctor is required") String doctor,
        @NotNull(message = "Admission date is required") LocalDate admissionDate,
        String status) {
}
