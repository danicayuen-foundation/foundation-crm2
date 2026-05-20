import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import * as XLSX from "xlsx";
import { Plus, Download, Building2, Users, Reply, Clock } from "lucide-react";
import "./style.css";

const stages = [
  "New Lead",
  "Contacted",
  "Meeting Scheduled",
  "Pilot Discussion",
  "Demo"
];

const starterContacts = [
  {
    id: 1,
    name: "Jordan Lee",
    title: "VP Operations",
    company: "Magna International",
    status: "New Lead",
    outreachDate: "2026-05-20",
    responseDate: "",
    followUpDate: "2026-05-24",
    notes: "Automotive manufacturing target.",
    timeline: [
      { date: "2026-05-20", action: "Contact added" },
      { date: "2026-05-20", action: "Outreach started" }
    ]
  }
];

const starterCompanies = [
  {
    id: 1,
    name: "Magna International",
    description: "Tier 1 automotive supplier with large-scale manufacturing operations.",
    industry: "Automotive Manufacturing",
    automationLevel: "Medium",
    roboticsUsage: "Industrial robots / automation cells",
    strategicFit: "High",
    notes: "Good fit for humanoid robotics in labor-heavy production areas."
  }
];

function today() {
  return new Date().toISOString().split("T")[0];
}

function App() {
  const [contacts, setContacts] = useState(starterContacts);
  const [companies, setCompanies] = useState(starterCompanies);
  const [selectedContact, setSelectedContact] = useState(starterContacts[0]);
  const [duplicateWarning, setDuplicateWarning] = useState("");

  const [newContact, setNewContact] = useState({
    name: "",
    title: "",
    company: "",
    status: "New Lead",
    outreachDate: today(),
    responseDate: "",
    followUpDate: "",
    notes: ""
  });

  const [newCompany, setNewCompany] = useState({
    name: "",
    description: "",
    industry: "Automotive Manufacturing",
    automationLevel: "",
    roboticsUsage: "",
    strategicFit: "",
    notes: ""
  });

  const stats = useMemo(() => {
    return {
      totalCompanies: companies.length,
      outreach: contacts.filter((c) => c.outreachDate).length,
      replies: contacts.filter((c) => c.responseDate).length,
      followUpsDue: contacts.filter((c) => c.followUpDate && c.followUpDate <= today()).length
    };
  }, [contacts, companies]);

  function addContact() {
    if (!newContact.name || !newContact.company) return;

    const duplicate = contacts.find(
      (c) =>
        c.name.toLowerCase().trim() === newContact.name.toLowerCase().trim() &&
        c.company.toLowerCase().trim() === newContact.company.toLowerCase().trim()
    );

    if (duplicate) {
      setDuplicateWarning("Possible duplicate detected: this contact already exists.");
      return;
    }

    const contact = {
      ...newContact,
      id: Date.now(),
      timeline: [
        { date: today(), action: "Contact added" },
        { date: today(), action: "Outreach started" }
      ]
    };

    setContacts([contact, ...contacts]);
    setSelectedContact(contact);
    setDuplicateWarning("");

    const companyExists = companies.find(
      (company) => company.name.toLowerCase() === newContact.company.toLowerCase()
    );

    if (!companyExists) {
      setCompanies([
        {
          id: Date.now() + 1,
          name: newContact.company,
          description: "",
          industry: "Automotive Manufacturing",
          automationLevel: "",
          roboticsUsage: "",
          strategicFit: "",
          notes: ""
        },
        ...companies
      ]);
    }

    setNewContact({
      name: "",
      title: "",
      company: "",
      status: "New Lead",
      outreachDate: today(),
      responseDate: "",
      followUpDate: "",
      notes: ""
    });
  }

  function addCompany() {
    if (!newCompany.name) return;

    setCompanies([{ ...newCompany, id: Date.now() }, ...companies]);

    setNewCompany({
      name: "",
      description: "",
      industry: "Automotive Manufacturing",
      automationLevel: "",
      roboticsUsage: "",
      strategicFit: "",
      notes: ""
    });
  }

  function updateContact(id, field, value) {
    const updated = contacts.map((contact) => {
      if (contact.id !== id) return contact;

      const timelineItem =
        field === "status"
          ? [{ date: today(), action: `Status changed to ${value}` }]
          : [];

      return {
        ...contact,
        [field]: value,
        timeline: [...contact.timeline, ...timelineItem]
      };
    });

    setContacts(updated);

    const active = updated.find((c) => c.id === id);
    setSelectedContact(active);
  }

  function exportExcel() {
    const workbook = XLSX.utils.book_new();

    const contactsSheet = XLSX.utils.json_to_sheet(contacts);
    const companiesSheet = XLSX.utils.json_to_sheet(companies);
    const metricsSheet = XLSX.utils.json_to_sheet([stats]);

    XLSX.utils.book_append_sheet(workbook, contactsSheet, "Contacts");
    XLSX.utils.book_append_sheet(workbook, companiesSheet, "Companies");
    XLSX.utils.book_append_sheet(workbook, metricsSheet, "Metrics");

    XLSX.writeFile(workbook, "foundation-crm.xlsx");
  }

  return (
    <div className="app">
      <header className="hero">
        <div>
          <p className="eyebrow">Foundation Internal CRM</p>
          <h1>Manufacturing Outreach Command Center</h1>
          <p className="subtitle">
            Track automotive manufacturing leads, outreach, replies, companies, and pipeline progress.
          </p>
        </div>

        <button className="primaryButton" onClick={exportExcel}>
          <Download size={18} />
          Export Excel
        </button>
      </header>

      <section className="tickerGrid">
        <Metric icon={<Building2 />} label="Total Companies" value={stats.totalCompanies} />
        <Metric icon={<Users />} label="Outreach So Far" value={stats.outreach} />
        <Metric icon={<Reply />} label="Replies Received" value={stats.replies} />
        <Metric icon={<Clock />} label="Follow-Ups Due" value={stats.followUpsDue} />
      </section>

      <section className="mainGrid">
        <div className="card">
          <h2>Add Contact</h2>

          {duplicateWarning && <div className="warning">{duplicateWarning}</div>}

          <div className="formGrid">
            <input placeholder="Name" value={newContact.name} onChange={(e) => setNewContact({ ...newContact, name: e.target.value })} />
            <input placeholder="Title" value={newContact.title} onChange={(e) => setNewContact({ ...newContact, title: e.target.value })} />
            <input placeholder="Company" value={newContact.company} onChange={(e) => setNewContact({ ...newContact, company: e.target.value })} />

            <select value={newContact.status} onChange={(e) => setNewContact({ ...newContact, status: e.target.value })}>
              {stages.map((stage) => <option key={stage}>{stage}</option>)}
            </select>

            <input type="date" value={newContact.outreachDate} onChange={(e) => setNewContact({ ...newContact, outreachDate: e.target.value })} />
            <input type="date" value={newContact.followUpDate} onChange={(e) => setNewContact({ ...newContact, followUpDate: e.target.value })} />
          </div>

          <textarea placeholder="Notes" value={newContact.notes} onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })} />

          <button className="primaryButton full" onClick={addContact}>
            <Plus size={18} />
            Add Contact
          </button>
        </div>

        <div className="card">
          <h2>Add Company</h2>

          <div className="formGrid">
            <input placeholder="Company Name" value={newCompany.name} onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })} />
            <input placeholder="Industry" value={newCompany.industry} onChange={(e) => setNewCompany({ ...newCompany, industry: e.target.value })} />
            <input placeholder="Automation Level" value={newCompany.automationLevel} onChange={(e) => setNewCompany({ ...newCompany, automationLevel: e.target.value })} />
            <input placeholder="Robotics Usage" value={newCompany.roboticsUsage} onChange={(e) => setNewCompany({ ...newCompany, roboticsUsage: e.target.value })} />
            <input placeholder="Strategic Fit" value={newCompany.strategicFit} onChange={(e) => setNewCompany({ ...newCompany, strategicFit: e.target.value })} />
          </div>

          <textarea placeholder="Company Description" value={newCompany.description} onChange={(e) => setNewCompany({ ...newCompany, description: e.target.value })} />
          <textarea placeholder="Notes" value={newCompany.notes} onChange={(e) => setNewCompany({ ...newCompany, notes: e.target.value })} />

          <button className="primaryButton full" onClick={addCompany}>
            <Plus size={18} />
            Add Company
          </button>
        </div>
      </section>

      <section className="card">
        <h2>Pipeline</h2>

        <div className="pipeline">
          {stages.map((stage) => (
            <div className="pipelineColumn" key={stage}>
              <h3>{stage}</h3>

              {contacts.filter((c) => c.status === stage).map((contact) => (
                <div className="leadCard" key={contact.id} onClick={() => setSelectedContact(contact)}>
                  <strong>{contact.name}</strong>
                  <span>{contact.title}</span>
                  <small>{contact.company}</small>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Contacts</h2>

        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Title</th>
                <th>Company</th>
                <th>Status</th>
                <th>Outreach Date</th>
                <th>Response Date</th>
                <th>Follow-Up</th>
                <th>Notes</th>
              </tr>
            </thead>

            <tbody>
              {contacts.map((contact) => (
                <tr key={contact.id} onClick={() => setSelectedContact(contact)}>
                  <td><input value={contact.name} onChange={(e) => updateContact(contact.id, "name", e.target.value)} /></td>
                  <td><input value={contact.title} onChange={(e) => updateContact(contact.id, "title", e.target.value)} /></td>
                  <td><input value={contact.company} onChange={(e) => updateContact(contact.id, "company", e.target.value)} /></td>
                  <td>
                    <select value={contact.status} onChange={(e) => updateContact(contact.id, "status", e.target.value)}>
                      {stages.map((stage) => <option key={stage}>{stage}</option>)}
                    </select>
                  </td>
                  <td><input type="date" value={contact.outreachDate} onChange={(e) => updateContact(contact.id, "outreachDate", e.target.value)} /></td>
                  <td><input type="date" value={contact.responseDate} onChange={(e) => updateContact(contact.id, "responseDate", e.target.value)} /></td>
                  <td><input type="date" value={contact.followUpDate} onChange={(e) => updateContact(contact.id, "followUpDate", e.target.value)} /></td>
                  <td><input value={contact.notes} onChange={(e) => updateContact(contact.id, "notes", e.target.value)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mainGrid">
        <div className="card">
          <h2>Companies</h2>

          <div className="companyList">
            {companies.map((company) => (
              <div className="companyCard" key={company.id}>
                <h3>{company.name}</h3>
                <p>{company.description || "No description yet."}</p>
                <div className="tagRow">
                  <span>{company.industry}</span>
                  <span>{company.automationLevel || "Automation TBD"}</span>
                  <span>{company.strategicFit || "Fit TBD"}</span>
                </div>
                <small>{company.notes}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2>Contact Timeline</h2>

          {selectedContact ? (
            <>
              <div className="selectedContact">
                <strong>{selectedContact.name}</strong>
                <span>{selectedContact.title} · {selectedContact.company}</span>
              </div>

              <div className="timeline">
                {selectedContact.timeline.map((item, index) => (
                  <div className="timelineItem" key={index}>
                    <div className="dot"></div>
                    <div>
                      <strong>{item.action}</strong>
                      <p>{item.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p>Select a contact to view timeline.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function Metric({ icon, label, value }) {
  return (
    <div className="metricCard">
      <div className="metricIcon">{icon}</div>
      <p>{label}</p>
      <h2>{value}</h2>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
