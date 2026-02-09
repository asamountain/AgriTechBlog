/**
 * Claude AI Prompt Templates for Blog Generation
 *
 * These prompts are used to guide Claude in generating high-quality,
 * style-consistent blog posts from Notion content.
 */

export interface StyleProfile {
  tone: string;
  averagePostLength: number;
  commonPatterns: string[];
  vocabularyLevel: 'technical' | 'general' | 'mixed';
  structurePreferences: {
    usesHeadings: boolean;
    usesLists: boolean;
    usesCodeBlocks: boolean;
    introStyle: string;
    conclusionStyle: string;
  };
  exampleExcerpts: string[];
}

/**
 * Prompt for analyzing images to extract relevant information
 */
export function getImageAnalysisPrompt(context: string): string {
  return `You are analyzing an image for a blog post about agricultural technology (AgriTech).

Context: ${context}

Please analyze this image and provide:
1. **Main Subject**: What is the primary focus of the image?
2. **Technical Details**: Any visible technology, equipment, sensors, or systems
3. **Agricultural Context**: What agricultural process or concept is shown?
4. **Key Observations**: Important details that would be relevant for a blog post
5. **Suggested Caption**: A brief, informative caption for this image

Format your response as JSON with these fields: mainSubject, technicalDetails, agriculturalContext, keyObservations, suggestedCaption`;
}

/**
 * Prompt for analyzing user's writing style from existing posts
 */
export const STYLE_ANALYSIS_PROMPT = `You are analyzing blog posts to determine the author's writing style.

Your task is to analyze the provided blog posts and create a comprehensive style profile.

Focus on:
1. **Tone**: Is it technical, educational, casual, enthusiastic, professional?
2. **Structure**: How does the author organize content? (headings, lists, paragraphs)
3. **Introduction Style**: How do posts typically begin? (hook, context, direct statement)
4. **Conclusion Style**: How do posts end? (summary, call-to-action, forward-looking)
5. **Vocabulary Level**: Technical jargon, general audience, or mixed?
6. **Common Patterns**: Recurring phrases, transitions, or formatting
7. **Content Length**: Average post length and paragraph size
8. **Technical Depth**: How deeply do they dive into technical topics?

Provide your analysis in the following JSON format:
{
  "tone": "<description of overall tone>",
  "averagePostLength": <average word count>,
  "vocabularyLevel": "technical" | "general" | "mixed",
  "structurePreferences": {
    "usesHeadings": boolean,
    "usesLists": boolean,
    "usesCodeBlocks": boolean,
    "introStyle": "<description>",
    "conclusionStyle": "<description>"
  },
  "commonPatterns": ["<pattern 1>", "<pattern 2>", ...],
  "exampleExcerpts": ["<representative excerpt 1>", "<excerpt 2>", ...}
}`;

/**
 * Main blog post generation prompt with style injection
 */
export function getBlogGenerationPrompt(params: {
  styleProfile: StyleProfile;
  notionText: string;
  imageAnalyses: Array<{ description: string; caption: string }>;
  metadata: {
    suggestedTitle?: string;
    tags?: string[];
  };
}): string {
  const { styleProfile, notionText, imageAnalyses, metadata } = params;

  const imageContext = imageAnalyses.length > 0
    ? `\n\n**Visual Elements**:\n${imageAnalyses.map((img, idx) => `Image ${idx + 1}: ${img.description}\nSuggested caption: ${img.caption}`).join('\n\n')}`
    : '';

  return `You are a skilled technical writer for an AgriTech blog platform. Your task is to transform the provided notes and images into a polished, engaging blog post.

**CRITICAL: Match the Author's Writing Style**

The author's established style profile:
- **Tone**: ${styleProfile.tone}
- **Typical Length**: ${styleProfile.averagePostLength} words
- **Vocabulary**: ${styleProfile.vocabularyLevel}
- **Introduction Style**: ${styleProfile.structurePreferences.introStyle}
- **Conclusion Style**: ${styleProfile.structurePreferences.conclusionStyle}
- **Uses Headings**: ${styleProfile.structurePreferences.usesHeadings ? 'Yes' : 'No'}
- **Uses Lists**: ${styleProfile.structurePreferences.usesLists ? 'Yes' : 'No'}
- **Uses Code Blocks**: ${styleProfile.structurePreferences.usesCodeBlocks ? 'Yes' : 'No'}

**Common Patterns** in the author's writing:
${styleProfile.commonPatterns.map(p => `- ${p}`).join('\n')}

**Example Excerpts** from the author's previous work:
${styleProfile.exampleExcerpts.map((e, i) => `\n--- Example ${i + 1} ---\n${e}`).join('\n')}

---

**Content to Transform**:

${notionText}
${imageContext}

---

**Your Task**:

1. **Match the Style**: Write in the EXACT tone and style as demonstrated in the examples above
2. **Organize Content**: Structure the post according to the author's preferences
3. **Expand & Polish**: Elaborate on key points while maintaining the author's voice
4. **Engage the Audience**: Write for AgriTech professionals, IoT engineers, and smart farming enthusiasts
5. **Technical Accuracy**: Ensure technical details are accurate and well-explained
6. **Visual Integration**: Reference and describe the images naturally within the content
7. **SEO-Friendly**: Include relevant keywords naturally

**Requirements**:
- Target length: ${styleProfile.averagePostLength} words (±20%)
- Use clear headings (## for main sections, ### for subsections)
- Include relevant technical details
- Make it educational and actionable
- Write an engaging introduction that hooks the reader
- Conclude with a strong takeaway or call-to-action

**Output Format**:

Provide your response in the following JSON format:
\`\`\`json
{
  "title": "Engaging, descriptive title (60 characters max)",
  "excerpt": "Compelling 1-2 sentence summary that makes readers want to learn more",
  "content": "Full blog post content in Markdown format...",
  "suggestedTags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "readTimeMinutes": <estimated read time>,
  "featuredImageCaption": "Caption for the featured image (if any)"
}
\`\`\`

**Important Notes**:
- DO match the author's established voice and style
- DO expand on the raw notes to create a complete, polished article
- DO use markdown formatting (headings, lists, bold, italic, code blocks)
- DO NOT use phrases like "In this blog post" or "Today we'll explore"
- DO NOT use a tone different from the style profile
- DO NOT make up technical details not present in the source material
- DO write in a way that the author would naturally write`;
}

/**
 * Prompt for refining/polishing an existing draft
 */
export function getPolishingPrompt(draft: string, feedback: string): string {
  return `You are refining a blog post draft based on editorial feedback.

**Original Draft**:
${draft}

**Feedback**:
${feedback}

Please revise the draft incorporating the feedback while maintaining:
1. The original style and tone
2. Technical accuracy
3. Engaging readability
4. SEO best practices

Provide the polished version in Markdown format.`;
}

/**
 * Prompt for generating SEO-optimized metadata
 */
export function getSEOOptimizationPrompt(content: string, title: string): string {
  return `You are an SEO expert optimizing a blog post for search engines and AI chatbot discovery.

**Title**: ${title}

**Content**:
${content.substring(0, 2000)}... (truncated)

Please provide SEO recommendations in JSON format:
\`\`\`json
{
  "optimizedTitle": "SEO-friendly title variation",
  "metaDescription": "Compelling 150-160 character meta description",
  "primaryKeywords": ["keyword1", "keyword2", "keyword3"],
  "secondaryKeywords": ["keyword4", "keyword5", "keyword6"],
  "suggestedTags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "internalLinkSuggestions": ["topic to link to 1", "topic to link to 2"],
  "improvementTips": ["tip1", "tip2", "tip3"]
}
\`\`\``;
}

/**
 * Prompt for extracting structured data from Notion blocks
 */
export const NOTION_CONTENT_EXTRACTION_PROMPT = `You are extracting and structuring content from Notion page blocks.

The content may include:
- Text paragraphs
- Headings
- Bullet lists
- Numbered lists
- Code blocks
- Callouts/quotes
- Toggle lists

Your task is to convert this into clean, structured Markdown while:
1. Preserving the hierarchy and structure
2. Converting formatting (bold, italic, code)
3. Maintaining lists and nested content
4. Converting callouts to appropriate markdown (blockquotes or admonitions)
5. Keeping code blocks with proper language tags

Output clean Markdown that can be directly used in a blog post.`;

/**
 * Prompt for video content analysis (when video frames are provided)
 */
export function getVideoAnalysisPrompt(context: string): string {
  return `You are analyzing video frames from content about agricultural technology.

Context: ${context}

For each frame provided, describe:
1. What is happening in the scene
2. Any relevant technology or equipment shown
3. Key processes or concepts being demonstrated
4. How this relates to AgriTech or smart farming

Then, provide a summary of the video's main points and how they should be incorporated into the blog post.

Format your response as JSON:
{
  "frames": [
    {"timestamp": "0:00", "description": "..."},
    {"timestamp": "0:15", "description": "..."}
  ],
  "summary": "Overall video summary",
  "keyTakeaways": ["takeaway1", "takeaway2"],
  "suggestedIntegration": "How to integrate this into the blog post"
}`;
}

/**
 * Prompt for generating social media snippets from blog post
 */
export function getSocialMediaPrompt(blogPost: string, platform: 'twitter' | 'linkedin' | 'instagram'): string {
  const limits = {
    twitter: '280 characters',
    linkedin: '3000 characters (but keep it concise)',
    instagram: 'Caption with hashtags (2200 characters max)',
  };

  return `Create a ${platform} post promoting this blog article.

**Blog Content**:
${blogPost.substring(0, 1000)}... (truncated)

**Requirements**:
- Platform: ${platform}
- Limit: ${limits[platform]}
- Engaging and clickable
- Include relevant hashtags (if appropriate for ${platform})
- Include a call-to-action

Provide the ${platform} post text only, ready to copy-paste.`;
}
