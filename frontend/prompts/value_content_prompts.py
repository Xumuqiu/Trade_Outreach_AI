"""
Value content prompt builder.

This module asks the LLM to generate small reusable "value blocks" to support outbound emails.
Examples:
- industry_insights
- product_trend_report
- design_inspiration
- market_analysis

The output is intentionally reusable so both strategy prompts and follow-up prompts can include it.
"""

from app.models import CustomerBackground
from app.services.company_knowledge_service import CompanyKnowledgeService
from app.schemas.value_content import ValueContentRequest, ValueContentType


def build_value_content_prompt(
    request: ValueContentRequest,
    customer_background: CustomerBackground | None,
    knowledge_service: CompanyKnowledgeService,
) -> str:
    product_matrix = knowledge_service.list_product_matrix()
    capabilities = knowledge_service.list_company_capabilities()
    success_cases = knowledge_service.list_success_cases()

    lines: list[str] = []

    lines.append("You are an AI assistant for a B2B foreign trade sales team.")
    lines.append(
        "You must generate factual, helpful value content for an outreach email, "
        "strictly based on the structured data below."
    )

    if request.content_type == ValueContentType.industry_insights:
        lines.append("Content focus: industry insights.")
    elif request.content_type == ValueContentType.product_trend_report:
        lines.append("Content focus: product trend report.")
    elif request.content_type == ValueContentType.design_inspiration:
        lines.append("Content focus: design inspiration.")
    elif request.content_type == ValueContentType.market_analysis:
        lines.append("Content focus: market analysis.")

    if request.language:
        lines.append(f"Output language: {request.language}.")

    lines.append("")
    lines.append("=== CUSTOMER BACKGROUND ===")
    if customer_background is None:
        lines.append("No customer background available.")
    else:
        lines.append(f"Company name: {customer_background.company_name}")
        if customer_background.main_market:
            lines.append(f"Main market: {customer_background.main_market}")
        if customer_background.target_customer_profile:
            lines.append(
                f"Target customer profile: {customer_background.target_customer_profile}"
            )
        if customer_background.sustainability_focus:
            lines.append(
                f"Sustainability focus: {customer_background.sustainability_focus}"
            )
        if customer_background.additional_notes:
            lines.append(f"Additional notes: {customer_background.additional_notes}")

    lines.append("")
    lines.append("=== PRODUCT MATRIX ===")
    if not product_matrix:
        lines.append("No product matrix entries.")
    else:
        for idx, pm in enumerate(product_matrix, start=1):
            lines.append(
                f"- [{idx}] Categories: {pm.main_product_categories}; "
                f"Features: {pm.product_features or 'N/A'}"
            )

    lines.append("")
    lines.append("=== COMPANY CAPABILITIES ===")
    if not capabilities:
        lines.append("No company capabilities defined.")
    else:
        for idx, cap in enumerate(capabilities, start=1):
            lines.append(
                f"- [{idx}] MOQ: {cap.moq or 'N/A'}, "
                f"Lead time: {cap.lead_time or 'N/A'}, "
                f"Customization: {cap.customization_capability or 'N/A'}, "
                f"Certifications: {cap.certifications or 'N/A'}"
            )

    lines.append("")
    lines.append("=== SUCCESS CASES ===")
    if not success_cases:
        lines.append("No success cases.")
    else:
        for idx, case in enumerate(success_cases, start=1):
            lines.append(
                f"- [{idx}] Client: {case.client_name}; "
                f"Project: {case.project_description or 'N/A'}; "
                f"Result: {case.result_summary or 'N/A'}"
            )

    lines.append("")
    lines.append(
        "Generate 1–3 short, concrete value content blocks suitable for a cold email. "
        "For each block, provide a title, a 1-2 sentence summary, and a detailed body. "
        "Do not invent facts beyond the provided data; if something is unknown, "
        "speak in general patterns and clearly mark it as general advice."
    )

    return "\n".join(lines)
