"""
Strategy prompt builder.

This module defines how we ask the LLM to produce a strict JSON payload:
- profile: customer understanding grounded in structured background
- strategy: outreach approach and sequence
- emails: initial email drafts

Important constraint:
The prompt explicitly instructs the model to only use structured customer background,
company knowledge base, and value content blocks — no invented facts.
"""

from app.models import CustomerBackground
from app.schemas.strategy_engine import StrategyEngineRequest
from app.schemas.value_content import ValueContentResponse
from app.services.company_knowledge_service import CompanyKnowledgeService


def build_strategy_prompt(
    request: StrategyEngineRequest,
    customer_background: CustomerBackground | None,
    knowledge_service: CompanyKnowledgeService,
    value_content: ValueContentResponse,
) -> str:
    product_matrix = knowledge_service.list_product_matrix()
    capabilities = knowledge_service.list_company_capabilities()
    success_cases = knowledge_service.list_success_cases()

    lines: list[str] = []

    lines.append("You are an experienced B2B foreign trade sales professional.")
    lines.append(
        "You must follow the reasoning pipeline strictly and rely only on the "
        "structured data provided below."
    )
    if request.language:
        lines.append(f"Output language: {request.language}.")

    lines.append("")
    lines.append("=== STEP 0: DATA CONSTRAINTS ===")
    lines.append(
        "You may use only these data sources: structured customer background, "
        "company knowledge base, and the provided value content blocks."
    )
    lines.append("Do not invent company facts or customer details.")

    lines.append("")
    lines.append("=== CUSTOMER BACKGROUND (STRUCTURED) ===")
    if customer_background is None:
        lines.append("No customer background available.")
    else:
        cb = customer_background
        lines.append(f"Company name: {cb.company_name}")
        if cb.company_type:
            lines.append(f"Company type: {cb.company_type}")
        if cb.main_market:
            lines.append(f"Main market: {cb.main_market}")
        if cb.company_size_employees:
            lines.append(f"Company size (employees): {cb.company_size_employees}")
        if cb.company_size_revenue:
            lines.append(f"Company size (revenue): {cb.company_size_revenue}")
        if cb.has_own_brand is not None:
            lines.append(f"Has own brand: {cb.has_own_brand}")
        if cb.product_matrix_description:
            lines.append(f"Product matrix: {cb.product_matrix_description}")
        if cb.customization_requirement:
            lines.append(f"Customization requirement: {cb.customization_requirement}")
        if cb.ecommerce_seller is not None:
            lines.append(f"Ecommerce seller: {cb.ecommerce_seller}")
        if cb.independent_store is not None:
            lines.append(f"Independent store: {cb.independent_store}")
        if cb.offline_retail is not None:
            lines.append(f"Offline retail: {cb.offline_retail}")
        if cb.corporate_gifts is not None:
            lines.append(f"Corporate gifts: {cb.corporate_gifts}")
        if cb.average_price_level:
            lines.append(f"Average price level: {cb.average_price_level}")
        if cb.design_style:
            lines.append(f"Design style: {cb.design_style}")
        if cb.target_customer_profile:
            lines.append(f"Target customer profile: {cb.target_customer_profile}")
        if cb.sustainability_focus:
            lines.append(f"Sustainability focus: {cb.sustainability_focus}")
        if cb.buyer_role:
            lines.append(f"Buyer role: {cb.buyer_role}")
        if cb.decision_maker_role:
            lines.append(f"Decision maker role: {cb.decision_maker_role}")
        if cb.linkedin_activity:
            lines.append(f"LinkedIn activity: {cb.linkedin_activity}")
        if cb.previous_contact is not None:
            lines.append(f"Previous contact: {cb.previous_contact}")
        if cb.contact_notes:
            lines.append(f"Contact notes: {cb.contact_notes}")

    lines.append("")
    lines.append("=== COMPANY KNOWLEDGE BASE ===")
    lines.append("Product matrix:")
    if not product_matrix:
        lines.append("- None.")
    else:
        for idx, pm in enumerate(product_matrix, start=1):
            lines.append(
                f"- [{idx}] Categories: {pm.main_product_categories}; "
                f"Features: {pm.product_features or 'N/A'}"
            )

    lines.append("Company capabilities:")
    if not capabilities:
        lines.append("- None.")
    else:
        for idx, cap in enumerate(capabilities, start=1):
            lines.append(
                f"- [{idx}] MOQ: {cap.moq or 'N/A'}, "
                f"Lead time: {cap.lead_time or 'N/A'}, "
                f"Customization: {cap.customization_capability or 'N/A'}, "
                f"Certifications: {cap.certifications or 'N/A'}"
            )

    lines.append("Success cases:")
    if not success_cases:
        lines.append("- None.")
    else:
        for idx, case in enumerate(success_cases, start=1):
            lines.append(
                f"- [{idx}] Client: {case.client_name}; "
                f"Project: {case.project_description or 'N/A'}; "
                f"Result: {case.result_summary or 'N/A'}"
            )

    lines.append("")
    lines.append("=== VALUE CONTENT BLOCKS ===")
    lines.append(
        f"Requested value content type: {value_content.content_type.value}. "
        "These blocks have been generated earlier and should be used as the core "
        "value payload in the outreach emails."
    )
    for idx, item in enumerate(value_content.items, start=1):
        lines.append(f"- Block {idx} title: {item.title}")
        lines.append(f"  Summary: {item.summary}")
        lines.append(f"  Body: {item.body}")

    lines.append("")
    lines.append("=== STEP 1: CUSTOMER PROFILE ===")
    lines.append(
        "Create a concise customer profile with the following fields:\n"
        "- summary: 2-3 sentences about who this customer is.\n"
        "- risks: perceived risks or concerns from the customer's perspective.\n"
        "- opportunities: where our offering can create value.\n"
        "- positioning: how we should position ourselves to this customer."
    )

    lines.append("")
    lines.append("=== STEP 2: OUTREACH STRATEGY ===")
    lines.append(
        "Based on the profile, define a sales outreach strategy that follows these "
        "principles:\n"
        "- focus on providing value\n"
        "- avoid aggressive selling\n"
        "- soft call-to-action\n"
        "- build trust first\n"
        "Output fields:\n"
        "- goal: the primary objective of the first outreach.\n"
        "- core_value_message: what value we highlight.\n"
        "- sequence_overview: how we plan the first 2-3 touches (email only)."
    )

    lines.append("")
    lines.append("=== STEP 3: OUTREACH EMAIL CONTENT ===")
    lines.append(
        "Generate 1–2 outreach email drafts that:\n"
        "- are fully aligned with the strategy above\n"
        "- embed the provided value content blocks naturally (do not copy verbatim)\n"
        "- use a soft, trust-building call-to-action\n"
        "- avoid generic sales jargon\n"
        "Output each email with fields:\n"
        "- subject\n"
        "- body"
    )

    lines.append("")
    lines.append(
        "Return your final answer in a clearly delimited JSON structure with keys: "
        "profile, strategy, emails. Do not include any additional commentary."
    )

    return "\n".join(lines)
