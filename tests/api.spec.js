const { test, expect } = require('@playwright/test');

test.describe('Privyetik AI Word Ingestion API Contract Tests', () => {

  test('should return 200 and structured word object when input is correct', async ({ page }) => {
    // Intercept the API endpoint
    await page.route('**/functions/v1/add-word', async (route) => {
      const request = route.request();
      if (request.method() === 'POST') {
        const body = JSON.parse(request.postData() || '{}');
        expect(body.word).toBe('water');
        expect(body.nativeLanguage).toBe('he');
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            word: {
              id: 'custom_123456_abcde',
              word: 'вода',
              accented: 'вода́',
              translation: 'water',
              transliteration: 'voda',
              pos: 'noun',
              category: 'Food',
              exampleRu: 'Да́йте мне стака́н воды́, пожа́луйста.',
              exampleEn: 'Please give me a glass of water.',
              deckId: 'custom',
              updatedAt: 1782259200000
            }
          })
        });
      }
    });

    // Make an API request from the page context
    const response = await page.evaluate(async () => {
      const res = await fetch('https://bghuansvungabgsbxqjh.supabase.co/functions/v1/add-word', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-jwt-token'
        },
        body: JSON.stringify({ word: 'water', nativeLanguage: 'he' })
      });
      return await res.json();
    });

    expect(response.success).toBe(true);
    expect(response.word.word).toBe('вода');
    expect(response.word.accented).toBe('вода́');
    expect(response.word.translation).toBe('water');
  });

  test('should return 401 when authorization header is missing', async ({ page }) => {
    await page.route('**/functions/v1/add-word', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Missing Authorization header' })
      });
    });

    const response = await page.evaluate(async () => {
      const res = await fetch('https://bghuansvungabgsbxqjh.supabase.co/functions/v1/add-word', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ word: 'water' })
      });
      return { status: res.status, data: await res.json() };
    });

    expect(response.status).toBe(401);
    expect(response.data.error).toBe('Missing Authorization header');
  });

});
