import fetch from 'node-fetch';

async function main() {
  const response = await fetch('http://localhost:3000/api/search', {
    method: 'POST',
  });

  if (response.ok) {
    console.log('Successfully indexed polls.');
  } else {
    console.error('Failed to index polls:', await response.text());
  }
}

main().catch(console.error);
