import React, { useMemo, useRef, useState } from "react";
import "../styles/home.scss";
import { useInterview } from "../hooks/useIntervieReport";
import { useNavigate } from "react-router";

const sidebarItems = [
  { id: "profile", label: "Profile", icon: "◉" },
  { id: "job", label: "Job Description", icon: "✦" },
  { id: "resume", label: "Resume", icon: "⬆" },
  { id: "self", label: "Self Description", icon: "✎" },
];

function Home() {
  const navigate = useNavigate();
  const { loading, generateReport } = useInterview();
  const fileInputRef = useRef(null);

  const [activeSection, setActiveSection] = useState("job");
  const [jobDescription, setJobDescription] = useState("");
  const [selfDescription, setSelfDescription] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [toast, setToast] = useState("");
  const [errors, setErrors] = useState({});

  const completedSections = useMemo(() => {
    const sections = {
      profile: true,
      job: jobDescription.trim().length > 0,
      resume: Boolean(resumeFile),
      self: selfDescription.trim().length > 0,
    };

    return Object.values(sections).filter(Boolean).length;
  }, [jobDescription, resumeFile, selfDescription]);

  const overallProgress = Math.round((completedSections / 4) * 100);

  const getSectionStatus = (sectionId) => {
    if (sectionId === "profile") {
      return { tone: "complete", label: "Ready" };
    }

    if (sectionId === "job") {
      return jobDescription.trim().length > 0
        ? { tone: "complete", label: "Saved" }
        : { tone: "pending", label: "Pending" };
    }

    if (sectionId === "resume") {
      return resumeFile
        ? { tone: "complete", label: "Ready" }
        : { tone: "pending", label: "Pending" };
    }

    return selfDescription.trim().length > 0
      ? { tone: "complete", label: "Saved" }
      : { tone: "pending", label: "Pending" };
  };

  const validateAndSave = (field) => {
    if (field === "job" && !jobDescription.trim()) {
      setErrors((prev) => ({
        ...prev,
        job: "Please add a job description first.",
      }));
      setToast("Add a job description to continue.");
      return;
    }

    if (field === "self" && !selfDescription.trim()) {
      setErrors((prev) => ({
        ...prev,
        self: "Please describe yourself first.",
      }));
      setToast("Add your self-description to continue.");
      return;
    }

    setErrors((prev) => ({ ...prev, [field]: "" }));
    setToast(
      `${field === "job" ? "Job description" : "Self description"} saved.`,
    );
  };

  const handleFileSelection = (file) => {
    if (!file) return;

    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setErrors((prev) => ({
        ...prev,
        resume: "Only PDF files are supported.",
      }));
      setToast("Please upload a PDF file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        resume: "File size must stay below 5MB.",
      }));
      setToast("Resume must be 5MB or smaller.");
      return;
    }

    setErrors((prev) => ({ ...prev, resume: "" }));
    setIsUploading(true);
    setUploadProgress(0);

    const interval = window.setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          window.clearInterval(interval);
          return 100;
        }
        return prev + 16;
      });
    }, 120);

    window.setTimeout(() => {
      window.clearInterval(interval);
      setUploadProgress(100);
      setIsUploading(false);
      setResumeFile({ name: file.name, size: file.size, file });
      setToast("Resume uploaded successfully.");
    }, 900);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    handleFileSelection(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragOver(false);
    const file = event.dataTransfer.files?.[0];
    handleFileSelection(file);
  };

  const handleGenerateReport = async () => {
    if (!jobDescription.trim() || !selfDescription.trim() || !resumeFile) {
      setToast("Complete all required sections before generating the report.");
      return;
    }

    try {
      const report = await generateReport({
        jobDescription,
        selfDescription,
        resumeFile: resumeFile.file,
      });

      if (!report?._id) {
        throw new Error("The server did not return a saved report ID.");
      }

      navigate(`/interview/${report._id}`);
    } catch (error) {
      console.error("Error generating interview report:", error);
      setToast(
        error.response?.data?.message ||
          error.message ||
          "Unable to generate the interview report. Please try again.",
      );
      setErrors((prev) => ({
        ...prev,
        job: "Report generation failed. Check the inputs and try again.",
      }));
    }
  };

  const handleLogout = async () => {};

  const canGenerate = Boolean(
    jobDescription.trim() && selfDescription.trim() && resumeFile,
  );

  return (
    <div className="home-container">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-mark">PREVIEW</span>
          <p>Interview preparation platform</p>
        </div>

        <nav className="sidebar-nav" aria-label="Dashboard sections">
          {sidebarItems.map((item) => {
            const status = getSectionStatus(item.id);
            return (
              <button
                key={item.id}
                type="button"
                className={`nav-item ${activeSection === item.id ? "active" : ""}`}
                onClick={() => setActiveSection(item.id)}
              >
                <span className="nav-icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="nav-label">{item.label}</span>
                <span className={`status-pill ${status.tone}`}>
                  {status.label}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-divider" />
          <button className="logout-btn" type="button" onClick={handleLogout}>
            <span aria-hidden="true">⇠</span>
            Logout
          </button>
        </div>
      </aside>

      <main className="home-content">
        <header className="home-header">
          <div>
            <p className="eyebrow">Professional workspace</p>
            <h1>Interview Preparation Dashboard</h1>
          </div>
          <div className="header-badges">
            <span className="header-pill">{overallProgress}% complete</span>
            <span className="header-pill accent">
              {completedSections}/4 ready
            </span>
          </div>
        </header>

        <section className="home-main">
          <div className="progress-card">
            <div className="progress-copy">
              <div>
                <p className="progress-label">Overall progress</p>
                <strong>{overallProgress}% ready for review</strong>
              </div>
              <span className="progress-summary">
                {completedSections} of 4 sections complete
              </span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>

          <div className="content-card">
            {activeSection === "profile" && (
              <div className="section-panel fade-in">
                <div className="section-top">
                  <div>
                    <p className="section-kicker">Profile</p>
                    <h2>Candidate overview</h2>
                  </div>
                  <button className="ghost-btn" type="button">
                    Edit profile
                  </button>
                </div>

                <div className="profile-card">
                  <div className="avatar">JD</div>
                  <div className="profile-details">
                    <h3>Jordan Doe</h3>
                    <p>jordan.doe@email.com</p>
                  </div>
                </div>

                <div className="profile-stats">
                  <div>
                    <strong>87%</strong>
                    <span>Profile completion</span>
                  </div>
                  <div>
                    <strong>3</strong>
                    <span>Active prep items</span>
                  </div>
                  <div>
                    <strong>2</strong>
                    <span>Reports generated</span>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "job" && (
              <div className="section-panel fade-in">
                <div className="section-top">
                  <div>
                    <p className="section-kicker">Job Description</p>
                    <h2>Paste the role you are targeting</h2>
                  </div>
                  <span className="info-pill">Required</span>
                </div>

                <label className="field-label" htmlFor="job-description">
                  Paste Job Description
                </label>
                <textarea
                  id="job-description"
                  className="text-input"
                  placeholder="Enter the job description here..."
                  value={jobDescription}
                  onChange={(event) => {
                    setJobDescription(event.target.value);
                    if (errors.job) {
                      setErrors((prev) => ({ ...prev, job: "" }));
                    }
                  }}
                />
                <div className="field-meta">
                  <span>{jobDescription.length} characters</span>
                  <button
                    className="accent-btn"
                    type="button"
                    onClick={() => validateAndSave("job")}
                  >
                    Save
                  </button>
                </div>
                {errors.job && <p className="field-error">{errors.job}</p>}
              </div>
            )}

            {activeSection === "resume" && (
              <div className="section-panel fade-in">
                <div className="section-top">
                  <div>
                    <p className="section-kicker">Resume</p>
                    <h2>Upload your latest PDF</h2>
                  </div>
                  <span className="info-pill">PDF only</span>
                </div>

                <div
                  className={`dropzone ${isDragOver ? "drag-over" : ""}`}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="dropzone-icon">⬆</div>
                  <h3>Drag and drop your resume</h3>
                  <p>
                    Upload a PDF up to 5MB to keep your report grounded in your
                    experience.
                  </p>
                  <div className="dropzone-actions">
                    <button className="accent-btn" type="button">
                      Browse files
                    </button>
                    <span className="support-badge">PDF only · 5MB max</span>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    className="hidden-input"
                    onChange={handleFileChange}
                  />
                </div>

                {isUploading && (
                  <div className="upload-progress">
                    <div className="progress-bar compact">
                      <div
                        className="progress-fill"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <span>Uploading {uploadProgress}%</span>
                  </div>
                )}

                {resumeFile && (
                  <div className="file-card">
                    <div>
                      <strong>{resumeFile.name}</strong>
                      <p>{(resumeFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                    <button
                      className="ghost-btn"
                      type="button"
                      onClick={() => {
                        setResumeFile(null);
                        setToast("Resume removed.");
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}

                {errors.resume && (
                  <p className="field-error">{errors.resume}</p>
                )}
              </div>
            )}

            {activeSection === "self" && (
              <div className="section-panel fade-in">
                <div className="section-top">
                  <div>
                    <p className="section-kicker">Self Description</p>
                    <h2>Tell us about your story</h2>
                  </div>
                  <span className="info-pill">Recommended</span>
                </div>

                <label className="field-label" htmlFor="self-description">
                  Tell us about yourself
                </label>
                <textarea
                  id="self-description"
                  className="text-input"
                  placeholder="Describe your skills, experience, and why you're a good fit..."
                  value={selfDescription}
                  onChange={(event) => {
                    setSelfDescription(event.target.value);
                    if (errors.self) {
                      setErrors((prev) => ({ ...prev, self: "" }));
                    }
                  }}
                />
                <div className="field-meta">
                  <span>
                    {selfDescription.trim().split(/\s+/).filter(Boolean).length}{" "}
                    words
                  </span>
                  <button
                    className="accent-btn"
                    type="button"
                    onClick={() => validateAndSave("self")}
                  >
                    Save
                  </button>
                </div>
                {errors.self && <p className="field-error">{errors.self}</p>}
              </div>
            )}
          </div>

          <div className="footer-actions">
            <button
              className="generate-btn"
              type="button"
              onClick={handleGenerateReport}
              disabled={!canGenerate || loading}
            >
              {loading ? "Generating report..." : "Generate Report"}
            </button>
            {!canGenerate && (
              <p className="helper-text">
                Add your job description, resume, and self-description to unlock
                the report.
              </p>
            )}
          </div>

          {toast && <div className="toast">{toast}</div>}
        </section>
      </main>
    </div>
  );
}

export default Home;
