export type PromptSourceType = 'json-feed' | 'csv-feed' | 'html' | 'github-repo' | 'github-search';

export type PromptSourceConfig = {
  name: string;
  url: string;
  type: PromptSourceType;
  priority: number;
  fetchUrl?: string;
};

export const DEFAULT_PROMPT_SOURCES: PromptSourceConfig[] = [
  {
    name: 'GitHub awesome prompts search',
    url: 'https://github.com/search?q=awesome+prompts&type=repositories',
    type: 'github-search',
    priority: 5,
    fetchUrl: 'https://api.github.com/search/repositories?q=awesome+prompts&sort=stars&order=desc&per_page=10',
  },
  {
    name: 'awesome-chatgpt-prompts',
    url: 'https://github.com/f/awesome-chatgpt-prompts',
    type: 'csv-feed',
    priority: 5,
    fetchUrl: 'https://raw.githubusercontent.com/f/awesome-chatgpt-prompts/main/prompts.csv',
  },
  {
    name: 'OpenAI Cookbook',
    url: 'https://github.com/openai/openai-cookbook',
    type: 'github-repo',
    priority: 5,
  },
  {
    name: 'Anthropic Prompt Library',
    url: 'https://docs.anthropic.com/en/prompt-library',
    type: 'html',
    priority: 5,
  },
  {
    name: 'Anthropic Cookbook',
    url: 'https://github.com/anthropics/anthropic-cookbook',
    type: 'github-repo',
    priority: 5,
  },
  {
    name: 'Google Gemini Prompt Gallery',
    url: 'https://ai.google.dev/gemini-api/prompts',
    type: 'html',
    priority: 4,
  },
  {
    name: 'Google Gemini Cookbook',
    url: 'https://github.com/google-gemini/cookbook',
    type: 'github-repo',
    priority: 4,
  },
  {
    name: 'Microsoft Prompt Engineering Guide',
    url: 'https://learn.microsoft.com/azure/ai-services/openai/concepts/prompt-engineering',
    type: 'html',
    priority: 4,
  },
  {
    name: 'LangChain Hub',
    url: 'https://smith.langchain.com/hub',
    type: 'html',
    priority: 4,
  },
  {
    name: 'CrewAI Examples',
    url: 'https://github.com/crewAIInc/crewAI-examples',
    type: 'github-repo',
    priority: 4,
  },
  {
    name: 'AutoGen Examples',
    url: 'https://github.com/microsoft/autogen',
    type: 'github-repo',
    priority: 4,
  },
  {
    name: 'LlamaIndex Examples',
    url: 'https://github.com/run-llama/llama_index',
    type: 'github-repo',
    priority: 4,
  },
  {
    name: 'DSPy Examples',
    url: 'https://github.com/stanfordnlp/dspy',
    type: 'github-repo',
    priority: 4,
  },
  {
    name: 'OpenRouter Docs',
    url: 'https://openrouter.ai/docs',
    type: 'html',
    priority: 3,
  },
  {
    name: 'Mistral Docs',
    url: 'https://docs.mistral.ai',
    type: 'html',
    priority: 3,
  },
  {
    name: 'Cohere Docs',
    url: 'https://docs.cohere.com',
    type: 'html',
    priority: 3,
  },
  {
    name: 'Hugging Face Prompt Datasets',
    url: 'https://huggingface.co/datasets',
    type: 'html',
    priority: 3,
  },
];
