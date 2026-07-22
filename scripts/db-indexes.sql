-- Database indexes for Matrica / Chandrachaya (Postgres).
--
-- Apply via the Supabase SQL editor. These CREATE INDEX statements mirror the
-- @@index lines in prisma/schema.prisma exactly (same names, columns, tables),
-- so running `prisma db push` will recognise them as already-present and will
-- NOT drop them. Idempotent: IF NOT EXISTS means it is safe to re-run.

-- AdminSession
CREATE INDEX IF NOT EXISTS "AdminSession_userId_idx" ON public."AdminSession" ("userId");

-- Project child tables
CREATE INDEX IF NOT EXISTS "PaymentPlan_projectId_idx" ON public."PaymentPlan" ("projectId");
CREATE INDEX IF NOT EXISTS "ProjectAmenity_projectId_idx" ON public."ProjectAmenity" ("projectId");
CREATE INDEX IF NOT EXISTS "ProjectDistance_projectId_idx" ON public."ProjectDistance" ("projectId");
CREATE INDEX IF NOT EXISTS "ProjectDocument_projectId_idx" ON public."ProjectDocument" ("projectId");
CREATE INDEX IF NOT EXISTS "ProjectFaq_projectId_idx" ON public."ProjectFaq" ("projectId");
CREATE INDEX IF NOT EXISTS "ProjectHighlight_projectId_idx" ON public."ProjectHighlight" ("projectId");
CREATE INDEX IF NOT EXISTS "ProjectImage_projectId_idx" ON public."ProjectImage" ("projectId");
CREATE INDEX IF NOT EXISTS "ProjectLandmark_projectId_idx" ON public."ProjectLandmark" ("projectId");
CREATE INDEX IF NOT EXISTS "ProjectSpec_projectId_idx" ON public."ProjectSpec" ("projectId");
CREATE INDEX IF NOT EXISTS "ProjectStage_projectId_idx" ON public."ProjectStage" ("projectId");
CREATE INDEX IF NOT EXISTS "SiteVisitBooking_projectId_idx" ON public."SiteVisitBooking" ("projectId");
CREATE INDEX IF NOT EXISTS "Testimonial_projectId_idx" ON public."Testimonial" ("projectId");

-- WhatsAppMessage
CREATE INDEX IF NOT EXISTS "WhatsAppMessage_leadId_idx" ON public."WhatsAppMessage" ("leadId");
CREATE INDEX IF NOT EXISTS "WhatsAppMessage_templateId_idx" ON public."WhatsAppMessage" ("templateId");

-- Lead (already in schema)
CREATE INDEX IF NOT EXISTS "Lead_status_createdAt_idx" ON public."Lead" ("status","createdAt");
CREATE INDEX IF NOT EXISTS "Lead_assignedTo_idx" ON public."Lead" ("assignedTo");
CREATE INDEX IF NOT EXISTS "Lead_projectId_idx" ON public."Lead" ("projectId");
CREATE INDEX IF NOT EXISTS "Lead_phone_idx" ON public."Lead" ("phone");
CREATE INDEX IF NOT EXISTS "Lead_aiScore_idx" ON public."Lead" ("aiScore");

-- Lead child tables (already in schema)
CREATE INDEX IF NOT EXISTS "LeadTagAssignment_tagId_idx" ON public."LeadTagAssignment" ("tagId");
CREATE INDEX IF NOT EXISTS "LeadFollowUp_leadId_idx" ON public."LeadFollowUp" ("leadId");
CREATE INDEX IF NOT EXISTS "LeadFollowUp_status_dueDate_idx" ON public."LeadFollowUp" ("status","dueDate");
CREATE INDEX IF NOT EXISTS "LeadNote_leadId_idx" ON public."LeadNote" ("leadId");
CREATE INDEX IF NOT EXISTS "LeadActivity_leadId_idx" ON public."LeadActivity" ("leadId");

-- BlogPost (already in schema)
CREATE INDEX IF NOT EXISTS "BlogPost_status_publishedAt_idx" ON public."BlogPost" ("status","publishedAt");

-- GalleryItem (already in schema)
CREATE INDEX IF NOT EXISTS "GalleryItem_categoryId_idx" ON public."GalleryItem" ("categoryId");
