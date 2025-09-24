import { NextRequest, NextResponse } from "next/server";
import {
  getEmailWorkflows,
  getWorkflowEnrollments,
  updateWorkflowEnrollment,
  getEmailTemplate,
  getSettings,
  getEmailContact,
  cosmic
} from "@/lib/cosmic";
import { sendEmail } from "@/lib/resend";
import { createUnsubscribeUrl } from "@/lib/email-tracking";
import { EmailWorkflow, WorkflowEnrollment, EmailContact, Settings, EmailTemplate } from "@/types";

const BATCH_SIZE = 100; // Process 100 enrollments per batch
const MAX_PROCESSING_TIME = 25000; // 25 seconds max processing time

export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request (optional for development)
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.log("Warning: No valid cron secret provided. This should only happen in development.");
    }

    console.log("Workflow processing cron job started");
    const startTime = Date.now();

    // Get all active workflows
    const workflows = await getEmailWorkflows();
    const activeWorkflows = workflows.filter(
      (workflow) => workflow.metadata.status?.value === "Active"
    );

    console.log(`Found ${activeWorkflows.length} active workflows to process`);

    if (activeWorkflows.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No active workflows to process",
        processed: 0,
      });
    }

    // Get settings for email sending
    const settings = await getSettings();
    if (!settings) {
      console.error("No settings found - cannot send workflow emails");
      return NextResponse.json(
        { error: "Email settings not configured" },
        { status: 500 }
      );
    }

    let totalProcessed = 0;
    let totalSent = 0;
    let totalFailed = 0;

    // Process each active workflow
    for (const workflow of activeWorkflows) {
      // Check if we're running out of time
      if (Date.now() - startTime > MAX_PROCESSING_TIME) {
        console.log("Approaching time limit, stopping processing");
        break;
      }

      try {
        console.log(`Processing workflow: ${workflow.metadata.name} (${workflow.id})`);
        
        const result = await processWorkflowBatch(workflow, settings);
        totalProcessed += result.processed;
        totalSent += result.sent;
        totalFailed += result.failed;

        // Update workflow statistics
        if (result.processed > 0) {
          await updateWorkflowStats(workflow.id);
        }

      } catch (error) {
        console.error(`Error processing workflow ${workflow.id}:`, error);
        // Continue with other workflows even if one fails
      }
    }

    const executionTime = Date.now() - startTime;
    console.log(`Workflow cron job completed in ${executionTime}ms`);
    console.log(`Total: ${totalProcessed} enrollments processed, ${totalSent} emails sent, ${totalFailed} failed`);

    return NextResponse.json({
      success: true,
      message: `Processed ${totalProcessed} enrollments across ${activeWorkflows.length} workflows`,
      processed: totalProcessed,
      sent: totalSent,
      failed: totalFailed,
      executionTime: executionTime
    });

  } catch (error) {
    console.error("Workflow cron job error:", error);
    return NextResponse.json({ 
      error: "Workflow processing failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

async function processWorkflowBatch(
  workflow: EmailWorkflow,
  settings: Settings
): Promise<{ processed: number; sent: number; failed: number }> {
  
  console.log(`Processing workflow batch for: ${workflow.metadata.name}`);
  
  // Get all enrollments for this workflow that need processing
  const enrollments = await getWorkflowEnrollments(workflow.id);
  
  const activeEnrollments = enrollments.filter(enrollment => 
    enrollment.metadata.status.value === "Active" &&
    enrollment.metadata.next_send_date &&
    new Date(enrollment.metadata.next_send_date) <= new Date()
  );

  console.log(`Found ${activeEnrollments.length} enrollments ready for processing`);

  if (activeEnrollments.length === 0) {
    return { processed: 0, sent: 0, failed: 0 };
  }

  let processed = 0;
  let sent = 0;
  let failed = 0;

  // Process enrollments in smaller batches
  const batchSize = Math.min(BATCH_SIZE, activeEnrollments.length);
  const batch = activeEnrollments.slice(0, batchSize);

  for (const enrollment of batch) {
    try {
      const result = await processWorkflowEnrollment(enrollment, workflow, settings);
      processed++;
      
      if (result.sent) {
        sent++;
      } else if (result.failed) {
        failed++;
      }

    } catch (error) {
      console.error(`Error processing enrollment ${enrollment.id}:`, error);
      failed++;
    }
  }

  console.log(`Workflow ${workflow.id} batch completed: ${processed} processed, ${sent} sent, ${failed} failed`);
  
  return { processed, sent, failed };
}

async function processWorkflowEnrollment(
  enrollment: WorkflowEnrollment,
  workflow: EmailWorkflow,
  settings: Settings
): Promise<{ sent: boolean; failed: boolean; completed: boolean }> {

  const currentStep = enrollment.metadata.current_step;
  const workflowStep = workflow.metadata.steps.find(step => step.step_number === currentStep);
  
  if (!workflowStep || !workflowStep.active) {
    console.log(`Step ${currentStep} not found or inactive for enrollment ${enrollment.id}`);
    return { sent: false, failed: false, completed: false };
  }

  try {
    // Get the contact and template
    const contact = await getEmailContact(enrollment.metadata.contact_id);
    const template = await getEmailTemplate(workflowStep.template_id);

    if (!contact) {
      console.error(`Contact ${enrollment.metadata.contact_id} not found`);
      return { sent: false, failed: true, completed: false };
    }

    if (!template) {
      console.error(`Template ${workflowStep.template_id} not found`);
      return { sent: false, failed: true, completed: false };
    }

    // Skip if contact is not active
    if (contact.metadata.status.value !== "Active") {
      console.log(`Contact ${contact.metadata.email} is not active, skipping`);
      
      // Update enrollment to unsubscribed status
      await updateWorkflowEnrollment(enrollment.id, {
        status: "Unsubscribed",
        completed_date: new Date().toISOString()
      });
      
      return { sent: false, failed: false, completed: true };
    }

    // Send the email
    await sendWorkflowEmail(contact, template, workflow, enrollment, settings);
    
    // Update step history
    const newStepHistory = [
      ...enrollment.metadata.step_history,
      {
        step_number: currentStep,
        sent_date: new Date().toISOString(),
        status: "Sent" as const
      }
    ];

    // Check if this is the last step
    const isLastStep = currentStep >= workflow.metadata.steps.length;
    
    if (isLastStep) {
      // Complete the enrollment
      await updateWorkflowEnrollment(enrollment.id, {
        status: "Completed",
        completed_date: new Date().toISOString(),
        step_history: newStepHistory
      });
      
      console.log(`Enrollment ${enrollment.id} completed workflow`);
      return { sent: true, failed: false, completed: true };
      
    } else {
      // Move to next step
      const nextStep = workflow.metadata.steps.find(step => step.step_number === currentStep + 1);
      let nextSendDate = "";
      
      if (nextStep) {
        const now = new Date();
        const delayMs = (nextStep.delay_days * 24 * 60 * 60 * 1000) +
                       (nextStep.delay_hours * 60 * 60 * 1000) +
                       (nextStep.delay_minutes * 60 * 1000);
        nextSendDate = new Date(now.getTime() + delayMs).toISOString();
      }

      await updateWorkflowEnrollment(enrollment.id, {
        current_step: currentStep + 1,
        next_send_date: nextSendDate,
        step_history: newStepHistory
      });
      
      console.log(`Enrollment ${enrollment.id} moved to step ${currentStep + 1}`);
      return { sent: true, failed: false, completed: false };
    }

  } catch (error) {
    console.error(`Failed to process enrollment ${enrollment.id}:`, error);
    
    // Update step history with failure
    const newStepHistory = [
      ...enrollment.metadata.step_history,
      {
        step_number: currentStep,
        sent_date: new Date().toISOString(),
        status: "Failed" as const
      }
    ];

    // Mark enrollment as failed if too many failures
    const failedSteps = newStepHistory.filter(step => step.status === "Failed").length;
    
    if (failedSteps >= 3) {
      await updateWorkflowEnrollment(enrollment.id, {
        status: "Failed",
        step_history: newStepHistory
      });
    } else {
      // Retry later - set next send date to 1 hour from now
      const retryDate = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      await updateWorkflowEnrollment(enrollment.id, {
        next_send_date: retryDate,
        step_history: newStepHistory
      });
    }

    return { sent: false, failed: true, completed: false };
  }
}

async function sendWorkflowEmail(
  contact: EmailContact,
  template: EmailTemplate,
  workflow: EmailWorkflow,
  enrollment: WorkflowEnrollment,
  settings: Settings
): Promise<void> {

  // Personalize content
  let personalizedContent = template.metadata.content;
  let personalizedSubject = template.metadata.subject;

  // Replace template variables
  personalizedContent = personalizedContent.replace(
    /\{\{first_name\}\}/g,
    contact.metadata.first_name || "there"
  );
  personalizedContent = personalizedContent.replace(
    /\{\{last_name\}\}/g,
    contact.metadata.last_name || ""
  );
  personalizedSubject = personalizedSubject.replace(
    /\{\{first_name\}\}/g,
    contact.metadata.first_name || "there"
  );
  personalizedSubject = personalizedSubject.replace(
    /\{\{last_name\}\}/g,
    contact.metadata.last_name || ""
  );

  // Get base URL for unsubscribe
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Add unsubscribe footer
  const unsubscribeUrl = createUnsubscribeUrl(
    contact.metadata.email,
    baseUrl,
    workflow.id
  );

  const finalContent = personalizedContent + `
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; text-align: center; font-size: 12px; color: #666;">
      <p>
        You're receiving this email as part of our ${workflow.metadata.name} workflow.
        <br>
        <a href="${unsubscribeUrl}" style="color: #666; text-decoration: underline;">Unsubscribe</a> from future emails.
      </p>
    </div>
  `;

  // Send email via Resend
  await sendEmail({
    to: [contact.metadata.email],
    subject: personalizedSubject,
    html: finalContent,
    from: `${settings.metadata.from_name} <${settings.metadata.from_email}>`,
    reply_to: settings.metadata.reply_to_email || settings.metadata.from_email,
    headers: {
      "X-Workflow-ID": workflow.id,
      "X-Enrollment-ID": enrollment.id,
      "X-Contact-ID": contact.id,
      "List-Unsubscribe": `<${unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });

  console.log(`Workflow email sent successfully to ${contact.metadata.email}`);
}

async function updateWorkflowStats(workflowId: string): Promise<void> {
  try {
    // Get all enrollments for this workflow
    const enrollments = await getWorkflowEnrollments(workflowId);
    
    const totalEnrolled = enrollments.length;
    const totalCompleted = enrollments.filter(e => e.metadata.status.value === "Completed").length;
    const completionRate = totalEnrolled > 0 ? Math.round((totalCompleted / totalEnrolled) * 100) : 0;
    
    // Count total emails sent (from step history)
    let totalEmailsSent = 0;
    for (const enrollment of enrollments) {
      totalEmailsSent += enrollment.metadata.step_history.filter(step => step.status === "Sent").length;
    }

    // Update workflow statistics
    await cosmic.objects.updateOne(workflowId, {
      metadata: {
        stats: {
          total_enrolled: totalEnrolled,
          total_completed: totalCompleted,
          completion_rate: `${completionRate}%`,
          total_emails_sent: totalEmailsSent
        }
      }
    });

    console.log(`Updated stats for workflow ${workflowId}: ${totalEnrolled} enrolled, ${totalCompleted} completed, ${totalEmailsSent} emails sent`);
    
  } catch (error) {
    console.error(`Error updating workflow stats for ${workflowId}:`, error);
    // Don't throw - this is not critical for workflow operation
  }
}