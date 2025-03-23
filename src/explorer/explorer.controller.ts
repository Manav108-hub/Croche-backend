// src/explorer/explorer.controller.ts
import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { Public } from '../common/decorators/public.decorator';

@Controller('explorer')
export class ExplorerController {
  @Public()
  @Get()
  explorer(@Res() res: Response) {
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>GraphQL Explorer</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body {
      height: 100%;
      margin: 0;
      width: 100%;
      overflow: hidden;
    }
    #graphiql {
      height: 100vh;
    }
    .graphiql-explorer-root {
      min-width: 300px;
    }
  </style>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⚡</text></svg>">
  <link rel="stylesheet" href="https://unpkg.com/graphiql/graphiql.min.css" />
  <link rel="stylesheet" href="https://unpkg.com/@graphiql/plugin-explorer/dist/style.css" />
</head>
<body>
  <div id="graphiql">Loading...</div>
  <script src="https://unpkg.com/react@17/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@17/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/graphiql/graphiql.min.js"></script>
  <script src="https://unpkg.com/@graphiql/plugin-explorer/dist/index.umd.js"></script>

  <script>
    const explorerPlugin = GraphiQLPluginExplorer.explorerPlugin();
    
    const fetchURL = '/graphql';
    
    function graphQLFetcher(graphQLParams) {
      return fetch(fetchURL, {
        method: 'post',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(graphQLParams),
        credentials: 'same-origin',
      }).then(function (response) {
        return response.json().catch(function () {
          return response.text();
        });
      });
    }
    
    ReactDOM.render(
      React.createElement(GraphiQL, {
        fetcher: graphQLFetcher,
        defaultVariableEditorOpen: true,
        plugins: [explorerPlugin],
        headerEditorEnabled: true,
        shouldPersistHeaders: true
      }),
      document.getElementById('graphiql'),
    );
  </script>
</body>
</html>`;

    res.send(html);
  }
}