package com.dscribe.patients;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** The fixed dropdown lists + the server-side checks that depend on them. */
public final class Options {
    public static final List<String> GENDERS = List.of("Male", "Female", "Other");
    public static final List<String> WARDS = List.of("General Ward", "ICU", "Emergency Ward", "Surgical Ward", "Maternity Ward", "Pediatric Ward");
    public static final List<String> DEPARTMENTS = List.of("General Medicine", "Cardiology", "Neurology", "Orthopedics", "Pediatrics", "Gynecology");
    public static final List<String> DOCTORS = List.of("Dr. Anil Sharma", "Dr. Priya Nair", "Dr. Rahul Mehta", "Dr. Sneha Iyer", "Dr. Vikram Rao", "Dr. Kavita Desai");
    public static final List<String> STATUSES = List.of("Admitted", "Discharged");
    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");

    private Options() {}

    public static Map<String, List<String>> all() {
        Map<String, List<String>> m = new LinkedHashMap<>();
        m.put("genders", GENDERS);
        m.put("wards", WARDS);
        m.put("departments", DEPARTMENTS);
        m.put("doctors", DOCTORS);
        return m;
    }

    public static void check(PatientRequest r) {
        Map<String, String> e = new LinkedHashMap<>();
        oneOf(e, "gender", "Gender", r.gender(), GENDERS);
        oneOf(e, "ward", "Ward", r.ward(), WARDS);
        oneOf(e, "department", "Department", r.department(), DEPARTMENTS);
        oneOf(e, "doctor", "Doctor", r.doctor(), DOCTORS);
        if (r.status() != null && !STATUSES.contains(r.status())) e.put("status", "Status must be Admitted or Discharged");
        if (r.admissionDate() != null && r.admissionDate().isAfter(LocalDate.now(IST)))
            e.put("admissionDate", "Admission date cannot be in the future");
        if (!e.isEmpty()) throw new ApiExceptionHandler.FieldErrors(e);
    }

    private static void oneOf(Map<String, String> e, String key, String label, String value, List<String> allowed) {
        if (value != null && !value.isBlank() && !allowed.contains(value))
            e.put(key, label + " must be one of: " + String.join(", ", allowed));
    }
}
