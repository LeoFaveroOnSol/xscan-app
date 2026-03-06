/**
 * Script to update rekzed1's profile image manually
 *
 * Usage:
 * 1. Save the pixel art image to: public/images/kols/rekzed1.png
 * 2. Run: npx ts-node scripts/update-rekzed1-image.ts
 *
 * Or simply call the API:
 * curl -X PATCH http://localhost:3000/api/kols/rekzed1 \
 *   -H "Content-Type: application/json" \
 *   -d '{"profile_image_url": "/images/kols/rekzed1.png"}'
 */

const REKZED1_IMAGE_URL = '/images/kols/rekzed1.png';

async function updateRekzed1Image() {
  try {
    const response = await fetch('http://localhost:3000/api/kols/rekzed1', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        profile_image_url: REKZED1_IMAGE_URL,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Successfully updated rekzed1 profile image!');
      console.log('New image URL:', REKZED1_IMAGE_URL);
      console.log('KOL data:', data.kol);
    } else {
      console.error('❌ Failed to update:', data.error);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

updateRekzed1Image();
