"""
Follow-up email prompt builder.

This prompt is used AFTER an initial outreach has been sent.
It takes the current follow-up stage (CONTACTED/FOLLOWUP_1/FOLLOWUP_2/FOLLOWUP_3/EMAIL_OPENED)
and instructs the LLM to write one email that matches that stage.

Data constraints:
- Uses structured customer background + internal knowledge base + value content blocks only.
- Avoids inventing customer/company facts.
"""

from app.models import CustomerBackground
from app.schemas.followup import FollowUpStatus
from app.schemas.strategy_engine import StrategyEngineRequest
from app.schemas.value_content import ValueContentResponse
from app.services.company_knowledge_service import CompanyKnowledgeService


def build_followup_email_prompt(
    status: FollowUpStatus,
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
        "Generate a follow-up email that respects the current follow-up stage and "
        "uses only the structured data below."
    )

    if request.language:
        lines.append(f"Output language: {request.language}.")

    lines.append("")
    lines.append(f"Follow-up stage: {status.value}.")

    if status == FollowUpStatus.CONTACTED:
        lines.append(
            "This is the initial outreach email after first contact. "
            "Focus on value and discovery, with a very soft call-to-action."
        )
    elif status == FollowUpStatus.FOLLOWUP_1:
        lines.append(
            "This is the first follow-up (1 day after open). "
            "Reference the previous email lightly and add one new piece of value."
        )
    elif status == FollowUpStatus.FOLLOWUP_2:
        lines.append(
            "This is the second follow-up (3 days after no reply). "
            "Acknowledge that the customer may be busy and offer a concrete idea."
        )
    elif status == FollowUpStatus.FOLLOWUP_3:
        lines.append(
            "This is the third follow-up (7 days after no reply). "
            "Keep it short and focused on whether there is any interest at all."
        )
    elif status == FollowUpStatus.STOPPED:
        lines.append(
            "This is the final polite message before stopping outreach. "
            "Be respectful and leave the door open for future contact."
        )

    lines.append("")
    lines.append("Customer background:")
    if customer_background is None:
        lines.append("No customer background available.")
    else:
        lines.append(f"Company name: {customer_background.company_name}")
        if customer_background.main_market:
            lines.append(f"Main market: {customer_background.main_market}")
        if customer_background.target_customer_profile:
            lines.append(f"Target customer profile: {customer_background.target_customer_profile}")
        if customer_background.sustainability_focus:
            lines.append(f"Sustainability focus: {customer_background.sustainability_focus}")

    lines.append("")
    lines.append("Company knowledge:")
    if product_matrix:
        for idx, pm in enumerate(product_matrix, start=1):
            lines.append(
                f"- Product matrix [{idx}]: {pm.main_product_categories}; "
                f"Features: {pm.product_features or 'N/A'}"
            )
    if capabilities:
        for idx, cap in enumerate(capabilities, start=1):
            lines.append(
                f"- Capability [{idx}]: MOQ={cap.moq or 'N/A'}, "
                f"Lead time={cap.lead_time or 'N/A'}, "
                f"Customization={cap.customization_capability or 'N/A'}, "
                f"Certifications={cap.certifications or 'N/A'}"
            )
    if success_cases:
        for idx, case in enumerate(success_cases, start=1):
            lines.append(
                f"- Success case [{idx}]: Client={case.client_name}, "
                f"Project={case.project_description or 'N/A'}, "
                f"Result={case.result_summary or 'N/A'}"
            )

    lines.append("")
    lines.append("Value content blocks to reuse:")
    for idx, item in enumerate(value_content.items, start=1):
        lines.append(f"- Block {idx} title: {item.title}")
        lines.append(f"  Summary: {item.summary}")

    lines.append("")
    lines.append(
        "Write one email with fields:\n"
        "- subject\n"
        "- body\n"
        "Use a value-first, non-aggressive tone and a soft call-to-action. "
        "Do not invent new facts beyond the data above."
    )

    return "\n".join(lines)
