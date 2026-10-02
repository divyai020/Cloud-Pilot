import io
import csv
import logging
from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable

from app.models.user import User
from app.services.dashboard_service import (
    get_user_cloud_account,
    get_dashboard_summary,
    get_resource_summary,
    get_cost_summary,
    get_cost_trend,
    get_security_summary,
    get_recommendation_summary,
    get_latest_scan_summary
)
from app.services.ai_service import generate_ai_recommendations

logger = logging.getLogger("cloudpilot.services.report_service")

def generate_pdf_report(db: Session, user: User, account_id: UUID | None = None) -> bytes:
    """
    Generates a comprehensive executive PDF Cloud Governance Report using ReportLab.
    
    Sections included:
    1. Account Information
    2. Resource Summary
    3. Cost Summary
    4. Cost Trend
    5. Security Findings
    6. Recommendations
    7. Estimated Savings
    8. Latest Scan Status
    """
    account = get_user_cloud_account(db, user, account_id)
    summary = get_dashboard_summary(db, user, account_id=account.id)
    resources = get_resource_summary(db, user, account_id=account.id)
    costs = get_cost_summary(db, user, account_id=account.id)
    trend = get_cost_trend(db, user, account_id=account.id)
    security = get_security_summary(db, user, account_id=account.id)
    ai_recs = generate_ai_recommendations(db, user, account_id=account.id)
    latest_scan = get_latest_scan_summary(db, user, account_id=account.id)

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=22,
        leading=26,
        textColor=colors.HexColor("#1e293b"),
        alignment=0
    )

    h1_style = ParagraphStyle(
        "SectionH1",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=16,
        textColor=colors.HexColor("#0f172a"),
        spaceBefore=10,
        spaceAfter=4
    )

    body_style = ParagraphStyle(
        "BodyDark",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#334155")
    )

    bold_body_style = ParagraphStyle(
        "BodyDarkBold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#0f172a")
    )

    elements = []

    # Document Header
    elements.append(Paragraph("Cloud Pilot — Executive Cloud Governance Report", title_style))
    elements.append(Paragraph(f"Generated for User: {user.full_name} ({user.email}) | Date: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}", body_style))
    elements.append(Spacer(1, 8))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#3b82f6"), spaceAfter=12))

    # Section 1: Account Information
    elements.append(Paragraph("1. Account Information", h1_style))
    acc_data = [
        [Paragraph("<b>Account Name:</b>", body_style), Paragraph(str(account.account_name), body_style),
         Paragraph("<b>Account ID:</b>", body_style), Paragraph(str(account.id), body_style)],
        [Paragraph("<b>Account Type:</b>", body_style), Paragraph(str(account.account_type).upper(), body_style),
         Paragraph("<b>AWS Account ID:</b>", body_style), Paragraph(str(account.aws_account_id or "N/A"), body_style)],
        [Paragraph("<b>Region:</b>", body_style), Paragraph(str(account.region or "ap-south-1"), body_style),
         Paragraph("<b>Health Score:</b>", body_style), Paragraph(f"{account.health_score or 100}/100", bold_body_style)],
    ]
    acc_table = Table(acc_data, colWidths=[110, 160, 110, 160])
    acc_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('PADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(acc_table)
    elements.append(Spacer(1, 10))

    # Section 2: Resource Summary
    elements.append(Paragraph("2. Resource Summary", h1_style))
    by_type_str = ", ".join([f"{k}: {v}" for k, v in resources["byType"].items()]) if resources["byType"] else "None"
    by_region_str = ", ".join([f"{k}: {v}" for k, v in resources["byRegion"].items()]) if resources["byRegion"] else "None"
    res_data = [
        [Paragraph("<b>Total Resources Discovered:</b>", body_style), Paragraph(str(resources["totalResources"]), bold_body_style)],
        [Paragraph("<b>Resources by Type:</b>", body_style), Paragraph(by_type_str, body_style)],
        [Paragraph("<b>Resources by Region:</b>", body_style), Paragraph(by_region_str, body_style)],
    ]
    res_table = Table(res_data, colWidths=[180, 360])
    res_table.setStyle(TableStyle([
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('PADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(res_table)
    elements.append(Spacer(1, 10))

    # Section 3: Cost Summary
    elements.append(Paragraph("3. Cost Summary", h1_style))
    prev_cost_str = f"${costs['previousMonthCost']:,.2f}" if costs['previousMonthCost'] is not None else "N/A"
    diff_str = f"${costs['difference']:,.2f}" if costs['difference'] is not None else "N/A"
    pct_str = f"{costs['percentageChange']}%" if costs['percentageChange'] is not None else "N/A"

    cost_data = [
        [Paragraph("<b>Metric</b>", bold_body_style), Paragraph("<b>Amount</b>", bold_body_style)],
        [Paragraph("Total Cumulative Cost", body_style), Paragraph(f"${costs['totalCost']:,.2f}", body_style)],
        [Paragraph("Latest Month Spending", body_style), Paragraph(f"${costs['latestMonthCost']:,.2f}", bold_body_style)],
        [Paragraph("Previous Month Spending", body_style), Paragraph(prev_cost_str, body_style)],
        [Paragraph("Month-over-Month Difference", body_style), Paragraph(diff_str, body_style)],
        [Paragraph("Month-over-Month Change (%)", body_style), Paragraph(pct_str, body_style)],
    ]
    cost_table = Table(cost_data, colWidths=[270, 270])
    cost_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('PADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(cost_table)
    elements.append(Spacer(1, 10))

    # Section 4: Cost Trend
    elements.append(Paragraph("4. Cost Trend (Monthly Spending)", h1_style))
    trend_rows = [[Paragraph("<b>Period</b>", bold_body_style), Paragraph("<b>Monthly Cost</b>", bold_body_style)]]
    for t_item in trend["trend"]:
        trend_rows.append([Paragraph(t_item["period"], body_style), Paragraph(f"${t_item['cost']:,.2f}", body_style)])
    
    if len(trend_rows) == 1:
        trend_rows.append([Paragraph("No cost trend history available", body_style), Paragraph("$0.00", body_style)])

    trend_table = Table(trend_rows, colWidths=[270, 270])
    trend_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('PADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(trend_table)
    elements.append(Spacer(1, 10))

    # Section 5: Security Findings
    elements.append(Paragraph("5. Security Audit Findings", h1_style))
    sev_str = f"Critical: {security['bySeverity'].get('Critical', 0)} | High: {security['bySeverity'].get('High', 0)} | Medium: {security['bySeverity'].get('Medium', 0)} | Low: {security['bySeverity'].get('Low', 0)}"
    sec_data = [
        [Paragraph("<b>Total Security Findings:</b>", body_style), Paragraph(str(security["totalFindings"]), bold_body_style)],
        [Paragraph("<b>Findings by Severity:</b>", body_style), Paragraph(sev_str, body_style)],
    ]
    sec_table = Table(sec_data, colWidths=[180, 360])
    sec_table.setStyle(TableStyle([
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('PADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(sec_table)
    elements.append(Spacer(1, 10))

    # Section 6: Recommendations
    elements.append(Paragraph("6. AI / Rule-Based Recommendations", h1_style))
    rec_headers = [Paragraph("<b>Title</b>", bold_body_style), Paragraph("<b>Priority</b>", bold_body_style), Paragraph("<b>Category</b>", bold_body_style), Paragraph("<b>Est. Savings</b>", bold_body_style)]
    rec_rows = [rec_headers]
    for r in ai_recs:
        rec_rows.append([
            Paragraph(r["title"], body_style),
            Paragraph(r["priority"], body_style),
            Paragraph(r["category"], body_style),
            Paragraph(f"${r['estimated_savings']:,.2f}", bold_body_style if r['estimated_savings'] > 0 else body_style)
        ])
    if len(rec_rows) == 1:
        rec_rows.append([Paragraph("No active recommendations", body_style), Paragraph("N/A", body_style), Paragraph("N/A", body_style), Paragraph("$0.00", body_style)])

    rec_table = Table(rec_rows, colWidths=[240, 70, 80, 150])
    rec_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('PADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(rec_table)
    elements.append(Spacer(1, 10))

    # Section 7: Estimated Savings
    elements.append(Paragraph("7. Estimated Savings", h1_style))
    total_savings = sum(r["estimated_savings"] for r in ai_recs)
    savings_data = [
        [Paragraph("<b>Total Potential Cost Savings:</b>", bold_body_style), Paragraph(f"<b>${total_savings:,.2f} / month</b>", bold_body_style)]
    ]
    savings_table = Table(savings_data, colWidths=[240, 300])
    savings_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#ecfdf5")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#6ee7b7")),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(savings_table)
    elements.append(Spacer(1, 10))

    # Section 8: Latest Scan Status
    elements.append(Paragraph("8. Latest Scan Status", h1_style))
    if latest_scan:
        scan_str = f"Status: {latest_scan['status'].upper()} | Progress: {latest_scan['progress']}% | Discovered Resources: {latest_scan['resources_discovered']}"
        scan_data = [
            [Paragraph("<b>Latest Job ID:</b>", body_style), Paragraph(str(latest_scan["id"]), body_style)],
            [Paragraph("<b>Scan Status & Progress:</b>", body_style), Paragraph(scan_str, bold_body_style)],
            [Paragraph("<b>Completed At:</b>", body_style), Paragraph(str(latest_scan["completed_at"] or "In Progress"), body_style)],
        ]
    else:
        scan_data = [[Paragraph("<b>Scan Status:</b>", body_style), Paragraph("No scan jobs executed yet.", body_style)]]

    scan_table = Table(scan_data, colWidths=[180, 360])
    scan_table.setStyle(TableStyle([
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('PADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(scan_table)

    # Build Document
    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()

def generate_csv_report(db: Session, user: User, account_id: UUID | None = None) -> str:
    """
    Generates a structured CSV report exporting resources, costs, security findings, and recommendations.
    """
    account = get_user_cloud_account(db, user, account_id)
    summary = get_dashboard_summary(db, user, account_id=account.id)
    resources = get_resource_summary(db, user, account_id=account.id)
    costs = get_cost_summary(db, user, account_id=account.id)
    ai_recs = generate_ai_recommendations(db, user, account_id=account.id)

    output = io.StringIO()
    writer = csv.writer(output)

    # 1. Header & Account Info
    writer.writerow(["CLOUD PILOT - GOVERNANCE REPORT"])
    writer.writerow(["Generated User", user.full_name, user.email])
    writer.writerow(["Account Name", account.account_name])
    writer.writerow(["Account ID", str(account.id)])
    writer.writerow(["Account Type", account.account_type])
    writer.writerow(["Health Score", account.health_score or 100])
    writer.writerow([])

    # 2. Executive Metrics Summary
    writer.writerow(["EXECUTIVE SUMMARY METRICS"])
    writer.writerow(["Metric", "Value"])
    writer.writerow(["Total Resources", summary["totalResources"]])
    writer.writerow(["Total Cumulative Cost", summary["totalCost"]])
    writer.writerow(["Latest Month Cost", summary["monthlyCost"]])
    writer.writerow(["Total Security Findings", summary["securityFindings"]["total"]])
    writer.writerow(["Total Recommendations", summary["recommendationsCount"]])
    writer.writerow(["Total Potential Savings", summary["totalEstimatedSavings"]])
    writer.writerow([])

    # 3. Cost Summary
    writer.writerow(["COST ANALYTICS SUMMARY"])
    writer.writerow(["Total Cost", costs["totalCost"]])
    writer.writerow(["Latest Month Cost", costs["latestMonthCost"]])
    writer.writerow(["Previous Month Cost", costs["previousMonthCost"] or "N/A"])
    writer.writerow(["MoM Difference", costs["difference"] or "N/A"])
    writer.writerow(["MoM Change (%)", costs["percentageChange"] or "N/A"])
    writer.writerow([])

    # 4. Recommendations List
    writer.writerow(["RECOMMENDATIONS LIST"])
    writer.writerow(["ID", "Title", "Priority", "Category", "Estimated Savings ($)", "Description"])
    for r in ai_recs:
        writer.writerow([
            r["recommendation_id"],
            r["title"],
            r["priority"],
            r["category"],
            r["estimated_savings"],
            r["description"]
        ])

    return output.getvalue()
