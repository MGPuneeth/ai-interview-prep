import { InterviewContext } from "../interviewReport.context";
import {
  generateInterviewReport,
  getInterviewReportByID,
  getInterviewReportByUserID,
} from "../services/interview.api";
import { useContext } from "react";

export const useInterview = () => {
  const context = useContext(InterviewContext);

  if (!context) {
    throw new Error("Use Interview must be used within an InterviewProvider");
  }

  const { loading, setLoading, report, setReport, reports, setReports } =
    context;

  const generateReport = async ({
    jobDescription,
    selfDescription,
    resumeFile,
  }) => {
    setLoading(true);

    try {
      const response = await generateInterviewReport({
        jobDescription,
        selfDescription,
        resumeFile,
      });
      setReport(response.interviewReport);
      return response.interviewReport;
    } catch (error) {
      console.error("Error generating interview report : ", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getReportById = async (reportId) => {
    setLoading(true);
    try {
      const response = await getInterviewReportByID(reportId);
      setReport(response.interviewReport);
      return response.interviewReport;
    } catch (error) {
      console.error("Error generating interview report : ", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getReportByUserId = async () => {
    setLoading(true);
    try {
      const response = await getInterviewReportByUserID();
      setReports(response.interviewReports);
    } catch (error) {
      console.error("Error generating interview report : ", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    setLoading,
    report,
    setReport,
    reports,
    setReports,
    generateReport,
    getReportById,
    getReportByUserId,
  };
};
