import test from 'node:test';
import assert from 'node:assert/strict';
import { extractAssistantPayload } from '../gemini.js';

test('extractAssistantPayload builds a direct URL action from the prompt', () => {
    const payload = extractAssistantPayload('Open GitHub for me');
    assert.equal(payload.type, 'OPEN_URL');
    assert.equal(payload.targetUrl, 'https://github.com');
});

test('extractAssistantPayload builds a YouTube play action from the prompt', () => {
    const payload = extractAssistantPayload('Play Shape of You on YouTube');
    assert.equal(payload.type, 'YOUTUBE_PLAY');
    assert.equal(payload.targetUrl, 'https://www.youtube.com/results?search_query=shape%20of%20you');
});

test('extractAssistantPayload builds a Google search action from the prompt', () => {
    const payload = extractAssistantPayload('Search weather in Mumbai on Google');
    assert.equal(payload.type, 'GOOGLE_SEARCH');
    assert.equal(payload.targetUrl, 'https://www.google.com/search?q=weather%20in%20mumbai');
});

test('extractAssistantPayload parses a strict JSON payload from the model response', () => {
    const payload = extractAssistantPayload('Open Gmail', '{"type":"OPEN_URL","userQuery":"open gmail","targetUrl":"https://mail.google.com","response":"Opening Gmail."}');
    assert.equal(payload.type, 'OPEN_URL');
    assert.equal(payload.targetUrl, 'https://mail.google.com');
    assert.equal(payload.response, 'Opening Gmail.');
});
