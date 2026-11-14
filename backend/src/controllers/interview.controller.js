import { PDFParse } from "pdf-parse";
import {
  generateInterviewReport,
  generateResumePDF,
} from "../services/ai.services.js";
import { interviewReportModel } from "../models/interviewReport.model.js";

async function generateInterviewReportController(req, res) {
  try {
    const resumeFile = req.file;

    if (!resumeFile) {
      return res.status(400).json({ message: "Resume PDF file is required." });
    }

    // Extract text from PDF buffer using pdf-parse v2
    const parser = new PDFParse(Uint8Array.from(resumeFile.buffer));
    const resumeContent = await parser.getText();
    const { selfDescription, jobDescription } = req.body;

    if (!jobDescription) {
      return res.status(400).json({ message: "Job description is required." });
    }

    const interviewReportByAI = await generateInterviewReport({
      resume: resumeContent.text || resumeContent,
      selfDescription: selfDescription || "",
      jobDescription,
    });

    const interviewReport = await interviewReportModel.create({
      user: req.user.id,
      resume: resumeContent.text || resumeContent,
      selfDescription: selfDescription || "",
      jobDescription: jobDescription,
      matchScore: interviewReportByAI.matchScore,
      technicalQuestions: interviewReportByAI.technicalQuestions,
      behaviouralQuestions: interviewReportByAI.behavioralQuestions,
      skillGap: interviewReportByAI.skillGap,
      preparationPlan: interviewReportByAI.preparationPlan,
      title: interviewReportByAI.title,
    });

    return res.status(201).json({
      message: "Interview report generated successfully",
      interviewReport,
    });
  } catch (error) {
    console.error("Error in generateInterviewReportController:", error);
    // if (res.headersSent) {
    //   return;
    // }

    return res.status(500).json({
      message: "Failed to generate interview report",
      error: error.message,
    });
  }
}

async function getInterviewReportByID(req, res) {
  try {
    const { interviewReportId } = req.params;

    const interviewReport =
      await interviewReportModel.findById(interviewReportId);

    if (!interviewReport) {
      return res.status(404).json({
        message: "Interview Report not found",
      });
    }

    return res.status(200).json({
      message: "Interview report fetched successfully.",
      interviewReport,
    });
  } catch (error) {
    console.error("Error in getInterviewReportByID:", error);
  }
}

async function getInterviewReportByUserId(req, res) {
  try {
    // FIX: Remove invalid function call .length() and chained query syntax
    const interviewReports = await interviewReportModel
      .find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .select("-resume");

    if (!interviewReports || interviewReports.length === 0) {
      return res.status(404).json({
        message: "No interview reports found for this user.",
      });
    }

    return res.status(200).json({
      message: "Interview reports fetched successfully.",
      interviewReports,
    });
  } catch (error) {
    console.error("Error in getInterviewReportByUserId:", error);
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ message: "Server error fetching user reports" });
    }
  }
}

async function getResumePDF(req, res) {
  try {
    const { interviewReportId } = req.params;

    const interviewReport =
      await interviewReportModel.findById(interviewReportId);

    if (!interviewReport) {
      return res.status(404).json({ message: "Interview report not found" });
    }

    const { resume, jobDescription, selfDescription } = interviewReport;

    const resumePDFBuffer = await generateResumePDF({
      resume,
      jobDescription,
      selfDescription,
    });

    if (!resumePDFBuffer) {
      return res.status(500).json({ message: "Failed to render PDF buffer" });
    }

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="resume_${interviewReportId}.pdf"`,
      "Content-Length": resumePDFBuffer.length,
    });

    return res.end(resumePDFBuffer);
  } catch (error) {
    console.error("Error in getResumePDF:", error);
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ message: "Failed to retrieve PDF", error: error.message });
    }
  }
}

export {
  generateInterviewReportController,
  getInterviewReportByID,
  getInterviewReportByUserId,
  getResumePDF,
};
