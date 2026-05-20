import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import * as XLSX from "xlsx";
import { supabase } from "./supabase";
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

function today() {
  return new Date().toISOString().split("T")[0];
}

function fromDbContact(row) {
  return {
    id: row.id,
    name: row.name || "",
    title: row.title || "",
    company: row.company || "",
    location: row.location || "",
    linkedinUrl: row.linkedin_url || "",
    status: row.status || "New Lead",
    priority: row.priority || "Medium",
    outreachDate: row.outreach_date || "",
    responseDate: row.response_date || "",
    followUpDate: row.follow_up_date || "",
    notes: row.notes || "",
    timeline: row.timeline || []
  };
}

function toDbContact(contact) {
  return {
    name: contact.name,
    title: contact.title,
    company: contact.company,
    location: contact.location,
    linkedin_url: contact.linkedinUrl,
    status: contact.status,
    priority: contact.priority,
    outreach_date: contact.outreachDate,
    response_date: contact.responseDate,
    follow_up_date: contact.followUpDate,
    notes: contact.notes,
    timeline: contact.timeline || []
  };
}

function fromDbCompany(row) {
  return {
    id: row.id,
    name: row.name || "",
    website: row.website || "",
    description: row.description || "",
    industry: row.industry || "",
    automationLevel: row.automation_level || "",
    roboticsUsage: row.robotics_usage || "",
    strategicFit: row.strategic_fit || "",
    notes: row.notes || ""
  };
}

function toDbCompany(company) {
  return {
    name: company.name,
    website: company.website,
    description: company.description,
    industry: company.industry,
    automation_level: company.automationLevel,
    robotics_usage: company.roboticsUsage,
    strategic_fit: company.strategicFit,
    notes: company.notes
  };
}

function App() {
  console.log("SUPABASE CONNECTED", supabase);
  const [contacts, setContacts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);

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
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const { data: contactRows, error: contactError } = await supabase
      .from("contacts")
      .select("*")
      .order("id", { ascending: false });

    const { data: companyRows, error: companyError } = await supabase
      .from("companies")
      .select("*")
      .order("id", { ascending: false });

    if (contactError) alert(contactError.message);
    if (companyError) alert(companyError.message);

    const loadedContacts = (contactRows || []).map(fromDbContact);
    const loadedCompanies = (companyRows || []).map(fromDbCompany);

    setContacts(loadedContacts);
    setCompanies(loadedCompanies);
    setSelectedContact(loadedContacts[0] || null);
    setLoading(false);
  }

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

  async function createContact(contactData, source) {
    if (!contactData.name || !contactData.company) return;

    const duplicate = isDuplicate(contactData);

    if (duplicate) {
      setDuplicateWarning("Possible duplicate detected: this contact already exists.");
      setSelectedContact(duplicate);
      return;
    }

    const contact = {
      ...contactData,
      status: contactData.status || "New Lead",
      priority: contactData.priority || "Medium",
      outreachDate: contactData.outreachDate || today(),
      responseDate: contactData.responseDate || "",
      followUpDate: contactData.followUpDate || "",
      timeline: [
        {
          date: today(),
          action:
            source === "ai"
              ? "Contact created from LinkedIn screenshot"
              : "Contact added"
        },
        { date: today(), action: "Outreach started" }
      ]
    };

    const { data, error } = await supabase
      .from("contacts")
      .insert([toDbContact(contact)])
      .select()
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    const savedContact = fromDbContact(data);

    setContacts([savedContact, ...contacts]);
    setSelectedContact(savedContact);
    setDuplicateWarning("");

    const companyExists = companies.find(
      (company) => company.name.toLowerCase() === savedContact.company.toLowerCase()
    );

    if (!companyExists) {
      const company = {
        name: savedContact.company,
        website: "",
        description: "",
        industry: "Automotive Manufacturing",
        automationLevel: "",
        roboticsUsage: "",
        strategicFit: "",
        notes: source === "ai" ? "Created automatically from LinkedIn screenshot." : ""
      };

      const { data: companyData, error: companyError } = await supabase
        .from("companies")
        .insert([toDbCompany(company)])
        .select()
        .single();

      if (!companyError && companyData) {
        setCompanies([fromDbCompany(companyData), ...companies]);
      }
    }
  }

  async function addContact() {
    await createContact(newContact, "manual");

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

        await createContact(aiContact, "ai");
        setAiMessage("LinkedIn screenshot parsed and contact added.");
      } catch (error) {
        setAiMessage(error.message);
      } finally {
        setAiLoading(false);
      }
    };

    reader.readAsDataURL(file);
  }

  async function addCompany() {
    if (!newCompany.name) return;

    const { data, error } = await supabase
      .from("companies")
      .insert([toDbCompany(newCompany)])
      .select()
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    setCompanies([fromDbCompany(data), ...companies]);

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

  async function updateContact(id, field, value) {
    const updated = contacts.map((contact) => {
      if (contact.id !== id) return contact;

      const timelineItem =
        field === "status"
          ? [{ date: today(), action: `Status changed to ${value}` }]
          : [];

      return {
        ...contact,
        [field]: value,
        timeline: [...(contact.timeline || []), ...timelineItem]
      };
    });

    setContacts(updated);

    const active = updated.find((c) => c.id === id);
    setSelectedContact(active);

    const { error } = await supabase
      .from("contacts")
      .update(toDbContact(active))
      .eq("id", id);

    if (error) alert(error.message);
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

    const updatedCompany = {
      ...company,
      description: data.summary,
      automationLevel: data.automationFit,
      roboticsUsage: data.buyerPersonas,
      notes: data.outreachAngle
    };

    const { error } = await supabase
      .from("companies")
      .update(toDbCompany(updatedCompany))
      .eq("id", company.id);

    if (error) {
      alert(error.message);
      return;
    }

    setCompanies(
      companies.map((item) =>
        item.id === company.id ? updatedCompany : item
      )
    );
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

  async function deleteContact(id) {
    const { error } = await supabase
      .from("contacts")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    const updated = contacts.filter((contact) => contact.id !== id);
    setContacts(updated);

    if (selectedContact?.id === id) {
      setSelectedContact(updated[0] || null);
    }
  }

  async function deleteCompany(id) {
    const { error } = await supabase
      .from("companies")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setCompanies(companies.filter((company) => company.id !== id));
  }

  async function clearAllData() {
    const confirmed = window.confirm("Are you sure you want to clear all CRM data?");

    if (!confirmed) return;

    await supabase.from("contacts").delete().neq("id", 0);
    await supabase.from("companies").delete().neq("id", 0);

    setContacts([]);
    setCompanies([]);
    setSelectedContact(null);
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

  if (loading) {
    return (
      <div className="app">
        <section className="card">
          <h2>Loading Foundation CRM...</h2>
          <p className="emptyText">Connecting to Supabase database.</p>
        </section>
      </div>
    );
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

          <p className="saveStatus">Cloud-saved in Supabase</p>

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
                {(selectedContact.timeline || []).map((item, index) => (
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
