package com.dscribe.patients;

import jakarta.persistence.*;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "patients")
@Getter
@Setter
public class Patient {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;
    @Column(nullable = false)
    private Integer age;
    @Column(nullable = false)
    private String gender;
    @Column(nullable = false)
    private String ward;
    @Column(nullable = false)
    private String department;
    @Column(nullable = false)
    private String doctor;
    @Column(nullable = false)
    private LocalDate admissionDate;
    @Column(nullable = false)
    private String status; // Admitted | Discharged
}
