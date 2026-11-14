import express from "express";
import { authUser } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/file.middleware.js";
import {
  generateInterviewReportController,
  getInterviewReportByID,
  getInterviewReportByUserId,
  getResumePDF,
} from "../controllers/interview.controller.js";

const interviewRouter = express.Router();

/**
 * @route POST /api/interview/.
 * @description generate new interview report on the basis of user self description. resume odf and job description
 * @access private
 */

interviewRouter.post(
  "/",
  authUser,
  upload.single("resume"),
  generateInterviewReportController,
);

/**
 * @route POST /api/interview/report/:interviewReportId
 * @description gets specific interview report based on id
 * @access private
 */

interviewRouter.get(
  "/report/:interviewReportId",
  authUser,
  getInterviewReportByID,
);

/**
 * @route POST /api/interview/reports
 * @description generate new interview report on the basis of user self description. resume odf and job description
 * @access private
 */

interviewRouter.get("/reports", authUser, getInterviewReportByUserId);

/**
 * @route POST /api/interview/report/pdf/:interviewReportId
 * @description generate new interview report on the basis of user self description. resume odf and job description
 * @access private
 */

interviewRouter.post("/resume/pdf/:interviewReportId", authUser, getResumePDF);
export default interviewRouter;
