import { Tspec } from 'tspec';

interface Author {
  id: number;
  name: string;
}

export type AuthorApiSpec = Tspec.DefineApiSpec<{
  paths: {
    '/authors/{id}': {
      get: {
        summary: 'Get author by id',
        path: { id: number },
        responses: { 
          200: Author,
          404: { message: string },
        },
      },
    },
  }
}>;
