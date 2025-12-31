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

PLANNING_SYSTEM_PROMPT = """You are a Visionary Software Architect and Product Designer. Your goal is to design a cutting-edge, beautiful, and highly functional architecture for a React application.

CRITICAL INSTRUCTIONS:
1. **BE CREATIVE**: Do not just build a standard app. Suggest modern UI patterns, glassmorphism, gradients, smooth animations (Framer Motion), and intuitive UX flows.
2. **DETAILED BLUEPRINT**: Create a comprehensive technical plan including:
    - **Component Architecture**: List all key components and their responsibilities.
    - **State Management**: How will data flow? (Context API, Zustand, or simple props).
    - **UI/UX Strategy**: Specific color palettes (Tailwind classes), typography choices, and animation strategies.
    - **File Structure**: A detailed tree of the project structure.
3. **TECH STACK**: React 18, Tailwind CSS, Framer Motion (for animations), Lucide React (icons).

OUTPUT FORMAT:
Return a Markdown-formatted "Implementation Blueprint" that is detailed enough for a developer to build directly from.
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
        Async generator yielding status updates and finally the result
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
        # STEP 1: PLANNING PHASE (Gemini 3 Flash)
        print("[DevDraft] 🧠 Phase 1: Dreaming up a plan with Gemini 3 Flash...")
        yield {"status": "planning", "message": "Phase 1: Architecting solution with Gemini 3 Flash..."}
        
        planning_prompt = f"""Create a detailed technical blueprint for this project:

## Project Summary
{project_spec.get('project_summary', 'A web application')}

## Requirements
{requirements_text}

## Creative Direction
{', '.join(ui_preferences) if ui_preferences else 'Modern, clean, professional design'}

Be highly creative. Design a system that impresses.
"""

        plan_response = await client.aio.models.generate_content(
            model='gemini-3-flash-preview',
            contents=[
                {"role": "user", "parts": [{"text": PLANNING_SYSTEM_PROMPT}]},
                {"role": "user", "parts": [{"text": planning_prompt}]}
            ],
            config={
                'temperature': 0.85, # High creativity
            }
        )
        
        blueprint = plan_response.text
        print(f"[DevDraft] 📝 Blueprint created ({len(blueprint)} chars). Passing to builder...")
        yield {"status": "planning_complete", "message": "Blueprint created. Initializing builder..."}

        # STEP 2: BUILDING PHASE (Gemini 3 Flash)
        # We inject the Blueprint into the builder's context
        builder_context = f"""
{user_prompt}

## ARCHITECTURAL BLUEPRINT (FOLLOW THIS PLAN):
{blueprint}

Execute this plan exactly. Generate the corresponding code modules.
"""

        print("[DevDraft] 🔨 Phase 2: Building code with Gemini 3 Flash...")
        yield {"status": "building", "message": "Phase 2: Generating code modules with Gemini 3 Flash..."}
        
        response = await client.aio.models.generate_content(
            model='gemini-3-flash-preview',
            contents=[
                {"role": "user", "parts": [{"text": CODE_GEN_SYSTEM_PROMPT}]},
                {"role": "model", "parts": [{"text": "I understand. I will generate complete, working React code based on your Blueprint and return it as a JSON object."}]},
                {"role": "user", "parts": [{"text": builder_context}]}
            ],
            config={
                'response_mime_type': 'application/json',
                'temperature': 0.7, 
            }
        )
        
        # Parse the response
        text_response = response.text.replace("```json", "").replace("```", "").strip()
        result = json.loads(text_response)
        
        # Validate structure
        if 'files' not in result:
            raise ValueError("Response missing 'files' array")
            
        yield {
            "status": "complete",
            "success": True,
            "project_name": result.get("project_name", "devdraft-project"),
            "files": result.get("files", []),
            "setup_commands": result.get("setup_commands", ["npm install", "npm run dev"]),
            "description": result.get("description", "Generated project")
        }
        
    except json.JSONDecodeError as e:
        print(f"[DevDraft] JSON parse error in code generation: {e}")
        yield {
            "status": "error",
            "success": False,
            "error": "Failed to parse generated code. Please try again.",
            "files": []
        }
    except Exception as e:
        print(f"[DevDraft] Code generation error: {e}")
        yield {
            "status": "error",
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
