# Ollama Integration

This document describes how the Ollama integration works in the application.

## Overview

The application now supports two AI models:
1. **Gemini** - Google's Gemini AI model (default)
2. **Ollama** - Self-hosted open-source model via Ollama

## How It Works

### Model Selection

Users can switch between models using the model selector button in the chat input area. The selected model is stored in localStorage and persisted across sessions.

### API Integration

- **Gemini**: Uses the Google AI SDK to communicate with the Gemini API
- **Ollama**: Connects to a self-hosted Ollama instance at `http://natural-markets.gl.at.ply.gg:28881`

### Implementation Details

1. **Model State**: The selected model is stored in the chat store (`chatStore.ts`) and persisted in localStorage
2. **API Routes**: 
   - `/api/ai/stream` - Handles Gemini requests
   - `/api/ai/ollama/stream` - Handles Ollama requests
3. **UI Components**: 
   - `ModelSelector.tsx` - Provides a dropdown to switch between models
   - Added to `ChatInputArea.tsx` alongside other controls

## Technical Notes

- Ollama API uses a different format than the Google AI SDK, so we transform the responses to match the expected format
- Streaming is implemented for both models to provide a consistent user experience
- Error handling is implemented for both APIs

## Future Improvements

- Add support for selecting specific models within Ollama (currently hardcoded to 'llama3')
- Add configuration options for the Ollama endpoint
- Implement fallback mechanisms if one model is unavailable
