"""
DevDraft AI - Code Generation Service

Uses Google Gemini to generate complete, working React projects
based on extracted requirements from client conversations.
"""

import json
from google import genai

# Code Generation System Prompt
CODE_GEN_SYSTEM_PROMPT = """You are an expert full-stack developer specializing in modern React applications with Tailwind CSS. Your job is to generate complete, production-ready code based on project requirements.

CRITICAL RULES:
1. **COMPLETE CODE ONLY**: Generate fully working code with NO placeholders, TODOs, or "implement here" comments.
2. **MODERN STACK**: Use React 18 with functional components and hooks + Tailwind CSS for styling.
3. **TAILWIND CSS**: You MUST use Tailwind CSS. Include all configuration files needed for Tailwind to work.
4. **DEPENDENCIES**: Include all required dependencies in package.json including tailwindcss, postcss, autoprefixer.
5. **WORKING CODE**: Every file must be syntactically correct and runnable with `npm install && npm run dev`.

OUTPUT FORMAT:
Return ONLY a valid JSON object with this exact structure:
{
  "project_name": "my-app",
  "files": [
    {
      "path": "package.json",
      "content": "{ \\"name\\": \\"my-app\\", ... }"
    }
  ],
  "setup_commands": ["npm install", "npm run dev"],
  "description": "Brief description of what was built"
}

REQUIRED FILES (YOU MUST INCLUDE ALL OF THESE):
1. package.json - Include these devDependencies: "tailwindcss": "^3.4.0", "postcss": "^8.4.0", "autoprefixer": "^10.4.0"
2. vite.config.js - Standard Vite React config
3. tailwind.config.js - CRITICAL! Must have: content: ["./index.html", "./src/**/*.{js,jsx}"]
4. postcss.config.js - CRITICAL! Must export: { plugins: { tailwindcss: {}, autoprefixer: {} } }
5. index.html - Entry HTML with <div id="root"></div>
6. src/main.jsx - Must import './index.css' FIRST before React
7. src/App.jsx - Main application component with Tailwind classes
8. src/index.css - MUST CONTAIN these Tailwind directives:
   @tailwind base;
   @tailwind components;
   @tailwind utilities;

STYLING GUIDELINES:
- Use Tailwind utility classes extensively (e.g., "flex items-center gap-4 bg-white p-6 rounded-xl shadow-lg")
- For minimalist light mode: bg-white, bg-gray-50, text-gray-900, clean shadows
- For dark mode: bg-gray-900, bg-gray-800, text-white
- Use modern spacing: p-4, p-6, p-8, gap-4, gap-6
- Rounded corners: rounded-lg, rounded-xl, rounded-2xl
- Shadows: shadow-sm, shadow-md, shadow-lg
- Smooth transitions: transition-all, duration-200, hover:scale-105
- Professional fonts: font-sans, font-medium, font-semibold, font-bold
- Responsive: sm:, md:, lg: breakpoint prefixes

EXAMPLE tailwind.config.js (ALWAYS INCLUDE):
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: { extend: {} },
  plugins: [],
}

EXAMPLE postcss.config.js (ALWAYS INCLUDE):
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}

EXAMPLE src/index.css (ALWAYS INCLUDE):
@tailwind base;
@tailwind components;
@tailwind utilities;
"""


async def generate_project_code(
    project_spec: dict,
    client: genai.Client
) -> dict:
    """
    Generates a complete React project based on the project specification.
    
    Args:
        project_spec: The extracted project specification from voice analysis
        client: Initialized Gemini client
        
    Returns:
        Dictionary containing generated files and setup instructions
    """
    
    # Build the generation prompt
    requirements_text = "\n".join([
        f"- {r['description']}" 
        for r in project_spec.get('requirements', []) 
        if r.get('status') == 'active'
    ])
    
    tech_stack = project_spec.get('tech_stack', [])
    ui_preferences = project_spec.get('ui_preferences', [])
    
    user_prompt = f"""Generate a complete React application based on these requirements:

## Project Summary
{project_spec.get('project_summary', 'A web application')}

## Features/Requirements
{requirements_text}

## Tech Stack Preferences
{', '.join(tech_stack) if tech_stack else 'React with Vite, modern CSS'}

## UI/UX Preferences  
{', '.join(ui_preferences) if ui_preferences else 'Modern, clean, professional design'}

Generate the complete project now. Remember to output ONLY valid JSON with the file structure.
"""

    try:
        # Use Gemini 2.0 Flash for code generation (most capable for this task)
        response = await client.aio.models.generate_content(
            model='gemini-3-flash-preview',
            contents=[
                {"role": "user", "parts": [{"text": CODE_GEN_SYSTEM_PROMPT}]},
                {"role": "model", "parts": [{"text": "I understand. I will generate complete, working React code and return it as a JSON object with the file structure. Send me the project requirements."}]},
                {"role": "user", "parts": [{"text": user_prompt}]}
            ],
            config={
                'response_mime_type': 'application/json',
                'temperature': 0.7,  # Slightly creative but mostly deterministic
            }
        )
        
        # Parse the response
        text_response = response.text.replace("```json", "").replace("```", "").strip()
        result = json.loads(text_response)
        
        # Validate structure
        if 'files' not in result:
            raise ValueError("Response missing 'files' array")
            
        return {
            "success": True,
            "project_name": result.get("project_name", "devdraft-project"),
            "files": result.get("files", []),
            "setup_commands": result.get("setup_commands", ["npm install", "npm run dev"]),
            "description": result.get("description", "Generated project")
        }
        
    except json.JSONDecodeError as e:
        print(f"[DevDraft] JSON parse error in code generation: {e}")
        return {
            "success": False,
            "error": "Failed to parse generated code. Please try again.",
            "files": []
        }
    except Exception as e:
        print(f"[DevDraft] Code generation error: {e}")
        return {
            "success": False,
            "error": str(e),
            "files": []
        }


async def generate_single_file(
    file_description: str,
    project_context: str,
    client: genai.Client
) -> str:
    """
    Generates a single file for iterative development.
    Useful for adding features or fixing issues.
    """
    
    prompt = f"""Based on this project context:
{project_context}

Generate the following file:
{file_description}

Return ONLY the file content, no JSON wrapper, no markdown code blocks.
"""
    
    try:
        response = await client.aio.models.generate_content(
            model='gemini-3-flash-preview',
            contents=prompt
        )
        return response.text.strip()
    except Exception as e:
        print(f"[DevDraft] Single file generation error: {e}")
        return f"// Error generating file: {e}"
