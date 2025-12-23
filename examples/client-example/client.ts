import { createClient } from 'tspec';
import { AuthorApiSpec } from './server';

const client = createClient<AuthorApiSpec>({
  baseUrl: 'https://api.example.com',
  baseHeaders: {
    'Content-Type': 'application/json',
  },
});

async function main() {
  const result = await client.get('/authors/{id}', {
    params: { id: 1 },
  });

  if (result.status === 200) {
    console.log(result.body.name); // Fully typed as Author
  } else if (result.status === 404) {
    console.error(result.body.message); // Fully typed as { message: string }
  }
}

main();
