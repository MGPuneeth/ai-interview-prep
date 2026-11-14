import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import "../styles/interview.scss";
import { getInterviewReportByID } from "../services/interview.api";

const tabLabels = {
  technical: "Technical Questions",
  behavioral: "Behavioural Questions",
  plan: "Preparation Plan",
};

const navItems = [
  { id: "technical", label: "Technical Questions", icon: "⌘" },
  { id: "behavioral", label: "Behavioural Questions", icon: "◌" },
  { id: "plan", label: "Preparation Plan", icon: "▣" },
];

const getScoreColor = (score) => {
  if (score > 75) return "#4CAF50";
  if (score >= 40) return "#FFC107";
  return "#F44336";
};

const Interview = () => {
  const { interviewReportId } = useParams();
  const location = useLocation();
  const [report, setReport] = useState(location.state?.aiReport ?? null);
  const [requestState, setRequestState] = useState({
    reportId: interviewReportId,
    loading: Boolean(interviewReportId),
    error: "",
  });
  const loading =
    interviewReportId && requestState.reportId !== interviewReportId
      ? true
      : requestState.loading;
  const error =
    interviewReportId && requestState.reportId === interviewReportId
      ? requestState.error
      : "";
  const [activeTab, setActiveTab] = useState("technical");
  const [expandedItem, setExpandedItem] = useState("technical-0");
  const [completedTasks, setCompletedTasks] = useState(new Set());

  useEffect(() => {
    if (!interviewReportId) {
      return;
    }

    let isCurrent = true;

    getInterviewReportByID(interviewReportId)
      .then((response) => {
        if (isCurrent) {
          setReport(response.interviewReport);
          setRequestState({
            reportId: interviewReportId,
            loading: false,
            error: "",
          });
        }
      })
      .catch((requestError) => {
        if (isCurrent) {
          setRequestState({
            reportId: interviewReportId,
            loading: false,
            error:
              requestError.response?.data?.message ||
              "Unable to load this report. Make sure you are signed in and the report ID is valid.",
          });
        }
      })
      .finally(() => {
        if (isCurrent) {
          setRequestState((previous) =>
            previous.reportId === interviewReportId
              ? { ...previous, loading: false }
              : previous,
          );
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [interviewReportId]);

  const technicalQuestions = report?.technicalQuestions ?? [];
  const behavioralQuestions =
    report?.behaviouralQuestions ?? report?.behavioralQuestions ?? [];
  const skillGaps = useMemo(
    () => report?.skillGap ?? report?.skillGaps ?? [],
    [report],
  );
  const preparationPlan = report?.preparationPlan ?? [];

  const sortedSkillGaps = useMemo(() => {
    const severityRank = { high: 0, medium: 1, low: 2 };
    return [...skillGaps].sort(
      (a, b) =>
        (severityRank[a.severity] ?? 3) - (severityRank[b.severity] ?? 3),
    );
  }, [skillGaps]);

  const totalTasks = preparationPlan.reduce(
    (count, day) => count + (day.task ?? day.tasks ?? []).length,
    0,
  );
  const completedCount = completedTasks.size;
  const progressPercent = totalTasks
    ? Math.round((completedCount / totalTasks) * 100)
    : 0;
  const score = Number(report?.matchScore);
  const hasScore = Number.isFinite(score);
  const scoreColor = hasScore ? getScoreColor(score) : "#8A8A8A";

  const questions =
    activeTab === "technical" ? technicalQuestions : behavioralQuestions;
  const questionTabLabel = tabLabels[activeTab];

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setExpandedItem(tab === "plan" ? null : `${tab}-0`);
  };

  const handleTaskToggle = (day, taskIndex) => {
    const key = `${day}-${taskIndex}`;
    setCompletedTasks((previous) => {
      const next = new Set(previous);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <main className="report-state">
        <p>Loading interview report…</p>
      </main>
    );
  }

  if (error || !report) {
    return (
      <main className="report-state">
        <h1>Interview report unavailable</h1>
        <p role="alert">
          {error ||
            (!interviewReportId
              ? "No report ID was provided. Open a saved report using its ID."
              : "No report data was returned by the server.")}
        </p>
        <Link to="/">Return to dashboard</Link>
      </main>
    );
  }

  return (
    <main className="report-shell">
      <header className="report-header">
        <div className="brand-block">
          <span className="brand-mark">PREPVIEW</span>
          <span className="brand-subtitle">Interview preparation report</span>
        </div>
        <Link className="report-home-link" to="/">
          Dashboard
        </Link>
      </header>

      <div className="report-layout">
        <aside className="report-panel left-panel">
          <div className="header-score">
            <div className="header-title-block">
              <h1>{report.title || "Interview Preparation Report"}</h1>
              <p>Readiness snapshot and preparation focus</p>
            </div>
            {hasScore && (
              <div
                className="score-ring"
                style={{
                  "--score": score,
                  "--score-color": scoreColor,
                }}
                aria-label={`Match score ${score}%`}
              >
                <span>{score}%</span>
              </div>
            )}
          </div>
          <div className="panel-heading">
            <h2>Navigator</h2>
            <p>Move between sections</p>
          </div>

          <nav className="nav-list" aria-label="Interview report sections">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabChange(item.id)}
                className={`nav-item ${activeTab === item.id ? "is-active" : ""}`}
              >
                <span className="nav-icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <section className="report-panel center-panel">
          <div className="summary-strip">
            <div className="document-icon" aria-hidden="true">
              <span />
            </div>
            <p>
              {report.summary ||
                `${technicalQuestions.length} technical questions, ${behavioralQuestions.length} behavioural questions, and ${skillGaps.length} identified skill gaps for this role.`}
            </p>
          </div>

          <div className="content-grid">
            <div className="report-scroll">
              {activeTab === "plan" ? (
                preparationPlan.length ? (
                  <div className="plan-list">
                    {preparationPlan.map((plan, planIndex) => {
                      const dayTasks = plan.task ?? plan.tasks ?? [];
                      const doneCount = dayTasks.filter((_, index) =>
                        completedTasks.has(`${plan.day}-${index}`),
                      ).length;
                      const dayProgress = dayTasks.length
                        ? Math.round((doneCount / dayTasks.length) * 100)
                        : 0;

                      return (
                        <article
                          key={`${plan.day}-${planIndex}`}
                          className="plan-day-card"
                        >
                          <div className="day-heading">
                            <div>
                              <h3>{plan.focus}</h3>
                              <p>Day {plan.day}</p>
                            </div>
                            <span className="day-badge">{dayProgress}%</span>
                          </div>

                          <div
                            className="progress-row"
                            aria-label={`${plan.focus} progress`}
                          >
                            <div className="progress-track">
                              <div
                                className="progress-fill"
                                style={{ width: `${dayProgress}%` }}
                              />
                            </div>
                            <span>
                              {doneCount}/{dayTasks.length} complete
                            </span>
                          </div>

                          {dayTasks.length ? (
                            <ul className="task-list">
                              {dayTasks.map((task, index) => {
                                const isDone = completedTasks.has(
                                  `${plan.day}-${index}`,
                                );
                                return (
                                  <li key={`${index}-${task}`}>
                                    <button
                                      type="button"
                                      className={`task-item ${isDone ? "is-done" : ""}`}
                                      onClick={() =>
                                        handleTaskToggle(plan.day, index)
                                      }
                                    >
                                      <span
                                        className="task-check"
                                        aria-hidden="true"
                                      />
                                      <span>{task}</span>
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          ) : (
                            <p>No tasks were included for this day.</p>
                          )}
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <p className="report-empty">
                    No preparation plan was included in this report.
                  </p>
                )
              ) : questions.length ? (
                <div className="question-list">
                  {questions.map((item, index) => {
                    const itemId = `${activeTab}-${index}`;
                    const isExpanded = expandedItem === itemId;

                    return (
                      <article key={itemId} className="question-card">
                        <button
                          type="button"
                          className="question-toggle"
                          onClick={() =>
                            setExpandedItem(isExpanded ? null : itemId)
                          }
                          aria-expanded={isExpanded}
                        >
                          <span>
                            <span className="question-title">
                              {item.question}
                            </span>
                            <span className="question-meta">
                              {item.intention && (
                                <span className="pill">{item.intention}</span>
                              )}
                            </span>
                          </span>
                          <span className="expand-indicator" aria-hidden="true">
                            {isExpanded ? "−" : "+"}
                          </span>
                        </button>

                        {isExpanded && (
                          <p className="answer-block">
                            {item.answer || "No answer guidance was provided."}
                          </p>
                        )}
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p className="report-empty">
                  No {questionTabLabel.toLowerCase()} were included in this
                  report.
                </p>
              )}
            </div>
          </div>
        </section>

        <aside className="report-panel right-panel">
          <div className="right-heading">
            <h2>Skill Analysis</h2>
            <p>Focus areas to sharpen</p>
          </div>

          <div className="skill-stack">
            {sortedSkillGaps.length ? (
              sortedSkillGaps.map((gap, index) => {
                const skill = gap.skills ?? gap.skill ?? "Unspecified skill";
                return (
                  <div
                    key={`${skill}-${index}`}
                    className={`skill-pill severity-${gap.severity}`}
                  >
                    <span className="skill-name">{skill}</span>
                    <span className="severity-badge">{gap.severity}</span>
                  </div>
                );
              })
            ) : (
              <p className="report-empty">No skill gaps were listed.</p>
            )}
          </div>

          <div className="prep-progress-card">
            <div className="progress-caption">
              <span>Preparation progress</span>
              <strong>{progressPercent}%</strong>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p>
              {completedCount} of {totalTasks} tasks complete
            </p>
          </div>
        </aside>
      </div>

      <details className="report-source-details">
        <summary>View the text used to generate this report</summary>
        <div className="report-source-content">
          <section>
            <h2>Job description</h2>
            <pre>{report.jobDescription || "No job description was saved."}</pre>
          </section>
          <section>
            <h2>Self-description</h2>
            <pre>{report.selfDescription || "No self-description was saved."}</pre>
          </section>
          <section>
            <h2>Extracted resume text</h2>
            <pre>{report.resume || "No resume text was saved."}</pre>
          </section>
        </div>
      </details>
    </main>
  );
};

export default Interview;
