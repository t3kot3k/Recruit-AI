import json
import re
from typing import Optional
from .gemini_client import generate_content
from app.schemas.cv import OptimizedCV, OptimizedCVSection


CV_OPTIMIZE_PROMPT = """You are an expert CV writer and ATS optimization specialist. Based on the original CV content and the job description, create an optimized version of the CV that maximizes ATS compatibility while remaining honest and accurate.

## Original CV Content:
{cv_text}

## Job Description:
{job_description}

## ATS Analysis Summary:
{analysis_summary}

## Missing Keywords:
{missing_keywords}

## Instructions:
1. Rewrite and optimize the CV content to better match the job description
2. Naturally incorporate the missing keywords where relevant
3. Improve section structure and wording for ATS scanners
4. Keep all information truthful — enhance wording, don't fabricate experience
5. Use strong action verbs and quantified achievements
6. Ensure clean formatting with clear section headers

Respond in the following JSON format only (no additional text):

{{
    "contact": {{
        "name": "<full name>",
        "email": "<email if found>",
        "phone": "<phone if found>",
        "location": "<city, country if found>",
        "linkedin": "<linkedin URL if found>"
    }},
    "summary": "<2-3 sentence professional summary optimized for the role>",
    "experience": [
        {{
            "title": "<job title>",
            "company": "<company name>",
            "period": "<date range>",
            "bullets": ["<achievement-focused bullet points with metrics>"]
        }}
    ],
    "education": [
        {{
            "degree": "<degree name>",
            "institution": "<school name>",
            "period": "<date range>",
            "details": "<honors, GPA, relevant coursework if applicable>"
        }}
    ],
    "skills": ["<list of skills, prioritizing those matching the job description>"],
    "certifications": ["<list of certifications if any>"],
    "estimated_score": <number 0-100, estimated ATS score after optimization>
}}
"""


async def optimize_cv(
    cv_text: str,
    job_description: str,
    analysis_summary: str = "",
    missing_keywords: Optional[list[str]] = None,
) -> OptimizedCV:
    """
    Generate an optimized version of a CV using Gemini AI.

    Args:
        cv_text: The extracted text content from the original CV.
        job_description: The job description to optimize for.
        analysis_summary: Summary from the ATS analysis.
        missing_keywords: Keywords that were not found in the original CV.

    Returns:
        OptimizedCV with structured, optimized content.
    """
    prompt = CV_OPTIMIZE_PROMPT.format(
        cv_text=cv_text,
        job_description=job_description,
        analysis_summary=analysis_summary or "No prior analysis available.",
        missing_keywords=", ".join(missing_keywords) if missing_keywords else "None identified.",
    )

    response_text = await generate_content(prompt, max_tokens=4096)

    data = _parse_json_response(response_text)

    contact = data.get("contact", {})
    experience = [
        OptimizedCVSection(
            title=exp.get("title", ""),
            organization=exp.get("company", ""),
            period=exp.get("period", ""),
            bullets=exp.get("bullets", []),
        )
        for exp in data.get("experience", [])
    ]
    education = [
        OptimizedCVSection(
            title=edu.get("degree", ""),
            organization=edu.get("institution", ""),
            period=edu.get("period", ""),
            details=edu.get("details"),
        )
        for edu in data.get("education", [])
    ]

    return OptimizedCV(
        contact_name=contact.get("name", ""),
        contact_email=contact.get("email"),
        contact_phone=contact.get("phone"),
        contact_location=contact.get("location"),
        contact_linkedin=contact.get("linkedin"),
        summary=data.get("summary", ""),
        experience=experience,
        education=education,
        skills=data.get("skills", []),
        certifications=data.get("certifications", []),
        estimated_score=data.get("estimated_score", 80),
    )


def _parse_json_response(response_text: str) -> dict:
    """Parse JSON from Gemini response."""
    json_match = re.search(r'\{[\s\S]*\}', response_text)
    if json_match:
        try:
            return json.loads(json_match.group())
        except json.JSONDecodeError:
            pass

    return {
        "contact": {},
        "summary": "Unable to optimize CV. Please try again.",
        "experience": [],
        "education": [],
        "skills": [],
        "certifications": [],
        "estimated_score": 50,
    }
