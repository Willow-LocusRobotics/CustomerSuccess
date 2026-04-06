/**
 * Salesforce ServiceCloud integration layer.
 * Handles authentication and CRUD operations for Cases, Knowledge Articles, and Reports.
 *
 * Required environment variables:
 *   SF_LOGIN_URL        - e.g. https://login.salesforce.com
 *   SF_CLIENT_ID        - Connected App consumer key
 *   SF_CLIENT_SECRET    - Connected App consumer secret
 *   SF_USERNAME         - Integration user username
 *   SF_PASSWORD          - Integration user password + security token
 */

import jsforce, { Connection } from "jsforce";

let connection: Connection | null = null;

export async function getConnection(): Promise<Connection> {
  if (connection && connection.accessToken) {
    return connection;
  }

  const conn = new jsforce.Connection({
    loginUrl: process.env.SF_LOGIN_URL || "https://login.salesforce.com",
    oauth2: {
      clientId: process.env.SF_CLIENT_ID!,
      clientSecret: process.env.SF_CLIENT_SECRET!,
    },
  });

  await conn.login(process.env.SF_USERNAME!, process.env.SF_PASSWORD!);
  connection = conn;
  return conn;
}

// ---------------------------------------------------------------------------
// Cases
// ---------------------------------------------------------------------------

export interface SFCase {
  Id: string;
  CaseNumber: string;
  Subject: string;
  Description: string;
  Status: string;
  Priority: string;
  CreatedDate: string;
  LastModifiedDate: string;
  ContactId?: string;
  ContactEmail?: string;
  Type?: string;
  Origin?: string;
}

export interface CreateCasePayload {
  Subject: string;
  Description: string;
  Priority: string;
  Type?: string;
  ContactEmail?: string;
  Origin?: string;
}

export async function getCases(contactEmail?: string): Promise<SFCase[]> {
  const conn = await getConnection();
  let query =
    "SELECT Id, CaseNumber, Subject, Description, Status, Priority, CreatedDate, LastModifiedDate, ContactId, Type, Origin FROM Case";

  if (contactEmail) {
    query += ` WHERE Contact.Email = '${contactEmail.replace(/'/g, "\\'")}'`;
  }

  query += " ORDER BY CreatedDate DESC LIMIT 100";
  const result = await conn.query<SFCase>(query);
  return result.records;
}

export async function getCaseById(caseId: string): Promise<SFCase | null> {
  const conn = await getConnection();
  const result = await conn.query<SFCase>(
    `SELECT Id, CaseNumber, Subject, Description, Status, Priority, CreatedDate, LastModifiedDate, ContactId, Type, Origin FROM Case WHERE Id = '${caseId.replace(/'/g, "\\'")}'`
  );
  return result.records[0] || null;
}

export async function createCase(
  data: CreateCasePayload
): Promise<{ id: string; success: boolean }> {
  const conn = await getConnection();
  const result = await conn.sobject("Case").create({
    Subject: data.Subject,
    Description: data.Description,
    Priority: data.Priority,
    Type: data.Type || "Problem",
    Origin: data.Origin || "Web Portal",
  });
  return { id: result.id as string, success: result.success };
}

export async function addCaseComment(
  caseId: string,
  body: string
): Promise<{ id: string; success: boolean }> {
  const conn = await getConnection();
  const result = await conn.sobject("CaseComment").create({
    ParentId: caseId,
    CommentBody: body,
    IsPublished: true,
  });
  return { id: result.id as string, success: result.success };
}

// ---------------------------------------------------------------------------
// Knowledge Articles
// ---------------------------------------------------------------------------

export interface KnowledgeArticle {
  Id: string;
  Title: string;
  Summary?: string;
  UrlName: string;
  ArticleNumber: string;
  LastPublishedDate?: string;
  ArticleTotalViewCount?: number;
}

export async function getKnowledgeArticles(
  searchTerm?: string
): Promise<KnowledgeArticle[]> {
  const conn = await getConnection();

  if (searchTerm) {
    const result = await conn.search(
      `FIND {${searchTerm.replace(/[{}]/g, "")}} IN ALL FIELDS RETURNING KnowledgeArticleVersion(Id, Title, Summary, UrlName, ArticleNumber, LastPublishedDate, ArticleTotalViewCount WHERE PublishStatus = 'Online' AND Language = 'en_US') LIMIT 50`
    );
    return (result.searchRecords || []) as unknown as KnowledgeArticle[];
  }

  const result = await conn.query<KnowledgeArticle>(
    "SELECT Id, Title, Summary, UrlName, ArticleNumber, LastPublishedDate, ArticleTotalViewCount FROM KnowledgeArticleVersion WHERE PublishStatus = 'Online' AND Language = 'en_US' ORDER BY LastPublishedDate DESC LIMIT 50"
  );
  return result.records;
}

// ---------------------------------------------------------------------------
// Dashboard / Reporting Metrics
// ---------------------------------------------------------------------------

export interface SupportMetrics {
  openCases: number;
  resolvedThisMonth: number;
  avgResolutionHours: number;
  casesByPriority: { priority: string; count: number }[];
  casesByStatus: { status: string; count: number }[];
  casesTrend: { month: string; opened: number; closed: number }[];
  satisfactionScore: number;
}

export async function getSupportMetrics(
  contactEmail?: string
): Promise<SupportMetrics> {
  const conn = await getConnection();
  const emailFilter = contactEmail
    ? ` AND Contact.Email = '${contactEmail.replace(/'/g, "\\'")}'`
    : "";

  // Open cases count
  const openResult = await conn.query(
    `SELECT COUNT(Id) total FROM Case WHERE IsClosed = false${emailFilter}`
  );
  const openCases =
    (openResult.records[0] as Record<string, number>)?.total || 0;

  // Resolved this month
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01T00:00:00Z`;
  const resolvedResult = await conn.query(
    `SELECT COUNT(Id) total FROM Case WHERE IsClosed = true AND ClosedDate >= ${monthStart}${emailFilter}`
  );
  const resolvedThisMonth =
    (resolvedResult.records[0] as Record<string, number>)?.total || 0;

  // Cases by priority
  const priorityResult = await conn.query(
    `SELECT Priority, COUNT(Id) total FROM Case WHERE IsClosed = false${emailFilter} GROUP BY Priority`
  );
  const casesByPriority = (
    priorityResult.records as Record<string, unknown>[]
  ).map((r) => ({
    priority: r.Priority as string,
    count: r.total as number,
  }));

  // Cases by status
  const statusResult = await conn.query(
    `SELECT Status, COUNT(Id) total FROM Case${emailFilter ? " WHERE " + emailFilter.slice(5) : ""} GROUP BY Status`
  );
  const casesByStatus = (
    statusResult.records as Record<string, unknown>[]
  ).map((r) => ({
    status: r.Status as string,
    count: r.total as number,
  }));

  return {
    openCases,
    resolvedThisMonth,
    avgResolutionHours: 0, // Would require custom calculation
    casesByPriority,
    casesByStatus,
    casesTrend: [], // Would require monthly aggregation
    satisfactionScore: 0, // Would require CSAT survey data
  };
}
