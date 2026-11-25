import { useCallback, useEffect, useState } from 'react';
import { api } from './api';

const today = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
const EMPTY = { name: '', age: '', gender: '', ward: '', department: '', doctor: '', admissionDate: '', status: 'Admitted' };
const LABELS = { gender: 'Gender', ward: 'Ward', department: 'Department', doctor: 'Doctor' };

// Mirrors the backend rules so people get instant feedback (backend re-checks everything).
function validate(f) {
  const e = {};
  const name = f.name.trim();
  if (!name) e.name = 'Name is required';
  else if (!/^\p{L}+(?: \p{L}+)*$/u.test(name)) e.name = 'Name must contain letters only';
  if (f.age === '' || f.age === null) e.age = 'Age is required';
  else if (!/^\d+$/.test(String(f.age)) || Number(f.age) > 120) e.age = 'Age must be a whole number between 0 and 120';
  Object.keys(LABELS).forEach((k) => { if (!f[k]) e[k] = `${LABELS[k]} is required`; });
  if (!f.admissionDate) e.admissionDate = 'Admission date is required';
  else if (f.admissionDate > today()) e.admissionDate = 'Admission date cannot be in the future';
  return e;
}

const fmtDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

function Select({ value, onChange, items, placeholder, ...rest }) {
  return (
    <select value={value} onChange={onChange} {...rest}>
      <option value="">{placeholder}</option>
      {items.map((i) => <option key={i} value={i}>{i}</option>)}
    </select>
  );
}

function Field({ label, error, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {error && <small className="err">{error}</small>}
    </label>
  );
}

function PatientForm({ patient, opts, onSave, onClose }) {
  const isEdit = Boolean(patient.id);
  const [f, setF] = useState(isEdit ? { ...patient } : EMPTY);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(ev) {
    ev.preventDefault();
    const errs = validate(f);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      await onSave({ ...f, name: f.name.trim(), age: Number(f.age) });
    } catch (err) {
      setErrors({ ...err.errors, _form: err.message });
      setBusy(false);
    }
  }

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal" onSubmit={submit} noValidate role="dialog" aria-modal="true">
        <h2>{isEdit ? 'Edit patient' : 'Admit a patient'}</h2>
        {errors._form && !Object.keys(errors).some((k) => k !== '_form') && <p className="banner">{errors._form}</p>}
        <div className="grid">
          <Field label="Full name" error={errors.name}>
            <input value={f.name} onChange={set('name')} placeholder="e.g. Asha Verma" maxLength={100} />
          </Field>
          <Field label="Age" error={errors.age}>
            <input type="number" min="0" max="120" step="1" value={f.age} onChange={set('age')} placeholder="0–120" />
          </Field>
          <Field label="Gender" error={errors.gender}>
            <Select value={f.gender} onChange={set('gender')} items={opts.genders} placeholder="Select gender" />
          </Field>
          <Field label="Admission date" error={errors.admissionDate}>
            <input type="date" max={today()} value={f.admissionDate} onChange={set('admissionDate')} />
          </Field>
          <Field label="Ward" error={errors.ward}>
            <Select value={f.ward} onChange={set('ward')} items={opts.wards} placeholder="Select ward" />
          </Field>
          <Field label="Department" error={errors.department}>
            <Select value={f.department} onChange={set('department')} items={opts.departments} placeholder="Select department" />
          </Field>
          <Field label="Doctor" error={errors.doctor}>
            <Select value={f.doctor} onChange={set('doctor')} items={opts.doctors} placeholder="Select doctor" />
          </Field>
          {isEdit && (
            <Field label="Status" error={errors.status}>
              <Select value={f.status} onChange={set('status')} items={['Admitted', 'Discharged']} placeholder="Select status" />
            </Field>
          )}
        </div>
        <div className="actions">
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn primary" disabled={busy}>
            {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Admit patient'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function App() {
  const [opts, setOpts] = useState({ genders: [], wards: [], departments: [], doctors: [] });
  const [patients, setPatients] = useState([]);
  const [filters, setFilters] = useState({ search: '', ward: '', department: '', doctor: '' });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [editing, setEditing] = useState(null); // null = closed, {} = new, patient = edit
  const [deleting, setDeleting] = useState(null);

  const notify = (text, type = 'ok') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    try {
      setPatients(await api.list(filters));
    } catch (e) {
      notify(e.message, 'err');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { api.options().then(setOpts).catch((e) => notify(e.message, 'err')); }, []);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  const setFilter = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });
  const hasFilters = Object.values(filters).some(Boolean);

  async function save(data) {
    if (data.id) await api.update(data.id, data);
    else await api.create(data);
    setEditing(null);
    notify(data.id ? 'Changes saved' : 'Patient admitted');
    load();
  }

  async function discharge(p) {
    try { await api.discharge(p.id); notify(`${p.name} discharged`); load(); }
    catch (e) { notify(e.message, 'err'); }
  }

  async function confirmDelete() {
    try { await api.remove(deleting.id); notify('Patient deleted'); load(); }
    catch (e) { notify(e.message, 'err'); }
    setDeleting(null);
  }

  return (
    <div className="app">
      <header className="top">
        <div>
          <h1>Ward Desk</h1>
          <p>{patients.length} {patients.length === 1 ? 'patient' : 'patients'}{hasFilters ? ' match your filters' : ' on record'}</p>
        </div>
        <button className="btn primary" onClick={() => setEditing({})}>Admit patient</button>
      </header>

      <section className="filters" aria-label="Search and filters">
        <input type="search" className="search" placeholder="Search by patient name" value={filters.search} onChange={setFilter('search')} />
        <Select value={filters.ward} onChange={setFilter('ward')} items={opts.wards} placeholder="All wards" aria-label="Filter by ward" />
        <Select value={filters.department} onChange={setFilter('department')} items={opts.departments} placeholder="All departments" aria-label="Filter by department" />
        <Select value={filters.doctor} onChange={setFilter('doctor')} items={opts.doctors} placeholder="All doctors" aria-label="Filter by doctor" />
        {hasFilters && <button className="btn ghost" onClick={() => setFilters({ search: '', ward: '', department: '', doctor: '' })}>Clear</button>}
      </section>

      {loading ? <p className="empty">Loading patients…</p> : patients.length === 0 ? (
        <p className="empty">{hasFilters ? 'No patients match these filters.' : 'No patients yet. Use “Admit patient” to add the first one.'}</p>
      ) : (
        <table className="list">
          <thead>
            <tr><th>Name</th><th>Age</th><th>Gender</th><th>Ward</th><th>Department</th><th>Doctor</th><th>Admitted</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {patients.map((p) => (
              <tr key={p.id}>
                <td data-label="Name" className="name">{p.name}</td>
                <td data-label="Age">{p.age}</td>
                <td data-label="Gender">{p.gender}</td>
                <td data-label="Ward">{p.ward}</td>
                <td data-label="Department">{p.department}</td>
                <td data-label="Doctor">{p.doctor}</td>
                <td data-label="Admitted">{fmtDate(p.admissionDate)}</td>
                <td data-label="Status"><span className={`pill ${p.status.toLowerCase()}`}>{p.status}</span></td>
                <td className="row-actions">
                  <button className="btn small" onClick={() => setEditing(p)}>Edit</button>
                  {p.status === 'Admitted' && <button className="btn small" onClick={() => discharge(p)}>Discharge</button>}
                  <button className="btn small danger" onClick={() => setDeleting(p)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editing && <PatientForm patient={editing} opts={opts} onSave={save} onClose={() => setEditing(null)} />}

      {deleting && (
        <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && setDeleting(null)}>
          <div className="modal small-modal" role="alertdialog" aria-modal="true">
            <h2>Delete {deleting.name}?</h2>
            <p>This permanently removes the patient record and cannot be undone.</p>
            <div className="actions">
              <button className="btn ghost" onClick={() => setDeleting(null)}>Keep patient</button>
              <button className="btn danger-solid" onClick={confirmDelete}>Delete patient</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`toast ${toast.type}`} role="status">{toast.text}</div>}
    </div>
  );
}
