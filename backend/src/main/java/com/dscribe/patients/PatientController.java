package com.dscribe.patients;

import jakarta.persistence.criteria.Predicate;
import jakarta.validation.Valid;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
public class PatientController {
    private final PatientRepository repo;

    public PatientController(PatientRepository repo) {
        this.repo = repo;
    }

    @GetMapping("/options")
    public Map<String, List<String>> options() {
        return Options.all();
    }

    @GetMapping("/patients")
    public List<Patient> list(@RequestParam(required = false) String search,
                              @RequestParam(required = false) String ward,
                              @RequestParam(required = false) String department,
                              @RequestParam(required = false) String doctor) {
        Specification<Patient> spec = (root, query, cb) -> {
            List<Predicate> p = new ArrayList<>();
            if (has(search)) p.add(cb.like(cb.lower(root.get("name")), "%" + search.trim().toLowerCase() + "%"));
            if (has(ward)) p.add(cb.equal(root.get("ward"), ward));
            if (has(department)) p.add(cb.equal(root.get("department"), department));
            if (has(doctor)) p.add(cb.equal(root.get("doctor"), doctor));
            return cb.and(p.toArray(new Predicate[0]));
        };
        return repo.findAll(spec, Sort.by(Sort.Direction.DESC, "id"));
    }

    @PostMapping("/patients")
    @ResponseStatus(HttpStatus.CREATED)
    public Patient create(@Valid @RequestBody PatientRequest req) {
        Options.check(req);
        return repo.save(apply(new Patient(), req));
    }

    @PutMapping("/patients/{id}")
    public Patient update(@PathVariable Long id, @Valid @RequestBody PatientRequest req) {
        Options.check(req);
        return repo.save(apply(find(id), req));
    }

    @PatchMapping("/patients/{id}/discharge")
    public Patient discharge(@PathVariable Long id) {
        Patient p = find(id);
        p.setStatus("Discharged");
        return repo.save(p);
    }

    @DeleteMapping("/patients/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        repo.delete(find(id));
    }

    private Patient find(Long id) {
        return repo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Patient not found"));
    }

    private Patient apply(Patient p, PatientRequest r) {
        p.setName(r.name().trim());
        p.setAge(r.age());
        p.setGender(r.gender());
        p.setWard(r.ward());
        p.setDepartment(r.department());
        p.setDoctor(r.doctor());
        p.setAdmissionDate(r.admissionDate());
        if (r.status() != null) p.setStatus(r.status());
        else if (p.getStatus() == null) p.setStatus("Admitted");
        return p;
    }

    private boolean has(String s) {
        return s != null && !s.isBlank();
    }
}
