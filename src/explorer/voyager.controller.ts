// src/explorer/voyager.controller.ts
import { Controller, Get, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { Public } from '../common/decorators/public.decorator';

@Controller('voyager')
export class VoyagerController {
  @Public()
  @Get()
  voyager(@Res() res: Response) {
    try {
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>GraphQL Voyager</title>
  <link rel="stylesheet" href="https://unpkg.com/graphql-voyager@1.0.0-rc.31/dist/voyager.css" />
</head>
<body>
  <div id="voyager" style="height: 100vh;"></div>

  <script src="https://unpkg.com/react@16/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@16/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/graphql-voyager@1.0.0-rc.31/dist/voyager.min.js"></script>
  <script>
    function introspectionProvider(query) {
      return fetch('/graphql', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
        credentials: 'same-origin'
      }).then(response => response.json());
    }

    GraphQLVoyager.init(document.getElementById('voyager'), {
      introspection: introspectionProvider
    });
  </script>
</body>
</html>
      `.trim();

      res.status(HttpStatus.OK).send(html);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        status: 'error',
        message: 'Failed to initialize GraphQL Voyager',
        error: error.message,
      });
    }
  }
}