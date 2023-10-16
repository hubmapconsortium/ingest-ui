# HuBMAP Data Ingest Portal Testing

The HuBMAP Data Ingest Portal UI uses Cypress for testing

## Configuration and local development

Create `cypress.env.jso` file base on `cypress.example.env.json` file in the first `src` directory.

Username and Password should be your Pitt Login

For local development, use localhost:8585

## Running

Enter the following in your console:

```
 npm run cypress:open
```

In the screen that follows, select E2E (End to end), followed by selecting the testing browser of your choice,-, and finally click on “Start E2E Testing in” your selected browser


To run, select a test from the list.