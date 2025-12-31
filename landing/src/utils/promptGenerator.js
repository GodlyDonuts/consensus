
/**
 * DevDraft AI - Super-Prompt Generator
 * 
 * Converts project specifications from voice transcription into
 * formatted prompts optimized for agentic coding tools.
 */

const TOOL_URLS = {
    lovable: 'https://lovable.dev',
    bolt: 'https://bolt.new',
    replit: 'https://replit.com/agent',
    v0: 'https://v0.dev'
};

const TOOL_NAMES = {
    lovable: 'Lovable',
    bolt: 'Bolt.new',
    replit: 'Replit Agent',
    v0: 'v0 by Vercel'
};

/**
 * Generates a formatted "super-prompt" optimized for agentic coding tools.
 */
export const generateSuperPrompt = (spec) => {
    const activeRequirements = spec.requirements.filter(r => r.status === 'active');

    let prompt = `Build a web application with the following specifications:

## Project Summary
${spec.project_summary}

## Tech Stack
${spec.tech_stack.length > 0 ? spec.tech_stack.join(', ') : 'Use modern best practices - suggest appropriate technologies'}

## Requirements
${activeRequirements.map(r => `- ${r.description}`).join('\n')}
`;

    if (spec.ui_preferences && spec.ui_preferences.length > 0) {
        prompt += `\n## UI/UX Preferences\n${spec.ui_preferences.map(p => `- ${p}`).join('\n')}\n`;
    }

    prompt += `\nPlease start by scaffolding the main components and implementing the core features.`;

    if (spec.raw_transcript_snapshot) {
        prompt += `\n\n## Raw Transcript Reference\n<details>\n<summary>Full conversation transcript</summary>\n\n${spec.raw_transcript_snapshot}\n\n</details>`;
    }

    return prompt;
};

/**
 * Generates a more detailed prompt including the full conversation context.
 */
export const generateDetailedPrompt = (spec) => {
    const basicPrompt = generateSuperPrompt(spec);

    // Include superseded requirements for context
    const supersededRequirements = spec.requirements.filter(r => r.status === 'superseded');

    let detailedPrompt = basicPrompt;

    if (supersededRequirements.length > 0) {
        detailedPrompt += `\n\n## Historical Context (Changed Requirements)\nThe following requirements were initially discussed but later changed:\n${supersededRequirements.map(r => `- ~~${r.description}~~`).join('\n')}\n`;
    }

    if (spec.raw_transcript_snapshot) {
        detailedPrompt += `\n## Raw Transcript Reference\n<details>\n<summary>Full conversation transcript</summary>\n\n${spec.raw_transcript_snapshot}\n\n</details>`;
    }

    return detailedPrompt;
};

/**
 * Copies the prompt to clipboard and opens the selected agentic tool.
 */
export const copyToClipboardAndRedirect = async (prompt, tool) => {
    try {
        await navigator.clipboard.writeText(prompt);

        const url = TOOL_URLS[tool];
        window.open(url, '_blank');

        return {
            success: true,
            message: `Prompt copied! Opening ${TOOL_NAMES[tool]}...`
        };
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        return {
            success: false,
            message: 'Failed to copy to clipboard. Please try again.'
        };
    }
};

/**
 * Downloads the prompt as a markdown file for manual use.
 */
export const downloadPromptAsFile = (spec) => {
    const prompt = generateDetailedPrompt(spec);
    const blob = new Blob([prompt], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `devdraft-spec-${new Date().toISOString().split('T')[0]}.md`;
    a.click();

    URL.revokeObjectURL(url);
};

/**
 * Returns the list of available tools for the UI dropdown.
 */
export const getAvailableTools = () => {
    return [
        { value: 'lovable', label: '🧡 Lovable' },
        { value: 'bolt', label: '⚡ Bolt.new' },
        { value: 'replit', label: '🤖 Replit Agent' },
        { value: 'v0', label: '▲ v0 by Vercel' }
    ];
};
