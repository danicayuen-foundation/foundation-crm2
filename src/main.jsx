import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import * as XLSX from "xlsx";
import {
  Plus,
  Download,
  Building2,
  Users,
  Reply,
  Clock,
  Upload,
  Sparkles
} from "lucide-react";
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
    location: "",
    linkedinUrl: "",
    status: "New Lead",
    priority: "Medium",
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
    website: "",
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
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [newContact, setNewContact] = useState({
    name: "",
    title: "",
    company: "",
    location: "",
    linkedinUrl: "",
    status: "New Lead",
    priority: "Medium",
    outreachDate: today(),
    responseDate: "",
    followUpDate: "",
    notes: ""
  });

  const [newCompany, setNewCompany] = useState({
    name: "",
    website: "",
    description: "",
    industry: "Automotive Manufacturing",
    automationLevel: "",
    roboticsUsage: "",
    strategicFit: "",
    notes: ""
  });

  useEffect(() => {
    const savedContacts = localStorage.getItem("foundationContacts");
    const savedCompanies = localStorage.getItem("foundationCompanies");

    if (savedContacts) {
      setContacts(JSON.parse(savedContacts));
    }

    if (savedCompanies) {
      setCompanies(JSON.parse(savedCompanies));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("foundationContacts", JSON.stringify(contacts));
    localStorage.setItem("foundationCompanies", JSON.stringify(companies));
  }, [contacts, companies]);

  const stats = useMemo(() => {
    return {
      totalCompanies: companies.length,
      outreach: contacts.filter((c) => c.outreachDate).length,
      replies: contacts.filter((c) => c.responseDate).length,
      followUpsDue: contacts.filter((c) => c.followUpDate && c.followUpDate <= today()).length
    };
  }, [contacts, companies]);

  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      const searchText =
        `${contact.name} ${contact.title} ${contact.company} ${contact.notes}`.toLowerCase();

      const matchesSearch = searchText.includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "All" || contact.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [contacts, searchTerm, statusFilter]);

  const followUpsDue = useMemo(() => {
    return contacts.filter(
      (contact) => contact.followUpDate && contact.followUpDate <= today()
    );
  }, [contacts]);

  function isDuplicate(contactData) {
    return contacts.find((c) => {
      const sameName =
        c.name.toLowerCase().trim() === contactData.name.toLowerCase().trim();

      const sameCompany =
        c.company.toLowerCase().trim() === contactData.company.toLowerCase().trim();

      const sameLinkedin =
        contactData.linkedinUrl &&
        c.linkedinUrl &&
        c.linkedinUrl.toLowerCase().trim() === contactData.linkedinUrl.toLowerCase().trim();

      return sameLinkedin || (sameName && sameCompany);
    });
  }

  function createContact(contactData, source) {
    if (!contactData.name || !contactData.company) return;

    const duplicate = isDuplicate(contactData);

    if (duplicate) {
      setDuplicateWarning("Possible duplicate detected: this contact already exists.");
      setSelectedContact(duplicate);
      return;
    }

    const contact = {
      ...contactData,
      id: Date.now(),
      status: contactData.status || "New Lead",
      priority: contactData.priority || "Medium",
      outreachDate: contactData.outreachDate || today(),
      responseDate: contactData.responseDate || "",
      followUpDate: contactData.followUpDate || "",
      timeline: [
        { date: today(), action: source === "ai" ? "Contact created from LinkedIn screenshot" : "Contact added" },
        { date: today(), action: "Outreach started" }
      ]
    };

    setContacts([contact, ...contacts]);
    setSelectedContact(contact);
    setDuplicateWarning("");

    const companyExists = companies.find(
      (company) => company.name.toLowerCase() === contact.company.toLowerCase()
    );

    if (!companyExists) {
      setCompanies([
        {
          id: Date.now() + 1,
          name: contact.company,
          website: "",
          description: "",
          industry: "Automotive Manufacturing",
          automationLevel: "",
          roboticsUsage: "",
          strategicFit: "",
          notes: source === "ai" ? "Created automatically from LinkedIn screenshot." : ""
        },
        ...companies
      ]);
    }
  }

  function addContact() {
    createContact(newContact, "manual");

    setNewContact({
      name: "",
      title: "",
      company: "",
      location: "",
      linkedinUrl: "",
      status: "New Lead",
      priority: "Medium",
      outreachDate: today(),
      responseDate: "",
      followUpDate: "",
      notes: ""
    });
  }

  async function handleScreenshotUpload(event) {
    const file = event.target.files[0];

    if (!file) return;

    setAiLoading(true);
    setAiMessage("AI is reading the LinkedIn screenshot...");
    setDuplicateWarning("");

    const reader = new FileReader();

    reader.onloadend = async () => {
      try {
        const base64Image = reader.result;

        const response = await fetch("/api/parse-linkedin", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            image: base64Image
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "AI parsing failed");
        }

        const aiContact = {
          name: data.name || "",
          title: data.title || "",
          company: data.company || "",
          location: data.location || "",
          linkedinUrl: data.linkedinUrl || "",
          status: "New Lead",
          priority: "Medium",
          outreachDate: today(),
          responseDate: "",
          followUpDate: "",
          notes: data.notes || ""
        };

        if (!aiContact.name || !aiContact.company) {
          setAiMessage("AI could not find enough info. Try a clearer LinkedIn screenshot.");
          setAiLoading(false);
          return;
        }

        createContact(aiContact, "ai");
        setAiMessage("LinkedIn screenshot parsed and contact added.");
      } catch (error) {
        setAiMessage(error.message);
      } finally {
        setAiLoading(false);
      }
    };

    reader.readAsDataURL(file);
  }

  function addCompany() {
    if (!newCompany.name) return;

    setCompanies([{ ...newCompany, id: Date.now() }, ...companies]);

    setNewCompany({
      name: "",
      website: "",
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

  async function summarizeCompany(company) {
    const response = await fetch("/api/summarize-company", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(company)
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Company summary failed");
      return;
    }

    const updated = companies.map((item) => {
      if (item.id !== company.id) return item;

      return {
        ...item,
        description: data.summary,
        automationLevel: data.automationFit,
        roboticsUsage: data.buyerPersonas,
        notes: data.outreachAngle
      };
    });

    setCompanies(updated);
  }

  async function recommendFollowUp(contact) {
    const response = await fetch("/api/recommend-followup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(contact)
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Follow-up recommendation failed");
      return;
    }

    updateContact(
      contact.id,
      "notes",
      `Recommended Action: ${data.recommendedAction}\n\nSuggested Message: ${data.followUpMessage}\n\nPriority: ${data.priority}`
    );
  }

  function deleteContact(id) {
    const updated = contacts.filter((contact) => contact.id !== id);
    setContacts(updated);

    if (selectedContact?.id === id) {
      setSelectedContact(updated[0] || null);
    }
  }

  function deleteCompany(id) {
    setCompanies(companies.filter((company) => company.id !== id));
  }

  function clearAllData() {
    const confirmed = window.confirm("Are you sure you want to clear all CRM data?");

    if (!confirmed) return;

    setContacts([]);
    setCompanies([]);
    setSelectedContact(null);
    localStorage.removeItem("foundationContacts");
    localStorage.removeItem("foundationCompanies");
  }

  function exportExcel() {
    const cleanContacts = contacts.map(({ timeline, ...contact }) => contact);

    const workbook = XLSX.utils.book_new();

    const contactsSheet = XLSX.utils.json_to_sheet(cleanContacts);
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

        <div>
          <button className="primaryButton" onClick={exportExcel}>
            <Download size={18} />
            Export Excel
          </button>

          <p className="saveStatus">Auto-saved in browser</p>

          <button className="dangerButton" onClick={clearAllData}>
            Clear All Data
          </button>
        </div>
      </header>

      <section className="tickerGrid">
        <Metric icon={<Building2 />} label="Total Companies" value={stats.totalCompanies} />
        <Metric icon={<Users />} label="Outreach So Far" value={stats.outreach} />
        <Metric icon={<Reply />} label="Replies Received" value={stats.replies} />
        <Metric icon={<Clock />} label="Follow-Ups Due" value={stats.followUpsDue} />
      </section>

      <section className="card aiCard">
        <div>
          <p className="eyebrow">AI Screenshot Upload</p>
          <h2>Upload LinkedIn Profile Screenshot</h2>
          <p className="subtitle small">
            Upload a screenshot and AI will extract the contact name, title, company, location, and notes.
          </p>
        </div>

        <label className="uploadBox">
          <Upload size={22} />
          <span>{aiLoading ? "Reading screenshot..." : "Choose LinkedIn Screenshot"}</span>
          <input type="file" accept="image/*" onChange={handleScreenshotUpload} />
        </label>

        {aiMessage && (
          <div className="aiMessage">
            <Sparkles size={16} />
            {aiMessage}
          </div>
        )}
      </section>

      <section className="mainGrid">
        <div className="card">
          <h2>Add Contact Manually</h2>

          {duplicateWarning && <div className="warning">{duplicateWarning}</div>}

          <div className="formGrid">
            <input placeholder="Name" value={newContact.name} onChange={(e) => setNewContact({ ...newContact, name: e.target.value })} />
            <input placeholder="Title" value={newContact.title} onChange={(e) => setNewContact({ ...newContact, title: e.target.value })} />
            <input placeholder="Company" value={newContact.company} onChange={(e) => setNewContact({ ...newContact, company: e.target.value })} />
            <input placeholder="Location" value={newContact.location} onChange={(e) => setNewContact({ ...newContact, location: e.target.value })} />
            <input placeholder="LinkedIn URL" value={newContact.linkedinUrl} onChange={(e) => setNewContact({ ...newContact, linkedinUrl: e.target.value })} />

            <select value={newContact.status} onChange={(e) => setNewContact({ ...newContact, status: e.target.value })}>
              {stages.map((stage) => <option key={stage}>{stage}</option>)}
            </select>

            <select value={newContact.priority} onChange={(e) => setNewContact({ ...newContact, priority: e.target.value })}>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
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
            <input placeholder="Website" value={newCompany.website} onChange={(e) => setNewCompany({ ...newCompany, website: e.target.value })} />
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
        <h2>Follow-Ups Due</h2>

        {followUpsDue.length === 0 ? (
          <p className="emptyText">No follow-ups due right now.</p>
        ) : (
          <div className="followUpGrid">
            {followUpsDue.map((contact) => (
              <div className="followUpCard" key={contact.id}>
                <strong>{contact.name}</strong>
                <span>{contact.title} · {contact.company}</span>
                <p>Due: {contact.followUpDate}</p>

                <button className="miniButton" onClick={() => recommendFollowUp(contact)}>
                  Generate Follow-Up
                </button>
              </div>
            ))}
          </div>
        )}
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
        <div className="sectionHeader">
          <h2>Contacts</h2>

          <div className="filterRow">
            <input
              placeholder="Search contacts, companies, titles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option>All</option>
              {stages.map((stage) => (
                <option key={stage}>{stage}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Title</th>
                <th>Company</th>
                <th>Location</th>
                <th>LinkedIn</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Outreach Date</th>
                <th>Response Date</th>
                <th>Follow-Up</th>
                <th>Notes</th>
              </tr>
            </thead>

            <tbody>
              {filteredContacts.map((contact) => (
                <tr key={contact.id} onClick={() => setSelectedContact(contact)}>
                  <td><input value={contact.name} onChange={(e) => updateContact(contact.id, "name", e.target.value)} /></td>
                  <td><input value={contact.title} onChange={(e) => updateContact(contact.id, "title", e.target.value)} /></td>
                  <td><input value={contact.company} onChange={(e) => updateContact(contact.id, "company", e.target.value)} /></td>
                  <td><input value={contact.location} onChange={(e) => updateContact(contact.id, "location", e.target.value)} /></td>
                  <td><input value={contact.linkedinUrl} onChange={(e) => updateContact(contact.id, "linkedinUrl", e.target.value)} /></td>
                  <td>
                    <select value={contact.status} onChange={(e) => updateContact(contact.id, "status", e.target.value)}>
                      {stages.map((stage) => <option key={stage}>{stage}</option>)}
                    </select>
                  </td>
                  <td>
                    <select value={contact.priority || "Medium"} onChange={(e) => updateContact(contact.id, "priority", e.target.value)}>
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </select>
                  </td>
                  <td><input type="date" value={contact.outreachDate} onChange={(e) => updateContact(contact.id, "outreachDate", e.target.value)} /></td>
                  <td><input type="date" value={contact.responseDate} onChange={(e) => updateContact(contact.id, "responseDate", e.target.value)} /></td>
                  <td><input type="date" value={contact.followUpDate} onChange={(e) => updateContact(contact.id, "followUpDate", e.target.value)} /></td>
                  <td>
                    <input value={contact.notes} onChange={(e) => updateContact(contact.id, "notes", e.target.value)} />

                    <button className="miniButton" onClick={() => recommendFollowUp(contact)}>
                      AI Follow-Up
                    </button>

                    <button className="dangerButton" onClick={() => deleteContact(contact.id)}>
                      Delete
                    </button>
                  </td>
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
                {company.website && <p>{company.website}</p>}
                <p>{company.description || "No description yet."}</p>

                <div className="tagRow">
                  <span>{company.industry}</span>
                  <span>{company.automationLevel || "Automation TBD"}</span>
                  <span>{company.strategicFit || "Fit TBD"}</span>
                </div>

                <small>{company.notes}</small>

                <button className="miniButton" onClick={() => summarizeCompany(company)}>
                  AI Company Summary
                </button>

                <button className="dangerButton" onClick={() => deleteCompany(company.id)}>
                  Delete Company
                </button>
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
