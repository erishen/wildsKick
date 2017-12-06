## Start

1. Clone this repo.

2. Install dependencies.

        npm install
        npm install supervisor -g

3. Try these out.

    * `npm start` to develop with full live reload.
    * `npm run browsersync` is a alternative for development. It may be faster when modifying the express views
    (templates) only.
    * `npm run production` to emit outputs and run the express for production.
    * `npm run build` if you care about what is hold in memory for development...